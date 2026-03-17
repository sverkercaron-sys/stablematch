import { mockFacilities } from "@/lib/mock-data";
import { createServiceSupabaseClient } from "@/lib/supabase";
import { Facility, SearchFilters } from "@/lib/types";

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
