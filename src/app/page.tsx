import { FacilityCard } from "@/components/facility-card";
import { LiveMap } from "@/components/live-map";
import { SearchPanel } from "@/components/search-panel";
import { getFacilities, summarizeFacilities } from "@/lib/facilities";
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
  const summary = summarizeFacilities(facilities);

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
            <span>anläggningar i aktuellt resultat</span>
          </div>
          <div>
            <strong>{summary.verifiedCount}</strong>
            <span>verifierade profiler i träfflistan</span>
          </div>
          <div>
            <strong>{summary.openSpotCount}</strong>
            <span>öppna platser i seedad data</span>
          </div>
        </div>
      </section>

      <SearchPanel filters={filters} />

      <section className="contentGrid">
        <LiveMap facilities={facilities} />
        <div className="resultsPanel">
          <div className="resultsHeader">
            <h2>Stall i sökresultatet</h2>
            <p>
              Resultatlistan läser från Supabase när nycklar finns, annars används mock-data som
              fallback för lokal utveckling.
            </p>
          </div>
          <div className="summaryStrip">
            <span>{summary.municipalities} kommuner</span>
            <span>{summary.verifiedCount} verifierade</span>
            <span>{summary.openSpotCount} öppna platser</span>
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
