import { FacilityCard } from "@/components/facility-card";
import { MapSurface } from "@/components/map-surface";
import { SearchPanel } from "@/components/search-panel";
import { getFacilities } from "@/lib/facilities";
import { SearchFilters } from "@/lib/types";

type HomeProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function coerceBoolean(value: string | string[] | undefined) {
  return value === "on" || value === "true";
}

function normalizeFilters(params: Record<string, string | string[] | undefined>): SearchFilters {
  const maxPriceValue = Array.isArray(params.maxPrice) ? params.maxPrice[0] : params.maxPrice;
  const boardingModeValue = Array.isArray(params.boardingMode)
    ? params.boardingMode[0]
    : params.boardingMode;

  return {
    q: Array.isArray(params.q) ? params.q[0] ?? "" : params.q ?? "",
    municipality: Array.isArray(params.municipality)
      ? params.municipality[0] ?? ""
      : params.municipality ?? "",
    boardingMode:
      boardingModeValue === "box" || boardingModeValue === "loose" ? boardingModeValue : "all",
    maxPrice: maxPriceValue ? Number(maxPriceValue) : null,
    ridingHouseOnly: coerceBoolean(params.ridingHouseOnly),
    paddockOnly: coerceBoolean(params.paddockOnly)
  };
}

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const filters = normalizeFilters(resolvedSearchParams);
  const facilities = await getFacilities(filters);

  return (
    <div className="pageStack">
      <section className="hero">
        <div className="heroContent">
          <div className="eyebrow">Sweden MVP</div>
          <h1>Hitta stallplatser och claima profiler innan marknaden är mogen.</h1>
          <p>
            StableMatch börjar som en sökbar katalog över svenska anläggningar och växer till en
            marketplace för lediga stallplatser.
          </p>
        </div>
        <div className="heroStats">
          <div>
            <strong>{facilities.length}</strong>
            <span>träffar i den här seed-datan</span>
          </div>
          <div>
            <strong>2 nivåer</strong>
            <span>auto-listad och verifierad profil</span>
          </div>
          <div>
            <strong>1 arbetsmodell</strong>
            <span>OSM seed + claim + manuell kvalitetssäkring</span>
          </div>
        </div>
      </section>

      <SearchPanel filters={filters} />

      <section className="contentGrid">
        <MapSurface facilities={facilities} />
        <div className="resultsPanel">
          <div className="resultsHeader">
            <h2>Stall i sökresultatet</h2>
            <p>
              Visar grundläggande profilkort som senare ska drivas av Supabase + PostGIS i stället
              för mock-data.
            </p>
          </div>
          <div className="resultsList">
            {facilities.map((facility) => (
              <FacilityCard key={facility.id} facility={facility} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
