export type BoardingMode = "box" | "loose";

export type Facility = {
  id: string;
  slug: string;
  name: string;
  municipality: string;
  region: string;
  address: string;
  latitude: number;
  longitude: number;
  boardingModes: BoardingMode[];
  monthlyPriceSek: number;
  hasRidingHouse: boolean;
  hasPaddock: boolean;
  openSpots: number;
  verified: boolean;
  description: string;
  highlights: string[];
  sourceLabel: string;
};

export function formatBoardingModes(modes: BoardingMode[]): string {
  return modes
    .map((mode) => (mode === "box" ? "Box" : "Lösdrift"))
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(" + ");
}

export type SearchFilters = {
  q: string;
  municipality: string;
  boardingMode: "all" | BoardingMode;
  maxPrice: number | null;
  ridingHouseOnly: boolean;
  paddockOnly: boolean;
};

export type InquiryPayload = {
  facilityId: string;
  facilityName: string;
  applicantName: string;
  email: string;
  phone: string;
  horseName: string;
  horseAge: string;
  message: string;
};

export type ReviewQueueItem = {
  id: string;
  slug: string;
  name: string;
  municipality: string;
  region: string;
  facilityType: string;
  sourceLabel: string;
  status: string;
  isActive: boolean;
  address: string;
  description: string;
  hasRidingHouse: boolean;
  hasPaddock: boolean;
  openSpots: number;
  claimCount: number;
  applicationCount: number;
  hasWeakName: boolean;
  needsReview: boolean;
};

export type DuplicateCandidate = {
  pairKey: string;
  primaryId: string;
  primarySlug: string;
  primaryName: string;
  primaryMunicipality: string;
  primaryRegion: string;
  primarySourceLabel: string;
  secondaryId: string;
  secondarySlug: string;
  secondaryName: string;
  secondaryMunicipality: string;
  secondaryRegion: string;
  secondarySourceLabel: string;
  score: number;
  reason: string;
  distanceKm: number | null;
};
