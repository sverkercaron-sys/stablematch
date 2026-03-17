import Link from "next/link";

import { Facility } from "@/lib/types";

type FacilityCardProps = {
  facility: Facility;
};

export function FacilityCard({ facility }: FacilityCardProps) {
  return (
    <article className="facilityCard">
      <div className="facilityCardHeader">
        <div>
          <div className="eyebrow">{facility.sourceLabel}</div>
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
        <span className="pill">{facility.boardingModes.includes("box") ? "Box" : "Lösdrift"}</span>
        {facility.hasRidingHouse ? <span className="pill">Ridhus</span> : null}
        {facility.hasPaddock ? <span className="pill">Paddock</span> : null}
        <span className="pill">{facility.openSpots} lediga platser</span>
      </div>
      <div className="metricRow">
        <strong>{facility.monthlyPriceSek.toLocaleString("sv-SE")} SEK/mån</strong>
        <span>
          {facility.latitude.toFixed(3)}, {facility.longitude.toFixed(3)}
        </span>
      </div>
      <div className="cardActions">
        <Link className="primaryButton" href={`/stall/${facility.slug}`}>
          Visa stallprofil
        </Link>
        <Link className="secondaryLink" href={`/for-owners?facility=${facility.id}`}>
          Gör anspråk på profil
        </Link>
      </div>
    </article>
  );
}
