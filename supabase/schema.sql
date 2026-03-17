create extension if not exists "pgcrypto";

create table if not exists public.facilities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  source_name text,
  source_id text,
  name text not null,
  status text not null default 'auto_listed' check (status in ('auto_listed', 'claimed', 'verified')),
  latitude double precision not null,
  longitude double precision not null,
  address text not null,
  postal_code text,
  municipality text not null,
  region text not null,
  country_code text not null default 'SE',
  facility_type text not null default 'stable',
  boarding_modes text[] not null default '{}',
  description_short text not null default '',
  monthly_price_sek integer not null default 0,
  has_riding_house boolean not null default false,
  has_paddock boolean not null default false,
  has_trails boolean not null default false,
  open_spots integer not null default 0,
  source_label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  claimant_name text not null,
  email text not null,
  phone text,
  role text,
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  facility_name text not null,
  applicant_name text not null,
  email text not null,
  phone text,
  horse_name text,
  horse_age text,
  message text,
  created_at timestamptz not null default now()
);

create table if not exists public.source_records (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_id text,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists facilities_slug_idx on public.facilities (slug);
create unique index if not exists facilities_source_key_idx
  on public.facilities (source_name, source_id)
  where source_id is not null;
create index if not exists facilities_municipality_idx on public.facilities (municipality);
create index if not exists facilities_status_idx on public.facilities (status);
create index if not exists claims_facility_id_idx on public.claims (facility_id);
create index if not exists applications_facility_id_idx on public.applications (facility_id);
create unique index if not exists source_records_source_key_idx
  on public.source_records (source_name, source_id)
  where source_id is not null;
