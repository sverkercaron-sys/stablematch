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
