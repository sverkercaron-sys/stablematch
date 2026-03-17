import { mockFacilities } from "@/lib/mock-data";
import { createServiceSupabaseClient } from "@/lib/supabase";
import { DuplicateCandidate, Facility, ReviewQueueItem, SearchFilters } from "@/lib/types";

const defaultFilters: SearchFilters = {
  q: "",
  municipality: "",
  boardingMode: "all",
  maxPrice: null,
  ridingHouseOnly: false,
  paddockOnly: false
};

type FacilityRow = {
  id: string;
  slug: string;
  name: string;
  municipality: string;
  region: string;
  address: string;
  latitude: number;
  longitude: number;
  boarding_modes: ("box" | "loose")[];
  monthly_price_sek: number;
  has_riding_house: boolean;
  has_paddock: boolean;
  open_spots: number;
  status: string;
  description_short: string;
  source_label: string | null;
};

function mapRow(row: FacilityRow): Facility {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    municipality: row.municipality,
    region: row.region,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    boardingModes: row.boarding_modes,
    monthlyPriceSek: row.monthly_price_sek,
    hasRidingHouse: row.has_riding_house,
    hasPaddock: row.has_paddock,
    openSpots: row.open_spots,
    verified: row.status === "verified",
    description: row.description_short,
    highlights: [],
    sourceLabel: row.source_label ?? "Imported"
  };
}

export function applyFilters(
  facilities: Facility[],
  rawFilters: Partial<SearchFilters>
): Facility[] {
  const filters = { ...defaultFilters, ...rawFilters };

  return facilities.filter((facility) => {
    const text = `${facility.name} ${facility.municipality} ${facility.region}`.toLowerCase();
    const queryMatch = !filters.q || text.includes(filters.q.toLowerCase());
    const municipalityMatch =
      !filters.municipality ||
      facility.municipality.toLowerCase().includes(filters.municipality.toLowerCase());
    const boardingMatch =
      filters.boardingMode === "all" || facility.boardingModes.includes(filters.boardingMode);
    const priceMatch =
      filters.maxPrice === null || facility.monthlyPriceSek <= Number(filters.maxPrice);
    const ridingHouseMatch = !filters.ridingHouseOnly || facility.hasRidingHouse;
    const paddockMatch = !filters.paddockOnly || facility.hasPaddock;

    return (
      queryMatch &&
      municipalityMatch &&
      boardingMatch &&
      priceMatch &&
      ridingHouseMatch &&
      paddockMatch
    );
  });
}

export async function getFacilities(filters: Partial<SearchFilters> = {}): Promise<Facility[]> {
  const supabase = createServiceSupabaseClient();

  if (!supabase) {
    return applyFilters(mockFacilities, filters);
  }

  const { data, error } = await supabase
    .from("facilities")
    .select(
      "id, slug, name, municipality, region, address, latitude, longitude, boarding_modes, monthly_price_sek, has_riding_house, has_paddock, open_spots, status, description_short, source_label"
    )
    .eq("is_active", true)
    .order("status", { ascending: false })
    .order("open_spots", { ascending: false });

  if (error || !data) {
    return applyFilters(mockFacilities, filters);
  }

  return applyFilters((data as FacilityRow[]).map(mapRow), filters);
}

export async function getFacilityBySlug(slug: string): Promise<Facility | null> {
  const supabase = createServiceSupabaseClient();

  if (!supabase) {
    return mockFacilities.find((facility) => facility.slug === slug) ?? null;
  }

  const { data, error } = await supabase
    .from("facilities")
    .select(
      "id, slug, name, municipality, region, address, latitude, longitude, boarding_modes, monthly_price_sek, has_riding_house, has_paddock, open_spots, status, description_short, source_label"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return mockFacilities.find((facility) => facility.slug === slug) ?? null;
  }

  return mapRow(data as FacilityRow);
}

export function summarizeFacilities(facilities: Facility[]) {
  const verifiedCount = facilities.filter((facility) => facility.verified).length;
  const openSpotCount = facilities.reduce((sum, facility) => sum + facility.openSpots, 0);
  const municipalities = new Set(facilities.map((facility) => facility.municipality)).size;

  return {
    verifiedCount,
    openSpotCount,
    municipalities
  };
}

type ReviewRow = {
  id: string;
  slug: string;
  name: string;
  municipality: string;
  region: string;
  facility_type: string;
  source_label: string | null;
  status: string;
  is_active: boolean;
  address: string;
  description_short: string;
  has_riding_house: boolean;
  has_paddock: boolean;
  open_spots: number;
  claims: { count: number }[] | null;
  applications: { count: number }[] | null;
};

function hasWeakFacilityName(name: string) {
  const normalized = name.trim().toLowerCase();
  const weakNames = [
    "ridhus",
    "travbana",
    "hoppningsanläggning",
    "hoppningsanlaggning",
    "lokstallet"
  ];

  if (weakNames.includes(normalized)) {
    return true;
  }

  return normalized.split(/\s+/).length === 1 && normalized.length < 11;
}

