# StableMatch MVP

StableMatch is the first deployable MVP for a Swedish stable discovery and boarding marketplace.

## Stack

- Next.js App Router
- Supabase for persistence
- MapLibre for the map view

## Local setup

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase keys
3. Run `npm run dev` from `/Users/sverkercaron/Documents/Playground/stablematch`

## Supabase

Run the SQL files in order:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

If your tables already exist from an earlier setup, also run:

3. `supabase/alter_facilities_source_keys.sql`

## Current MVP pages

- `/` search and listing page
- `/stall/[slug]` facility profile + inquiry form
- `/for-owners` claim flow

## OSM import

Run the importer with:

```bash
npm run import:osm
```

The importer:

- fetches Swedish horse-related facilities from Overpass
- writes raw payloads into `source_records`
- upserts auto-listed facilities into `facilities`
- avoids overwriting `claimed` and `verified` records when the slug matches

`OVERPASS_API_URL` can be overridden in `.env.local` if you need a different Overpass endpoint.

## Geofabrik import

Preferred seed path:

```bash
npm run import:geofabrik
```

The Geofabrik importer:

- downloads the official Sweden `.osm.pbf` extract once and caches it in `./data`
- stream-parses the file locally instead of querying Overpass live
- currently imports horse-related `node` features as the first robust pass
- upserts into `source_records` and `facilities`

Environment overrides:

- `GEOFABRIK_PBF_URL`
- `GEOFABRIK_PBF_PATH`

## Geography enrichment

After import, enrich missing municipality and region fields with:

```bash
npm run enrich:geography
```

This script:

- only targets facilities with `Okänd kommun` or `Okänd region`
- reverse geocodes coordinates one by one
- updates `municipality` and `region` in Supabase

Environment overrides:

- `REVERSE_GEOCODE_URL`
- `REVERSE_GEOCODE_EMAIL`
- `ENRICH_GEOGRAPHY_LIMIT`
