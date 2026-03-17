alter table public.facilities
  add column if not exists source_name text,
  add column if not exists source_id text;

create unique index if not exists facilities_source_key_idx
  on public.facilities (source_name, source_id)
  where source_id is not null;

create unique index if not exists source_records_source_key_idx
  on public.source_records (source_name, source_id)
  where source_id is not null;
