import { Facility } from "@/lib/types";

export const mockFacilities: Facility[] = [
  {
    id: "fac_uppsala_1",
    slug: "ekbacken-ridgard",
    name: "Ekbacken Ridgard",
    municipality: "Uppsala",
    region: "Uppsala lan",
    address: "Funbo-Lovsta 24, Uppsala",
    latitude: 59.8581,
    longitude: 17.8203,
    boardingModes: ["box"],
    monthlyPriceSek: 4650,
    hasRidingHouse: true,
    hasPaddock: true,
    openSpots: 2,
    verified: true,
    description:
      "Verifierad anlaggning med 24 boxplatser, ridhus, paddock och tydliga foder- och hagrutiner.",
    highlights: ["2 lediga boxplatser", "Ridhus 20x60", "Buss 10 min bort"],
    sourceLabel: "Claimed profile"
  },
  {
    id: "fac_stockholm_1",
    slug: "norrhage-loosdrift",
    name: "Norrhage Loosdrift",
    municipality: "Vallentuna",
    region: "Stockholms lan",
    address: "Angarns-Lundby 7, Vallentuna",
    latitude: 59.5594,
    longitude: 18.0891,
    boardingModes: ["loose"],
    monthlyPriceSek: 3500,
    hasRidingHouse: false,
    hasPaddock: true,
    openSpots: 4,
    verified: false,
    description:
      "Automatiskt listad anlaggning med fokus pa flock och stora vinterhagar. Agare kan claima profilen.",
    highlights: ["Lösdrift", "Stora vinterhagar", "4 platser lediga"],
    sourceLabel: "OSM import"
  },
  {
    id: "fac_skane_1",
    slug: "soderasens-sportstall",
    name: "Soderasens Sportstall",
    municipality: "Klippan",
    region: "Skane lan",
    address: "Vedbyvagen 12, Klippan",
    latitude: 56.1334,
    longitude: 13.1226,
    boardingModes: ["box", "loose"],
    monthlyPriceSek: 5200,
    hasRidingHouse: true,
    hasPaddock: true,
    openSpots: 1,
    verified: true,
    description:
      "Sportstall med bade box och mindre losdriftsgrupp, paddock, ridhus och externtranare valkomna vissa tider.",
    highlights: ["Verifierad", "Box och lösdrift", "1 plats ledig"],
    sourceLabel: "Claimed profile"
  },
  {
    id: "fac_vg_1",
    slug: "angslyckans-stall",
    name: "Angslyckans Stall",
    municipality: "Alingsas",
    region: "Vastra Gotalands lan",
    address: "Brogarden 5, Alingsas",
    latitude: 57.9336,
    longitude: 12.5313,
    boardingModes: ["box"],
    monthlyPriceSek: 4200,
    hasRidingHouse: false,
    hasPaddock: true,
    openSpots: 3,
    verified: false,
    description:
      "Mindre inackorderingsstall med fokus pa daglig service, god tillgang till ridvagar och enkel transportlogistik.",
    highlights: ["3 lediga platser", "Paddock", "Ridvägar direkt från gården"],
    sourceLabel: "OSM import"
  }
];
