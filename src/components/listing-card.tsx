import Link from "next/link";

import { Listing } from "@/lib/types";

type ListingCardProps = {
  listing: Listing;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Flexibelt";
  }

  return new Date(value).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <article className={`listingCard ${listing.isFeatured ? "featuredListing" : ""}`}>
      <div className="listingHeader">
        <div>
          <div className="eyebrow">{listing.isFeatured ? "Featured listing" : "Active listing"}</div>
          <h3>{listing.title}</h3>
          <p>
            {listing.facilityName}, {listing.municipality}
          </p>
        </div>
        <span className="statusBadge verified">{listing.boardingMode === "box" ? "Box" : "Lösdrift"}</span>
      </div>
      <p className="description">{listing.shortDescription}</p>
      <div className="pillRow">
        <span className="pill">{listing.openSpots} lediga platser</span>
        <span className="pill">Inflytt från {formatDate(listing.availableFrom)}</span>
        <span className="pill">{listing.region}</span>
      </div>
      <div className="metricRow">
        <strong>{listing.monthlyPriceSek.toLocaleString("sv-SE")} SEK/mån</strong>
        <span>{listing.status}</span>
      </div>
      <div className="cardActions">
        <Link className="primaryButton" href={`/stall/${listing.facilitySlug}`}>
          Visa anläggning
        </Link>
      </div>
    </article>
  );
}
