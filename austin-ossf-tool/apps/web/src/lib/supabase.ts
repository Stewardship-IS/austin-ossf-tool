import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const createBrowserClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey);
};

export { createClient };

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      jurisdictions: {
        Row: {
          id: string;
          slug: string;
          name: string;
          county_name: string;
          state_code: string;
          is_active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      sources: {
        Row: {
          id: string;
          jurisdiction_id: string;
          slug: string;
          name: string;
          source_type: string;
access_method: string | null;
metadata: Json;
created_at: string;
updated_at: string;
};
};
sync_runs: {
Row: {
id: string;
status: string;
records_seen: number;
records_created: number;
records_updated: number;
finished_at: string | null;
metadata: Json;
created_at: string;
};
};
properties: {
Row: {
id: string;
address: string;
city: string;
state_code: string;
zip_code: string | null;
county_name: string;
lat: number | null;
lng: number | null;
metadata: Json;
created_at: string;
updated_at: string;
};
};
septic_systems: {
Row: {
id: string;
property_id: string | null;
permit_number: string | null;
installation_date: string | null;
system_type: string | null;
capacity_gpd: number | null;
status: string;
last_service_date: string | null;
metadata: Json;
created_at: string;
updated_at: string;
};
};
osff_records: {
Row: {
id: string;
property_id: string | null;
system_id: string | null;
record_type: string;
filing_date: string;
document_number: string | null;
result: string | null;
expiry_date: string | null;
metadata: Json;
created_at: string;
};
};
record_documents: {
Row: {
id: string;
record_id: string;
document_type: string | null;
title: string | null;
file_url: string | null;
file_path: string | null;
metadata: Json;
created_at: string;
};
};
contacts: {
Row: {
id: string;
property_id: string | null;
system_id: string | null;
role: string;
name: string | null;
license_number: string | null;
phone: string | null;
email: string | null;
metadata: Json;
created_at: string;
updated_at: string;
};
};
lead_signals: {
Row: {
id: string;
property_id: string | null;
system_id: string | null;
record_id: string | null;
signal_type: string;
signal_score: number;
reason: string;
metadata: Json;
created_at: string;
};
};
leads: {
Row: {
id: string;
property_id: string | null;
system_id: string | null;
lead_type: string;
score: number;
status: string;
summary: string | null;
next_action: string | null;
assigned_to: string | null;
created_at: string;
updated_at: string;
};
};
activities: {
Row: {
id: string;
lead_id: string | null;
activity_type: string;
body: string | null;
metadata: Json;
created_at: string;
};
};
};
};
};
          
