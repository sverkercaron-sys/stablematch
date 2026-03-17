import Image from "next/image";
import Link from "next/link";

import { FacilityCard } from "@/components/facility-card";
import { ListingCard } from "@/components/listing-card";
import { LiveMap } from "@/components/live-map";
import { SearchPanel } from "@/components/search-panel";
import { getActiveListings, getFacilities, summarizeFacilities } from "@/lib/facilities";
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
    region: Array.isArray(params.region) ? params.region[0] ?? "" : params.region ?? "",
    boardingMode:
      boardingModeValue === "box" || boardingModeValue === "loose" ? boardingModeValue : "all",
    maxPrice: maxPriceValue ? Number(maxPriceValue) : null,
    ridingHouseOnly: coerceBoolean(params.ridingHouseOnly),
    paddockOnly: coerceBoolean(params.paddockOnly),
    verifiedOnly: coerceBoolean(params.verifiedOnly),
    availableNowOnly: coerceBoolean(params.availableNowOnly)
  };
}

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const filters = normalizeFilters(resolvedSearchParams);
  const facilities = await getFacilities(filters);
  const listings = await getActiveListings();
  const summary = summarizeFacilities(facilities);

  return (
    <div className="pageStack">
      <section className="hero">
        <div className="heroContent">
          <div className="eyebrow">StableMatch Sverige</div>
          <h1>Hitta rätt stallplats med bättre överblick, tydligare annonser och mindre letande.</h1>
          <p>
            StableMatch samlar stall, lösdrifter och lediga platser på ett ställe. Jämför
            anläggningar, se vad som är ledigt just nu och kontakta stallägare snabbare utan att
            leta runt mellan grupper, kontaktannonser och gamla trådar.
          </p>
          <div className="heroActions">
            <Link className="primaryButton" href="#search">
              Börja söka stall
            </Link>
            <Link className="secondaryLink" href="/for-owners">
              För stallägare
            </Link>
          </div>
          <div className="heroHighlights">
            <span>Jämför stall på karta</span>
            <span>Se verifierade profiler</span>
            <span>Hitta lediga platser direkt</span>
          </div>
        </div>
        <div className="heroVisual">
          <div className="heroImageFrame">
            <Image
              src="/hero-stable.svg"
              alt="Illustration av stall och hästanläggning"
              width={960}
              height={720}
              priority
            />
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
        </div>
      </section>

      <section className="valueStrip">
        <article className="valueCard">
          <div className="eyebrow">För hästägare</div>
          <h2>Slipp gissa dig fram.</h2>
          <p>Se anläggning, boendeform, platsläge och lediga stallplatser i samma flöde.</p>
        </article>
        <article className="valueCard">
          <div className="eyebrow">För stallägare</div>
          <h2>Visa rätt bild av verksamheten.</h2>
          <p>Claima profilen, lägg upp aktuella annonser och nå rätt typ av inackorderingar.</p>
        </article>
        <article className="valueCard">
          <div className="eyebrow">För marknaden</div>
          <h2>En tydligare startpunkt.</h2>
          <p>StableMatch gör marknaden sökbar, jämförbar och lättare att hålla uppdaterad.</p>
        </article>
      </section>

      <div id="search">
        <SearchPanel filters={filters} />
      </div>

      <section className="resultsPanel">
        <div className="resultsHeader">
          <h2>Lediga stallplatser just nu</h2>
          <p>
            Listings är nu separata objekt från själva anläggningen. Det här är första steget mot
            riktig marketplace-logik.
          </p>
        </div>
        <div className="listingGrid">
          {listings.length ? (
            listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)
          ) : (
            <article className="noticeCard">
              <p>Inga aktiva listings ännu. Seed-data läggs in via tabellen `listings`.</p>
            </article>
          )}
        </div>
      </section>

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
            {filters.region ? <span>län: {filters.region}</span> : null}
            {filters.verifiedOnly ? <span>endast verifierade</span> : null}
            {filters.availableNowOnly ? <span>endast lediga nu</span> : null}
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