export async function getReviewQueue(): Promise<ReviewQueueItem[]> {
  const supabase = createServiceSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("facilities")
    .select(
      "id, slug, name, municipality, region, facility_type, source_label, status, is_active, address, description_short, has_riding_house, has_paddock, open_spots, claims(count), applications(count)"
    )
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(250);

  if (error || !data) {
    return [];
  }

  return (data as ReviewRow[]).map((row) => {
    const claimCount = row.claims?.[0]?.count ?? 0;
    const applicationCount = row.applications?.[0]?.count ?? 0;
    const hasWeakName = hasWeakFacilityName(row.name);

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      municipality: row.municipality,
      region: row.region,
      facilityType: row.facility_type,
      sourceLabel: row.source_label ?? "Imported",
      status: row.status,
      isActive: row.is_active,
      address: row.address,
      description: row.description_short,
      hasRidingHouse: row.has_riding_house,
      hasPaddock: row.has_paddock,
      openSpots: row.open_spots,
      claimCount,
      applicationCount,
      hasWeakName,
      needsReview: row.status !== "verified" && (hasWeakName || claimCount > 0 || applicationCount > 0)
    };
  });
}

export function summarizeReviewQueue(items: ReviewQueueItem[]) {
  const needsReview = items.filter((item) => item.needsReview).length;
  const claimed = items.filter((item) => item.status === "claimed").length;
  const verified = items.filter((item) => item.status === "verified").length;
  const weakNames = items.filter((item) => item.hasWeakName).length;

  return {
    total: items.length,
    needsReview,
    claimed,
    verified,
    weakNames
  };
}

type DuplicateRow = {
  id: string;
  slug: string;
  name: string;
  municipality: string;
  region: string;
  latitude: number;
  longitude: number;
  source_label: string | null;
};

function normalizeName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(ridklubb|ryttarforening|ryttarförening|ridskola|ridcenter|stall|stuteri)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(value: string) {
  return new Set(normalizeName(value).split(" ").filter(Boolean));
}

function jaccardScore(left: Set<string>, right: Set<string>) {
  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union === 0 ? 0 : intersection / union;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export async function getDuplicateCandidates(): Promise<DuplicateCandidate[]> {
  const supabase = createServiceSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("facilities")
    .select("id, slug, name, municipality, region, latitude, longitude, source_label")
    .eq("is_active", true)
    .limit(500);

  if (error || !data) {
    return [];
  }

  const rows = data as DuplicateRow[];
  const candidates: DuplicateCandidate[] = [];
  const seenPairs = new Set<string>();

  for (let index = 0; index < rows.length; index += 1) {
    const primary = rows[index];
    const primaryTokens = tokenSet(primary.name);

    for (let compareIndex = index + 1; compareIndex < rows.length; compareIndex += 1) {
      const secondary = rows[compareIndex];
      const pairKey = [primary.id, secondary.id].sort().join(":");

      if (seenPairs.has(pairKey)) {
        continue;
      }

      seenPairs.add(pairKey);

      const distanceKm = haversineKm(
        primary.latitude,
        primary.longitude,
        secondary.latitude,
        secondary.longitude
      );
      const secondaryTokens = tokenSet(secondary.name);
      const nameScore = jaccardScore(primaryTokens, secondaryTokens);
      const sameMunicipality =
        primary.municipality.toLowerCase() === secondary.municipality.toLowerCase();

      let score = 0;
      let reason = "";

      if (nameScore >= 0.72 && sameMunicipality) {
        score = nameScore + 0.2;
        reason = "Liknande namn i samma kommun";
      } else if (nameScore >= 0.6 && distanceKm < 5) {
        score = nameScore + 0.15;
        reason = "Liknande namn och nära koordinater";
      } else if (distanceKm < 0.75 && nameScore >= 0.35) {
        score = nameScore + 0.1;
        reason = "Mycket nära koordinater";
      }

      if (!reason) {
        continue;
      }

      candidates.push({
        primaryId: primary.id,
        primarySlug: primary.slug,
        primaryName: primary.name,
        primaryMunicipality: primary.municipality,
        primaryRegion: primary.region,
        primarySourceLabel: primary.source_label ?? "Imported",
        secondaryId: secondary.id,
        secondarySlug: secondary.slug,
        secondaryName: secondary.name,
        secondaryMunicipality: secondary.municipality,
        secondaryRegion: secondary.region,
        secondarySourceLabel: secondary.source_label ?? "Imported",
        score,
        reason,
        distanceKm: Number(distanceKm.toFixed(2))
      });
    }
  }

  return candidates.sort((left, right) => right.score - left.score).slice(0, 100);
}
