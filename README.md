# StableMatch MVP

StableMatch is the first deployable MVP for a Swedish stable discovery and boarding marketplace.

## Stack

- Next.js App Router
- Supabase for persistence
- Prepared for MapLibre replacement in the map component

## Local setup

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase keys
3. Run `npm run dev` from `/Users/sverkercaron/Documents/Playground/stablematch`

The project currently uses the already-installed root `node_modules` binaries via `../node_modules/.bin/*`.

## Supabase

Run the SQL files in order:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

## Current MVP pages

- `/` search and listing page
- `/stall/[slug]` facility profile + inquiry form
- `/for-owners` claim flow
