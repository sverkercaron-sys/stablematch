import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REVERSE_GEOCODE_URL =
  process.env.REVERSE_GEOCODE_URL ?? "https://nominatim.openstreetmap.org/reverse";
const REVERSE_GEOCODE_EMAIL = process.env.REVERSE_GEOCODE_EMAIL ?? "";
const ENRICH_GEOGRAPHY_LIMIT = Number(process.env.ENRICH_GEOGRAPHY_LIMIT ?? "100");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function inferMunicipality(address = {}) {
  return (
    address.municipality ||
    address.city ||
    address.town ||
    address.village ||
    address.suburb ||
    address.hamlet ||
    null
  );
}

function inferRegion(address = {}) {
  return address.county || address.state || address.region || null;
}

async function fetchCandidates() {
  const { data, error } = await supabase
    .from("facilities")
    .select("id, name, latitude, longitude, municipality, region")
    .or("municipality.eq.Okänd kommun,region.eq.Okänd region")
    .order("created_at", { ascending: true })
    .limit(ENRICH_GEOGRAPHY_LIMIT);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function reverseGeocode(latitude, longitude) {
  const url = new URL(REVERSE_GEOCODE_URL);
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");
  if (REVERSE_GEOCODE_EMAIL) {
    url.searchParams.set("email", REVERSE_GEOCODE_EMAIL);
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent": "StableMatchMVP/0.1 (geography enrichment)"
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Reverse geocode failed: ${response.status} ${body}`);
  }

  return response.json();
}

async function updateFacility(id, municipality, region) {
  const { error } = await supabase
    .from("facilities")
    .update({
      municipality: municipality ?? "Okänd kommun",
      region: region ?? "Okänd region"
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

async function main() {
  const candidates = await fetchCandidates();
  console.log(`Found ${candidates.length} facilities to enrich.`);

  let updated = 0;

  for (const facility of candidates) {
    try {
      const result = await reverseGeocode(facility.latitude, facility.longitude);
      const municipality = inferMunicipality(result.address);
      const region = inferRegion(result.address);

      if (municipality || region) {
        await updateFacility(
          facility.id,
          municipality ?? facility.municipality,
          region ?? facility.region
        );
        updated += 1;
        console.log(
          `Updated ${facility.name}: ${municipality ?? facility.municipality} / ${region ?? facility.region}`
        );
      } else {
        console.log(`No better location data for ${facility.name}`);
      }

      await sleep(1100);
    } catch (error) {
      console.warn(`Failed to enrich ${facility.name}: ${error.message}`);
      await sleep(1500);
    }
  }

  console.log(`Enriched ${updated} facilities.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
