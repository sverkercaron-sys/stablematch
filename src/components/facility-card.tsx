import Link from "next/link";

import { Facility, formatBoardingModes } from "@/lib/types";

type FacilityCardProps = {
  facility: Facility;
};

export function FacilityCard({ facility }: FacilityCardProps) {
  return (
    <article className={`facilityCard ${facility.verified ? "verifiedCard" : "listedCard"}`}>
      <div className="facilityCardHeader">
        <div>
          <div className="eyebrow">{facility.verified ? "Verified profile" : facility.sourceLabel}</div>
          <h3>{facility.name}</h3>
          <p>
            {facility.municipality}, {facility.region}
          </p>
        </div>
        <div className={`statusBadge ${facility.verified ? "verified" : "listed"}`}>
          {facility.verified ? "Verifierad" : "Auto-listad"}
        </div>
      </div>
      <p className="description">{facility.description}</p>
      <div className="pillRow">
        <span className="pill">{formatBoardingModes(facility.boardingModes)}</span>
        {facility.hasRidingHouse ? <span className="pill">Ridhus</span> : null}
        {facility.hasPaddock ? <span className="pill">Paddock</span> : null}
        <span className={`pill ${facility.openSpots > 0 ? "availabilityPill" : ""}`}>
          {facility.openSpots > 0 ? `${facility.openSpots} lediga platser` : "Inga lediga just nu"}
        </span>
      </div>
      <div className="metricRow">
        <strong>{facility.monthlyPriceSek.toLocaleString("sv-SE")} SEK/mån</strong>
        <span>{facility.verified ? "Uppdaterad av stallägare" : "Grundprofil från import"}</span>
      </div>
      <div className="cardActions">
        <Link className="primaryButton" href={`/stall/${facility.slug}`}>
          {facility.verified ? "Visa verifierad profil" : "Visa grundprofil"}
        </Link>
        <Link className="secondaryLink" href={`/for-owners?facility=${facility.id}`}>
          Gör anspråk på profil
        </Link>
      </div>
    </article>
  );
}
