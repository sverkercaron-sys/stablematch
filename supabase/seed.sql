insert into public.facilities (
  slug,
  name,
  status,
  latitude,
  longitude,
  address,
  municipality,
  region,
  boarding_modes,
  description_short,
  monthly_price_sek,
  has_riding_house,
  has_paddock,
  open_spots,
  source_label
) values
  (
    'ekbacken-ridgard',
    'Ekbacken Ridgard',
    'verified',
    59.8581,
    17.8203,
    'Funbo-Lovsta 24, Uppsala',
    'Uppsala',
    'Uppsala lan',
    '{"box"}',
    'Verifierad anlaggning med 24 boxplatser, ridhus, paddock och tydliga foder- och hagrutiner.',
    4650,
    true,
    true,
    2,
    'Claimed profile'
  ),
  (
    'norrhage-loosdrift',
    'Norrhage Loosdrift',
    'auto_listed',
    59.5594,
    18.0891,
    'Angarns-Lundby 7, Vallentuna',
    'Vallentuna',
    'Stockholms lan',
    '{"loose"}',
    'Automatiskt listad anlaggning med fokus pa flock och stora vinterhagar.',
    3500,
    false,
    true,
    4,
    'OSM import'
  ),
  (
    'soderasens-sportstall',
    'Soderasens Sportstall',
    'verified',
    56.1334,
    13.1226,
    'Vedbyvagen 12, Klippan',
    'Klippan',
    'Skane lan',
    '{"box","loose"}',
    'Sportstall med bade box och mindre losdriftsgrupp, paddock och ridhus.',
    5200,
    true,
    true,
    1,
    'Claimed profile'
  );

insert into public.listings (
  facility_id,
  title,
  status,
  boarding_mode,
  monthly_price_sek,
  open_spots,
  available_from,
  short_description,
  is_featured
)
select
  id,
  'Ledig boxplats med fullservice',
  'active',
  'box',
  4650,
  2,
  current_date + interval '14 days',
  'Två boxplatser med ridhus, paddock och tydliga rutiner. Passar ekipage som vill flytta in inom kort.',
  true
from public.facilities
where slug = 'ekbacken-ridgard';

insert into public.listings (
  facility_id,
  title,
  status,
  boarding_mode,
  monthly_price_sek,
  open_spots,
  available_from,
  short_description,
  is_featured
)
select
  id,
  'Lösdriftsplats i mindre flock',
  'active',
  'loose',
  3500,
  1,
  current_date + interval '7 days',
  'Lösdriftsplats med stora vinterhagar och lugn flock. Passar häst som fungerar väl i grupp.',
  false
from public.facilities
where slug = 'norrhage-loosdrift';
