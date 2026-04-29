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

// TCEQ Records Online base URL
const TCEQ_RECORDS_BASE = 'https://records.tceq.texas.gov/cs/idcplg';
// Record Series ID for OCE / On-Site Sewage Facilities
const RECORD_SERIES_ID = 1281;

// Counties to sync (Austin metro area)
const COUNTIES = [
  { name: 'TRAVIS', slug: 'travis' },
  { name: 'WILLIAMSON', slug: 'williamson' },
  { name: 'HAYS', slug: 'hays' },
  { name: 'BASTROP', slug: 'bastrop' },
  { name: 'CALDWELL', slug: 'caldwell' }
];

// Rate limiting
const REQUEST_DELAY_MS = 1500;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch detail page for a single OSSF record
 */
async function fetchEntityDetail(contentId, docName) {
  const url = `${TCEQ_RECORDS_BASE}?IdcService=TCEQ_EXTERNAL_SEARCH_DOC_INFO&dID=${contentId}&dDocName=${docName}&searchType=External&coreContentOnly=1&IsExternalSearch=1`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'OSSF-Worker/1.0 (lead-gen-service)'
      }
    });
    if (!response.ok) return null;
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract fields from detail page
    const getField = (label) => {
      let value = null;
      $('tr').each((i, el) => {
        const $row = $(el);
        const $td = $row.find('td').first();
        if ($td.text().trim().includes(label)) {
          const $valCell = $row.find('td').eq(1);
          value = $valCell.text().trim();
        }
      });
      return value;
    };
    
    // Try to get values from the detail table
    let regulatedEntityName = null;
    let physicalAddress = null;
    let city = null;
    let state = null;
    let zip = null;
    let county = null;
    let primaryId = null;
    let secondaryId = null;
    let beginDate = null;
    let endDate = null;
    let documentType = null;
    let title = null;
    let recordSeriesCode = null;
    let media = null;
    
    $('tr').each((i, el) => {
      const $row = $(el);
      const $cells = $row.find('td');
      if ($cells.length >= 2) {
        const label = $cells.eq(0).text().trim();
        const value = $cells.eq(1).text().trim();
        
        if (label === 'Regulated Entity Name:') regulatedEntityName = value;
        else if (label === 'Physical Address:') physicalAddress = value;
        else if (label === 'City Name:') city = value;
        else if (label === 'State Code:') state = value;
        else if (label === 'Zip Code:') zip = value;
        else if (label === 'County:') county = value;
        else if (label === 'Primary ID:') primaryId = value;
        else if (label === 'Secondary ID:') secondaryId = value;
        else if (label === 'Begin Date:') beginDate = value;
        else if (label === 'End Date:') endDate = value;
        else if (label === 'Document Type:') documentType = value;
        else if (label === 'Title:') title = value;
        else if (label === 'Record Series Code:') recordSeriesCode = value;
        else if (label === 'Media:') media = value;
      }
    });
    
    return {
      contentId,
      regulatedEntityName,
      physicalAddress,
      city,
      state,
      zip,
      county,
      primaryId,
      secondaryId,
      beginDate,
      endDate,
      documentType,
      title,
      recordSeriesCode,
      media
    };
  } catch (err) {
    console.error(`Error fetching detail for contentId ${contentId}:`, err.message);
    return null;
  }
}

/**
 * Fetch a page of OSSF records for a county from TCEQ
 */
