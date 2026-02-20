import type { 
  Parcel, 
  SiteScore, 
  ZoningSummary, 
  Comp, 
  FirmHistoryMatch 
} from "./types";

export const MOCK_PARCELS: Parcel[] = [
  {
    apn: "099-1-0234",
    county: "Gwinnett",
    owner_name: "Meridian Holdings LLC",
    owner_mailing_address: "PO Box 8812, Atlanta, GA 30306",
    site_address: "4821 Buford Hwy NE, Chamblee, GA 30341",
    acres: 2.14,
    land_use_code: "300",
    zoning: "C-2",
    assessed_total: 845000,
    last_sale_date: "2021-08-15",
    last_sale_price: 1240000,
  },
  // ... other parcels
];

export const MOCK_SITE_SCORE: SiteScore = {
  composite: 76,
  tier: "Strong Candidate",
  zoning: 18,
  access: 15,
  demographics: 14,
  market: 13,
  infrastructure: 16,
};

export const MOCK_ZONING_SUMMARY: ZoningSummary = {
  code: "C-2",
  name: "General Commercial District · Gwinnett County",
  flags: [
    { label: "Retail Permitted", type: "permitted" },
    { label: "Restaurant Permitted", type: "permitted" },
    { label: "Drive-Through Permitted", type: "permitted" },
    { label: "Car Wash Conditional", type: "conditional" },
    { label: "Residential Prohibited", type: "prohibited" },
  ],
  standards: [
    { label: "Front setback", value: "30 ft from right-of-way" },
    { label: "Side setback", value: "10 ft (20 ft adj. residential)" },
    { label: "Max height", value: "50 ft / 4 stories" },
    { label: "Min lot", value: "1.0 acre" },
    { label: "Max lot coverage", value: "75%" },
  ],
};

export const MOCK_COMPS: Comp[] = [
  {
    id: "c1",
    address: "3200 Peachtree Ind",
    distance: 0.4,
    acres: 2.3,
    date: "Jun '23",
    price: 1380000,
    psf: 13.8,
    coordinates: [-84.12, 33.96],
  },
  {
    id: "c2",
    address: "5510 Jimmy Carter",
    distance: 0.7,
    acres: 1.9,
    date: "Feb '23",
    price: 1100000,
    psf: 13.3,
    coordinates: [-84.13, 33.94],
  },
  {
    id: "c3",
    address: "1844 Old Norcross",
    distance: 0.9,
    acres: 0.9,
    date: "Oct '22",
    price: 410000,
    psf: 10.4,
    coordinates: [-84.10, 33.95],
  },
  {
    id: "c4",
    address: "730 Buford Hwy",
    distance: 1.0,
    acres: 2.8,
    date: "Apr '22",
    price: 1820000,
    psf: 14.9,
    coordinates: [-84.11, 33.97],
  },
];

export const MOCK_FIRM_HISTORY: FirmHistoryMatch[] = [
  {
    id: "fh1",
    deal_name: "Buford Hwy @ I-985 (2021)",
    year: 2021,
    outcome: "closed",
    similarity: 87,
    excerpt: "\"Similar 2.1ac C-2 corridor site. Traffic count 44K ADT was key driver. Achieved $14.20/SF. Strong QSR comp set.\"",
  },
  {
    id: "fh2",
    deal_name: "Jimmy Carter Blvd Pad (2019)",
    year: 2019,
    outcome: "passed",
    similarity: 72,
    excerpt: "\"Passed due to traffic count 26K ADT below 30K threshold. This site shows 41K ADT — that concern is resolved.\"",
  },
];

export function getParcelByAPN(apn: string): Parcel | undefined {
  return MOCK_PARCELS.find((p) => p.apn === apn);
}

export function searchParcels(query: string): Parcel[] {
  const q = query.toLowerCase();
  return MOCK_PARCELS.filter(
    (p) =>
      p.apn.toLowerCase().includes(q) ||
      p.site_address?.toLowerCase().includes(q) ||
      p.owner_name?.toLowerCase().includes(q)
  );
}

export function getParcelsByOwner(ownerName: string): Parcel[] {
  const q = ownerName.toLowerCase();
  return MOCK_PARCELS.filter((p) => p.owner_name?.toLowerCase().includes(q));
}
