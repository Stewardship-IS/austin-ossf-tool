create extension if not exists postgis;
create extension if not exists pg_trgm;

create table if not exists jurisdictions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  county_name text not null,
  state_code text not null default 'TX',
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references jurisdictions(id) on delete cascade,
  slug text unique not null,
  name text not null,
  source_type text not null,
  base_url text,
  access_method text,
  is_active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sync_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id) on delete cascade,
  status text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_seen integer not null default 0,
  records_created integer not null default 0,
  records_updated integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists raw_records (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id) on delete cascade,
  external_id text,
  record_hash text not null,
  fetched_at timestamptz not null default now(),
  source_url text,
  payload jsonb not null,
  unique(source_id, record_hash)
);

create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid references jurisdictions(id) on delete set null,
  address_line_1 text,
  address_line_2 text,
  city text,
  state_code text,
  postal_code text,
  county_name text,
  parcel_id text,
  legal_description text,
  location geography(point,4326),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists systems (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  system_type text,
  capacity text,
  bedrooms integer,
  install_date date,
  approval_date date,
  operate_date date,
  installer_name text,
  maintainer_name text,
  status text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists records (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id) on delete cascade,
  property_id uuid references properties(id) on delete set null,
  system_id uuid references systems(id) on delete set null,
  record_type text not null,
  permit_number text,
  application_date date,
  approval_date date,
  record_date date,
  status text,
  title text,
  source_url text,
  raw_record_id uuid references raw_records(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists record_documents (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references records(id) on delete cascade,
  document_type text,
  title text,
  file_url text,
  file_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete set null,
  system_id uuid references systems(id) on delete set null,
  role text not null,
  name text,
  license_number text,
  phone text,
  email text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists lead_signals (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete set null,
  system_id uuid references systems(id) on delete set null,
  record_id uuid references records(id) on delete set null,
  signal_type text not null,
  signal_score integer not null default 0,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete set null,
  system_id uuid references systems(id) on delete set null,
  lead_type text not null,
  score integer not null default 0,
  status text not null default 'new',
  summary text,
  next_action text,
  assigned_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  activity_type text not null,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_properties_county_name on properties(county_name);
create index if not exists idx_properties_parcel_id on properties(parcel_id);
create index if not exists idx_records_record_type on records(record_type);
create index if not exists idx_records_record_date on records(record_date);
create index if not exists idx_leads_status on leads(status);
create index if not exists idx_leads_score on leads(score desc);
create index if not exists idx_raw_records_external_id on raw_records(external_id);