async function fetchRecordsPage(countyName, page = 1) {
  const url = `${TCEQ_RECORDS_BASE}?IdcService=TCEQ_PERFORM_SEARCH&clientIP=&xIdcProfile=Record&IsExternalSearch=1&sortSearch=false&newSearch=true&xRecordSeries=${RECORD_SERIES_ID}&select0=Secondary+ID&input0=${encodeURIComponent(countyName)}&select1=&input1=&select2=&input2=&select3=&input3=&operator=AND&ftx=&pageNumber=${page}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'OSSF-Worker/1.0 (lead-gen-service)'
      }
    });
    if (!response.ok) return null;
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const records = [];
    
    // Parse result table
    $('table tr').each((i, el) => {
      const $row = $(el);
      const $cells = $row.find('td');
      
      // Skip header rows
      if ($cells.length < 4) return;
      
      // Try to extract Content ID from link
      const $contentLink = $row.find('a').first();
      const contentId = $contentLink.text().trim();
      if (!contentId) return;
      
      // Extract docName from href
      let docName = null;
      const href = $contentLink.attr('href') || '';
      const docNameMatch = href.match(/dDocName=([^&]+)/);
      if (docNameMatch) docName = docNameMatch[1];
      
      // Extract dID from href
      let dId = null;
      const dIdMatch = href.match(/dID=([^&]+)/);
      if (dIdMatch) dId = dIdMatch[1];
      
      // Extract other columns
      const recordSeries = $cells.eq(1).text().trim();
      const primaryId = $cells.eq(2).text().trim();
      const secondaryId = $cells.eq(3).text().trim();
      const documentType = $cells.eq(4).text().trim();
      const title = $cells.eq(5).text().trim();
      const beginDate = $cells.eq(6).text().trim();
      const endDate = $cells.eq(7).text().trim();
      const litigationHold = $cells.eq(8).text().trim();
      const regulatedEntityName = $cells.eq(9).text().trim();
      const media = $cells.eq(10).text().trim();
      
      records.push({
        contentId,
        docName,
        dId,
        recordSeries,
        primaryId,
        secondaryId,
        documentType,
        title,
        beginDate,
        endDate,
        litigationHold,
        regulatedEntityName,
        media
      });
    });
    
    return records;
  } catch (err) {
    console.error(`Error fetching records page for ${countyName} page ${page}:`, err.message);
    return null;
  }
}

/**
 * Sync records for a single county
 */
async function syncCounty(county) {
  console.log(`Syncing county: ${county.name}`);
  let seen = 0;
  let created = 0;
  let updated = 0;
  
  // Fetch first page to get total count
  const firstPageRecords = await fetchRecordsPage(county.name, 1);
  if (!firstPageRecords || firstPageRecords.length === 0) {
    console.log(`No records found for ${county.name}`);
    return { seen: 0, created: 0, updated: 0 };
  }
  
  // Get all record links from first page
  const allRecords = [...firstPageRecords];
  seen += firstPageRecords.length;
  await delay(REQUEST_DELAY_MS);
  
  // Process each record
  for (const record of allRecords) {
    if (!record.contentId) continue;
    
    // Fetch detail page
    const detail = await fetchEntityDetail(record.contentId, record.docName || record.contentId);
    await delay(REQUEST_DELAY_MS);
    
    if (!detail) continue;
    
    // Determine property_id - use primaryId as document_number
    const documentNumber = detail.primaryId || record.primaryId;
    
    // Check if we need to upsert property first
    let propertyId = null;
    if (detail.regulatedEntityName || detail.city) {
      const { data: existingProperty } = await supabase
        .from('properties')
        .select('id')
        .eq('county_slug', county.slug)
        .eq('address', detail.physicalAddress)
        .single();
      
      if (existingProperty) {
        propertyId = existingProperty.id;
      } else {
        const { data: newProperty } = await supabase
          .from('properties')
          .insert({
            county_slug: county.slug,
            address: detail.physicalAddress,
            city: detail.city,
            state: detail.state,
            zip: detail.zip,
            metadata: {
              source: 'tceq_records',
              regulated_entity_name: detail.regulatedEntityName
            }
          })
          .select('id')
          .single();
        if (newProperty) propertyId = newProperty.id;
        created++;
      }
    }
    
    // Upsert OSSF record
    const { data: existingRecord } = await supabase
      .from('osff_records')
      .select('id')
      .eq('document_number', documentNumber)
      .single();
    
    if (existingRecord) {
      // Update
      await supabase
        .from('osff_records')
        .update({
          result: detail.title,
          filing_date: detail.beginDate?.split(' ')[0] || new Date().toISOString().split('T')[0],
          metadata: {
            source: 'tceq_records',
            regulatedEntityName: detail.regulatedEntityName,
            documentType: detail.documentType,
            media: detail.media,
            physicalAddress: detail.physicalAddress,
            city: detail.city,
            zip: detail.zip,
            county: detail.county
          }
        })
        .eq('id', existingRecord.id);
      updated++;
    } else {
      // Insert
      await supabase
        .from('osff_records')
        .insert({
          property_id: propertyId,
          record_type: detail.recordSeriesCode || 'tceq_records',
          filing_date: detail.beginDate?.split(' ')[0] || new Date().toISOString().split('T')[0],
          document_number: documentNumber,
          result: detail.title || detail.documentType,
          metadata: {
            source: 'tceq_records',
            regulatedEntityName: detail.regulatedEntityName,
            documentType: detail.documentType,
            media: detail.media,
            physicalAddress: detail.physicalAddress,
            city: detail.city,
            zip: detail.zip,
            county: detail.county
          }
        });
      created++;
    }
    
    // Upsert contact if we have entity name
    if (detail.regulatedEntityName && propertyId) {
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('property_id', propertyId)
        .eq('role', 'owner')
        .single();
      
      if (!existingContact) {
        await supabase
          .from('contacts')
          .insert({
            property_id: propertyId,
            role: 'owner',
            name: detail.regulatedEntityName,
            metadata: { source: 'tceq_records' }
          });
      }
    }
  }
  
  return { seen, created, updated };
}

/**
 * Sync all counties
 */
async function syncAllSources() {
  console.log('Starting sync run...');
  const syncStartTime = new Date();
  let totalSeen = 0;
  let totalCreated = 0;
  let totalUpdated = 0;
  
  try {
    for (const county of COUNTIES) {
      const result = await syncCounty(county);
      totalSeen += result.seen;
      totalCreated += result.created;
      totalUpdated += result.updated;
    }
    
    const syncEndTime = new Date();
    
    // Record the sync run
    await supabase
      .from('sync_runs')
      .insert({
        status: 'completed',
        records_seen: totalSeen,
        records_created: totalCreated,
        records_updated: totalUpdated,
        finished_at: syncEndTime.toISOString(),
        metadata: { duration_ms: syncEndTime - syncStartTime }
      });
    
    console.log(`Sync complete. Seen: ${totalSeen}, Created: ${totalCreated}, Updated: ${totalUpdated}`);
    
    // Generate leads after sync
    await generateLeads();
  } catch (err) {
    console.error('Sync failed:', err);
    await supabase
      .from('sync_runs')
      .insert({
        status: 'failed',
        records_seen: totalSeen,
        records_created: totalCreated,
        records_updated: totalUpdated,
        metadata: { error: err.message }
      });
  }
}

/**
 * Generate leads from OSSF records
 */
async function generateLeads() {
  console.log('Generating leads...');
  
  const SCORE_INSTALL_LEAD = 70;
  const SCORE_SERVICE_LEAD = 50;
  const SCORE_PERMIT_RENEWAL = 40;
  
  // Find recent records that indicate potential leads
  const { data: records, error } = await supabase
    .from('osff_records')
    .select('*, properties(*)')
    .order('filing_date', { ascending: false })
    .limit(100);
  
  if (error || !records) return;
  
  for (const record of records) {
    const result = record.result?.toLowerCase() || '';
    let leadType = null;
    let score = 0;
    let reason = '';
    
    // Installation lead signals
    if (result.includes('install') || result.includes('new') || result.includes('authorization')) {
      leadType = 'new_install';
      score = SCORE_INSTALL_LEAD;
      reason = 'New installation or authorization record detected';
    }
    // Service lead signals
    else if (result.includes('fail') || result.includes('repair') || result.includes('pump') || result.includes('compliance')) {
      leadType = 'service_needed';
      score = SCORE_SERVICE_LEAD;
      reason = 'System requires service or compliance action';
    }
    // Permit renewal signals
    else if (result.includes('renew') || result.includes('expire') || result.includes('permit')) {
      leadType = 'permit_renewal';
      score = SCORE_PERMIT_RENEWAL;
      reason = 'Permit renewal may be needed';
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
        await supabase
          .from('leads')
          .insert({
            property_id: record.property_id,
            system_id: record.system_id,
            lead_type: leadType,
            score: score,
            status: 'new',
            summary: reason,
            next_action: 'Contact property owner',
            assigned_to: null
          });
        
        // Log the signal
        await supabase
          .from('lead_signals')
          .insert({
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

// Schedule weekly sync on Sundays at 2 AM
const weeklySync = cron.schedule('0 2 * * 0', () => {
  console.log('Running scheduled weekly sync...');
  syncAllSources();
});

console.log('Worker started. Weekly sync scheduled for Sundays at 2 AM.');
weeklySync.start();
