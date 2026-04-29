'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase';

interface Jurisdiction {
  id: string;
  slug: string;
  name: string;
  county_name: string;
  is_active: boolean;
  created_at: string;
}

interface Lead {
  id: string;
  lead_type: string;
  score: number;
  status: string;
  summary: string | null;
  next_action: string | null;
  created_at: string;
}

interface SyncRun {
  id: string;
  status: string;
  records_seen: number;
  records_created: number;
  records_updated: number;
  finished_at: string | null;
}

export default function Dashboard() {
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [syncRuns, setSyncRuns] = useState<SyncRun[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [jurisRes, leadsRes, syncRes] = await Promise.all([
        supabase.from('jurisdictions').select('*').order('county_name'),
        supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('sync_runs').select('*').order('started_at', { ascending: false }).limit(5),
      ]);

      if (jurisRes.data) setJurisdictions(jurisRes.data);
      if (leadsRes.data) setLeads(leadsRes.data);
      if (syncRes.data) setSyncRuns(syncRes.data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  const newLeads = leads.filter(l => l.status === 'new').length;
  const activeCounties = jurisdictions.filter(j => j.is_active).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Austin OSSF Tool</h1>
            <p className="text-sm text-slate-500">Internal lead intelligence for septic install and service</p>
          </div>
          <nav className="flex gap-6 text-sm">
            <a href="/leads" className="text-slate-600 hover:text-slate-900">Leads</a>
            <a href="/records" className="text-slate-600 hover:text-slate-900">Records</a>
            <a href="/counties" className="text-slate-600 hover:text-slate-900">Counties</a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Active Counties" value={activeCounties} subtitle="out of 5 Austin metro" />
          <StatCard title="New Leads" value={newLeads} subtitle="awaiting review" />
          <StatCard title="Total Leads" value={leads.length} subtitle="in the system" />
          <StatCard title="Last Sync" value={syncRuns[0]?.status ?? 'Never'} subtitle="status" />
        </div>

        {/* Counties */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Counties</h2>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">County</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jurisdictions.map(j => (
                  <tr key={j.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900">{j.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${j.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {j.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Leads */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Leads</h2>
          {leads.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500">
              No leads yet. Sources have not been configured.
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Score</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Summary</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map(lead => (
                    <tr key={lead.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-900">{lead.lead_type}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${lead.score >= 60 ? 'bg-red-100 text-red-700' : lead.score >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>
                          {lead.score}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${lead.status === 'new' ? 'bg-blue-100 text-blue-700' : lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{lead.summary || '-'}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{new Date(lead.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ title, value, subtitle }: { title: string; value: number | string; subtitle: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="text-sm text-slate-500 mb-1">{title}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{subtitle}</div>
    </div>
  );
}
