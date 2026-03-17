import fs from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

import parseOSM from "osm-pbf-parser";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEOFABRIK_PBF_URL =
  process.env.GEOFABRIK_PBF_URL ?? "https://download.geofabrik.de/europe/sweden-latest.osm.pbf";
const GEOFABRIK_PBF_PATH =
  process.env.GEOFABRIK_PBF_PATH ?? path.join(".", "data", "sweden-latest.osm.pbf");

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

const FACILITY_BATCH_SIZE = 300;
const SOURCE_BATCH_SIZE = 300;

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function buildAddress(tags) {
  const street = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ");
  const locality = [tags["addr:postcode"], tags["addr:city"]].filter(Boolean).join(" ");
  const parts = [street, locality].filter(Boolean);
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

function isHorseFacilityNode(node) {
  if (!node || node.type !== "node") {
    return false;
  }

  const tags = node.tags ?? {};
  const name = String(tags.name ?? "").toLowerCase();
  const values = Object.values(tags).join(" ").toLowerCase();

  const excludedSignals = [
    tags.highway,
    tags.public_transport,
    tags.railway,
    tags.route,
    tags.waterway,
    tags.aeroway,
    tags.boundary,
    tags.place,
    tags.natural,
    tags.man_made,
    tags.information,
    tags.traffic_sign,
    tags.shop
  ];

  if (excludedSignals.some(Boolean)) {
    return false;
  }

  if (
    tags.tourism === "information" ||
    tags.amenity === "bus_station" ||
    tags.amenity === "fuel" ||
    tags.amenity === "restaurant" ||
    tags.amenity === "cafe" ||
    tags.amenity === "fast_food" ||
    tags.highway === "bus_stop" ||
    tags.highway === "motorway_junction"
  ) {
    return false;
  }

  const directSignals = [
    tags.leisure === "horse_riding",
    tags.sport === "equestrian",
    tags.building === "stable",
    tags.landuse === "equestrian",
    tags.office === "equestrian"
  ];

  const facilityNameSignals = [
    /stuteri/.test(name),
    /ridskola/.test(name),
    /ridklubb/.test(name),
    /ridcenter/.test(name),
    /travstall/.test(name),
    /h[äa]stg[åa]rd/.test(name),
    /ridanl[äa]ggning/.test(name),
    /l[öo]sdrift/.test(name)
  ];

  const contextualSignals = [
    /equestrian/.test(values),
    /horse_riding/.test(values),
    /ridskola|ridcenter|ridklubb|travstall|stuteri|l[öo]sdrift/.test(values)
  ];

  return directSignals.some(Boolean) || (facilityNameSignals.some(Boolean) && contextualSignals.some(Boolean));
}

function normalizeNode(node) {
  const tags = node.tags ?? {};
  const name = tags.name?.trim();

  if (!name || typeof node.lat !== "number" || typeof node.lon !== "number") {
    return null;
  }

  const sourceId = `osm:node/${node.id}`;

  return {
    facility: {
      slug: `osm-node-${node.id}`,
      source_name: "geofabrik_sweden_pbf",
      source_id: sourceId,
      name,
      status: "auto_listed",
      latitude: node.lat,
      longitude: node.lon,
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
        /ridhus|manege|manège/i.test(Object.values(tags).join(" ")),
      has_paddock: /paddock/i.test(Object.values(tags).join(" ")),
      has_trails: /ridvag|ridväg|bridleway|trail/i.test(Object.values(tags).join(" ")),
      open_spots: 0,
      source_label: "Geofabrik import",
      is_active: true
    },
    sourceRecord: {
      source_name: "geofabrik_sweden_pbf",
      source_id: sourceId,
      payload: node
    }
  };
}

async function ensurePbfAvailable() {
  const absolutePath = path.resolve(GEOFABRIK_PBF_PATH);
  try {
    const info = await stat(absolutePath);
    if (info.size > 0) {
      console.log(`Using cached PBF: ${absolutePath}`);
      return absolutePath;
    }
  } catch {}

  await mkdir(path.dirname(absolutePath), { recursive: true });
  console.log(`Downloading ${GEOFABRIK_PBF_URL} to ${absolutePath} ...`);

  const response = await fetch(GEOFABRIK_PBF_URL, { redirect: "follow" });
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download PBF: ${response.status} ${response.statusText}`);
  }

  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(absolutePath));
  return absolutePath;
}

async function fetchProtectedFacilities() {
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

async function flushBatch(facilityBatch, sourceBatch, protectedFacilities) {
  if (sourceBatch.length) {
    const { error } = await supabase.from("source_records").insert(sourceBatch.splice(0, sourceBatch.length));

    if (error) {
      console.warn(`source_records insert skipped: ${error.message}`);
    }
  }

  if (facilityBatch.length) {
    const candidates = facilityBatch.splice(0, facilityBatch.length).filter(
      (facility) =>
        !protectedFacilities.sourceIds.has(facility.source_id) &&
        !protectedFacilities.slugs.has(facility.slug)
    );

    if (candidates.length) {
      const { error } = await supabase.from("facilities").upsert(candidates, { onConflict: "slug" });

      if (error) {
        throw error;
      }
    }
  }
}

async function main() {
  const pbfPath = await ensurePbfAvailable();
  const protectedFacilities = await fetchProtectedFacilities();
  const facilityBatch = [];
  const sourceBatch = [];
  let seenNodes = 0;
  let matchedNodes = 0;

  const parser = parseOSM();
  const collector = new Transform({
    objectMode: true,
    async transform(items, _encoding, callback) {
      try {
        for (const item of items) {
          if (!isHorseFacilityNode(item)) {
            continue;
          }

          seenNodes += 1;
          const normalized = normalizeNode(item);
          if (!normalized) {
            continue;
          }

          matchedNodes += 1;
          facilityBatch.push(normalized.facility);
          sourceBatch.push(normalized.sourceRecord);

          if (facilityBatch.length >= FACILITY_BATCH_SIZE || sourceBatch.length >= SOURCE_BATCH_SIZE) {
            await flushBatch(facilityBatch, sourceBatch, protectedFacilities);
            console.log(`Processed ${matchedNodes} matched nodes so far...`);
          }
        }

        callback();
      } catch (error) {
        callback(error);
      }
    }
  });

  await pipeline(fs.createReadStream(pbfPath), parser, collector);
  await flushBatch(facilityBatch, sourceBatch, protectedFacilities);

  console.log(`Matched ${matchedNodes} horse-related nodes from ${seenNodes} signal hits.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
