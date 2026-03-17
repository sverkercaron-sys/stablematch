import { createClient } from "@supabase/supabase-js";

const OVERPASS_API_URL =
  process.env.OVERPASS_API_URL ?? "https://overpass-api.de/api/interpreter";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

const OVERPASS_QUERY = `
[out:json][timeout:120];
area["ISO3166-1"="SE"][admin_level=2]->.searchArea;
(
  nwr(area.searchArea)["leisure"="horse_riding"];
  nwr(area.searchArea)["sport"="equestrian"];
  nwr(area.searchArea)["building"="stable"];
  nwr(area.searchArea)["landuse"="equestrian"];
  nwr(area.searchArea)["name"~"stall|stuteri|ridcenter|ridskola|travstall|hastgard|hastgård|ridanlaggning|ridanläggning", i];
);
out center tags;
`;

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function pickCoordinate(element) {
  if (typeof element.lat === "number" && typeof element.lon === "number") {
    return { latitude: element.lat, longitude: element.lon };
  }

  if (element.center && typeof element.center.lat === "number" && typeof element.center.lon === "number") {
    return { latitude: element.center.lat, longitude: element.center.lon };
  }

  return null;
}

function buildAddress(tags) {
  const parts = [
    tags["addr:street"],
    tags["addr:housenumber"],
    tags["addr:postcode"],
    tags["addr:city"]
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "Adress saknas";
}

function inferMunicipality(tags) {
  return tags["addr:city"] || tags["addr:municipality"] || tags["is_in:municipality"] || "Okänd kommun";
}

function inferRegion(tags) {
  return tags["addr:state"] || tags["is_in:county"] || tags["addr:county"] || "Okänd region";
}

function inferFacilityType(tags = {}) {
  const haystack = Object.values(tags).join(" ").toLowerCase();

  if (haystack.includes("ridskola")) return "riding_school";
  if (haystack.includes("trav")) return "harness_racing";
  if (haystack.includes("stuteri")) return "stud_farm";
  if (haystack.includes("lösdrift") || haystack.includes("losdrift")) return "loose_boarding";
  return "stable";
}

function inferBoardingModes(tags = {}) {
  const haystack = Object.values(tags).join(" ").toLowerCase();
  const modes = [];

  if (haystack.includes("lösdrift") || haystack.includes("losdrift")) {
    modes.push("loose");
  }

  if (
    haystack.includes("box") ||
    haystack.includes("stall") ||
    haystack.includes("ridskola") ||
    haystack.includes("stuteri")
  ) {
    modes.push("box");
  }

  return modes.length ? [...new Set(modes)] : ["box"];
}

function buildDescription(tags = {}) {
  const pieces = [tags.description, tags["description:sv"], tags["operator:type"]].filter(Boolean);
  return pieces.join(" ").slice(0, 280);
}

function normalizeElement(element) {
  const tags = element.tags ?? {};
  const coordinates = pickCoordinate(element);

  if (!coordinates) {
    return null;
  }

  const sourceId = `osm:${element.type}/${element.id}`;
  const name = tags.name?.trim();

  if (!name) {
    return null;
  }

  return {
    facility: {
      slug: `${slugify(name)}-${element.type}-${String(element.id).slice(-8)}`,
      source_name: "osm_overpass",
      source_id: sourceId,
      name,
      status: "auto_listed",
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      address: buildAddress(tags),
      postal_code: tags["addr:postcode"] ?? null,
      municipality: inferMunicipality(tags),
      region: inferRegion(tags),
      country_code: "SE",
      facility_type: inferFacilityType(tags),
      boarding_modes: inferBoardingModes(tags),
      description_short: buildDescription(tags),
      monthly_price_sek: 0,
      has_riding_house:
        tags.indoor === "yes" ||
        tags["building:part"] === "ridhus" ||
        /ridhus/i.test(Object.values(tags).join(" ")),
      has_paddock: /paddock/i.test(Object.values(tags).join(" ")),
      has_trails: /ridvag|ridväg|trail/i.test(Object.values(tags).join(" ")),
      open_spots: 0,
      source_label: "OSM import",
      is_active: true
    },
    sourceRecord: {
      source_name: "osm_overpass",
      source_id: sourceId,
      payload: element
    }
  };
}

async function fetchOverpassData() {
  const response = await fetch(OVERPASS_API_URL, {
    method: "POST",
    headers: {
      "content-type": "text/plain;charset=UTF-8"
    },
    body: OVERPASS_QUERY
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Overpass request failed: ${response.status} ${body}`);
  }

  return response.json();
}

async function upsertSourceRecords(sourceRecords) {
  if (!sourceRecords.length) {
    return;
  }

  const { error } = await supabase
    .from("source_records")
    .upsert(sourceRecords, { onConflict: "source_name,source_id" });

  if (error) {
    throw error;
  }
}

async function fetchProtectedSlugs() {
  const { data, error } = await supabase
    .from("facilities")
    .select("source_id, slug")
    .in("status", ["claimed", "verified"]);

  if (error) {
    throw error;
  }

  return {
    sourceIds: new Set((data ?? []).map((row) => row.source_id).filter(Boolean)),
    slugs: new Set((data ?? []).map((row) => row.slug))
  };
}

async function upsertFacilities(facilities) {
  if (!facilities.length) {
    return;
  }

  const protectedFacilities = await fetchProtectedSlugs();
  const allowedFacilities = facilities.filter(
    (facility) =>
      !protectedFacilities.sourceIds.has(facility.source_id) &&
      !protectedFacilities.slugs.has(facility.slug)
  );

  if (!allowedFacilities.length) {
    return;
  }

  const { error } = await supabase
    .from("facilities")
    .upsert(allowedFacilities, { onConflict: "source_name,source_id" });

  if (error) {
    throw error;
  }
}

async function main() {
  console.log(`Fetching OSM data from ${OVERPASS_API_URL} ...`);
  const result = await fetchOverpassData();
  const normalized = (result.elements ?? []).map(normalizeElement).filter(Boolean);

  const facilities = normalized.map((item) => item.facility);
  const sourceRecords = normalized.map((item) => item.sourceRecord);

  console.log(`Fetched ${result.elements?.length ?? 0} elements, normalized ${facilities.length}.`);

  await upsertSourceRecords(sourceRecords);
  await upsertFacilities(facilities);

  console.log(`Upserted ${sourceRecords.length} source records.`);
  console.log(`Upserted ${facilities.length} facilities (excluding claimed/verified slug matches).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
