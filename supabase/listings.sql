create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  title text not null,
  status text not null default 'active' check (status in ('draft', 'active', 'paused', 'filled')),
  boarding_mode text not null default 'box' check (boarding_mode in ('box', 'loose')),
  monthly_price_sek integer not null default 0,
  open_spots integer not null default 1,
  available_from date,
  short_description text not null default '',
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.applications
  add column if not exists listing_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'applications_listing_id_fkey'
  ) then
    alter table public.applications
      add constraint applications_listing_id_fkey
      foreign key (listing_id) references public.listings(id) on delete set null;
  end if;
end $$;

create index if not exists applications_listing_id_idx on public.applications (listing_id);
create index if not exists listings_facility_id_idx on public.listings (facility_id);
create index if not exists listings_status_idx on public.listings (status);
