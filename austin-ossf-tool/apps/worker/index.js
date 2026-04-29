import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Lead scoring thresholds
const SCORE_INSTALL_LEAD = 70;
const SCORE_SERVICE_LEAD = 50;

/**
 * Sync OSSF records from all active sources
 */
async function syncAllSources() {
  console.log('Starting sync run...');
  const syncStartTime = new Date();

  let recordsSeen = 0;
  let recordsCreated = 0;
  let recordsUpdated = 0;

  try {
    // Fetch all active sources
    const { data: sources, error } = await supabase
      .from('sources')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    if (!sources || sources.length === 0) {
      console.log('No active sources found.');
      return;
    }

    console.log(`Found ${sources.length} active source(s).`);

    for (const source of sources) {
      console.log(`Syncing source: ${source.name}`);
      const result = await syncSource(source);
      recordsSeen += result.seen;
      recordsCreated += result.created;
      recordsUpdated += result.updated;
    }

    const syncEndTime = new Date();

    // Record the sync run
    await supabase.from('sync_runs').insert({
      status: 'completed',
      records_seen: recordsSeen,
      records_created: recordsCreated,
      records_updated: recordsUpdated,
      finished_at: syncEndTime.toISOString(),
      metadata: { duration_ms: syncEndTime - syncStartTime }
    });

    console.log(`Sync complete. Seen: ${recordsSeen}, Created: ${recordsCreated}, Updated: ${recordsUpdated}`);

    // Generate leads after sync
    await generateLeads();

  } catch (err) {
    console.error('Sync failed:', err);
    await supabase.from('sync_runs').insert({
      status: 'failed',
      records_seen: recordsSeen,
      records_created: recordsCreated,
      records_updated: recordsUpdated,
      metadata: { error: err.message }
    });
  }
}

/**
 * Sync a single source
 */
async function syncSource(source) {
  let seen = 0, created = 0, updated = 0;

  try {
    const response = await fetch(source.base_url, {
      headers: {
        'User-Agent': 'OSSF-Worker/1.0 (lead-gen-service)'
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${source.name}: ${response.status}`);
      return { seen: 0, created: 0, updated: 0 };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Generic scraper - each source may need custom selectors
    // This is a placeholder that can be extended per source
    const records = parseRecords($, source.source_type);

    for (const record of records) {
      seen++;

      // Check if record already exists
      const { data: existing } = await supabase
        .from('osff_records')
        .select('id')
        .eq('document_number', record.document_number)
        .single();

      if (existing) {
        // Update existing record
        await supabase
          .from('osff_records')
          .update({ result: record.result, metadata: record.metadata })
          .eq('id', existing.id);
        updated++;
      } else {
        // Insert new record
        await supabase.from('osff_records').insert(record);
        created++;
      }
    }
  } catch (err) {
    console.error(`Error syncing ${source.name}:`, err);
  }

  return { seen, created, updated };
}

/**
 * Parse records from HTML based on source type
 */
function parseRecords($, sourceType) {
  const records = [];

  // Placeholder parser - customize per source type
  // Real implementation would have source-specific selectors
  $('table tr').each((i, el) => {
    if (i === 0) return; // Skip header
    const $row = $(el);
    const cols = $row.find('td');
    if (cols.length < 3) return;

    records.push({
      property_id: null,
      system_id: null,
      record_type: sourceType,
      filing_date: new Date().toISOString().split('T')[0],
      document_number: $(cols[0]).text().trim() || null,
      result: $(cols[1]).text().trim() || null,
      expiry_date: null,
      metadata: { source_html: $row.html() }
    });
  });

  return records;
}

/**
 * Generate leads from OSSF records
 */
async function generateLeads() {
  console.log('Generating leads...');

  // Find records that indicate potential leads
  // e.g., new installations, failed inspections, expiring permits
  const { data: records, error } = await supabase
    .from('osff_records')
    .select('*, properties(*), septic_systems(*)')
    .is('id', null) // Get all records - in real impl filter by recent
    .limit(100);

  if (error || !records) return;

  for (const record of records) {
    const result = record.result?.toLowerCase() || '';
    let leadType = null;
    let score = 0;
    let reason = '';

    // Installation lead signals
    if (result.includes('install') || result.includes('new')) {
      leadType = 'new_install';
      score = SCORE_INSTALL_LEAD;
      reason = 'New installation record detected';
    }
    // Service lead signals
    else if (result.includes('fail') || result.includes('repair') || result.includes('pump')) {
      leadType = 'service_needed';
      score = SCORE_SERVICE_LEAD;
      reason = 'System requires service or repair';
    }
    else if (result.includes('expire') || result.includes('renew')) {
      leadType = 'permit_renewal';
      score = SCORE_SERVICE_LEAD;
      reason = 'Permit renewal needed';
    }

    if (leadType) {
      // Check if lead already exists
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('property_id', record.property_id)
        .eq('status', 'new')
        .single();

      if (!existingLead) {
        await supabase.from('leads').insert({
          property_id: record.property_id,
          system_id: record.system_id,
          lead_type: leadType,
          score: score,
          status: 'new',
          summary: reason,
          next_action: 'Contact property owner',
          assigned_to: null
        });

        // Also log the signal
        await supabase.from('lead_signals').insert({
          property_id: record.property_id,
          system_id: record.system_id,
          record_id: record.id,
          signal_type: leadType,
          signal_score: score,
          reason: reason
        });

        console.log(`Created lead: ${leadType} (score: ${score})`);
      }
    }
  }

  console.log('Lead generation complete.');
}

// Run sync immediately on startup
syncAllSources();

// Schedule daily sync at 2 AM
const dailySync = cron.schedule('0 2 * * *', () => {
  console.log('Running scheduled daily sync...');
  syncAllSources();
});

console.log('Worker started. Daily sync scheduled for 2 AM.');

// Keep the process alive
dailySync.start();
