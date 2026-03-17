create table if not exists public.duplicate_decisions (
  id uuid primary key default gen_random_uuid(),
  pair_key text not null unique,
  left_facility_id uuid not null references public.facilities(id) on delete cascade,
  right_facility_id uuid not null references public.facilities(id) on delete cascade,
  decision text not null check (decision in ('not_duplicate', 'merged')),
  winner_facility_id uuid references public.facilities(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists duplicate_decisions_left_idx on public.duplicate_decisions (left_facility_id);
create index if not exists duplicate_decisions_right_idx on public.duplicate_decisions (right_facility_id);
