import Link from "next/link";
import { notFound } from "next/navigation";

import { submitInquiry } from "@/app/actions";
import { getFacilityBySlug, getListingsForFacility } from "@/lib/facilities";
import { formatBoardingModes } from "@/lib/types";

type FacilityPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function FacilityPage({ params }: FacilityPageProps) {
  const { slug } = await params;
  const facility = await getFacilityBySlug(slug);

  if (!facility) {
    notFound();
  }

  const listings = await getListingsForFacility(facility.id);

  return (
    <div className="pageStack">
      <section className="detailHero">
        <div>
          <div className="eyebrow">{facility.sourceLabel}</div>
          <h1>{facility.name}</h1>
          <p>
            {facility.address}, {facility.municipality}
          </p>
        </div>
        <div className={`statusBadge ${facility.verified ? "verified" : "listed"}`}>
          {facility.verified ? "Verifierad profil" : "Auto-listad profil"}
        </div>
      </section>

      <section className="detailGrid">
        <article className="detailCard">
          <h2>Grundinformation</h2>
          <div className="detailList">
            <div>
              <span>Pris från</span>
              <strong>{facility.monthlyPriceSek.toLocaleString("sv-SE")} SEK/mån</strong>
            </div>
            <div>
              <span>Boendeform</span>
              <strong>{formatBoardingModes(facility.boardingModes)}</strong>
            </div>
            <div>
              <span>Lediga platser</span>
              <strong>{facility.openSpots}</strong>
            </div>
            <div>
              <span>Koordinater</span>
              <strong>
                {facility.latitude.toFixed(4)}, {facility.longitude.toFixed(4)}
              </strong>
            </div>
          </div>
          <p>{facility.description}</p>
          <div className="pillRow">
            {facility.highlights.map((item) => (
              <span key={item} className="pill">
                {item}
              </span>
            ))}
          </div>
        </article>

        <article className="detailCard">
          <h2>Intresseanmälan</h2>
          <p>
            För MVP räcker en enkel intresseanmälan. Den kan skrivas till Supabase om service key
            finns, annars loggas den lokalt i servern tills databasen är klar.
          </p>
          <form action={submitInquiry} className="stackedForm">
            <input type="hidden" name="facilityId" value={facility.id} />
            <input type="hidden" name="listingId" value={listings[0]?.id ?? ""} />
            <input type="hidden" name="facilityName" value={facility.name} />
            <label className="field">
              <span>Namn</span>
              <input name="applicantName" required />
            </label>
            <label className="field">
              <span>E-post</span>
              <input name="email" type="email" required />
            </label>
            <label className="field">
              <span>Telefon</span>
              <input name="phone" required />
            </label>
            <label className="field">
              <span>Hästens namn</span>
              <input name="horseName" />
            </label>
            <label className="field">
              <span>Hästens ålder</span>
              <input name="horseAge" />
            </label>
            <label className="field">
              <span>Meddelande</span>
              <textarea name="message" rows={5} />
            </label>
            <button className="primaryButton" type="submit">
              Skicka intresseanmälan
            </button>
          </form>
        </article>
      </section>

      <section className="resultsPanel">
        <div className="resultsHeader">
          <h2>Aktiva annonser på anläggningen</h2>
          <p>Listings hanteras nu separat från själva stallprofilen.</p>
        </div>
        <div className="listingGrid">
          {listings.length ? (
            listings.map((listing) => (
              <article key={listing.id} className="listingCard">
                <div className="listingHeader">
                  <div>
                    <div className="eyebrow">{listing.status}</div>
                    <h3>{listing.title}</h3>
                  </div>
                  <span className="statusBadge verified">
                    {listing.boardingMode === "box" ? "Box" : "Lösdrift"}
                  </span>
                </div>
                <p className="description">{listing.shortDescription}</p>
                <div className="pillRow">
                  <span className="pill">{listing.openSpots} lediga platser</span>
                  <span className="pill">{listing.monthlyPriceSek.toLocaleString("sv-SE")} SEK/mån</span>
                </div>
              </article>
            ))
          ) : (
            <article className="noticeCard">
              <p>Inga aktiva annonser upplagda ännu för den här anläggningen.</p>
            </article>
          )}
        </div>
      </section>

      <section className="noticeCard">
        <p>
          Informationen kan vara ofullständig eller ändras. Stallägare kan själva uppdatera sin
          profil.
        </p>
        <Link className="secondaryLink" href={`/for-owners?facility=${facility.id}`}>
          Äger du detta stall? Gör anspråk på profilen.
        </Link>
      </section>
    </div>
  );
}
