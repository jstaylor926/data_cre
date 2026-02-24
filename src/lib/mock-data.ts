import type { Parcel, EntityResult, Substation, InfraData } from "./types";

// ─── Mock Parcels (Gwinnett + Fulton County, GA) ─────────────
export const MOCK_PARCELS: Parcel[] = [
  {
    apn: "R7240-001",
    county: "Gwinnett",
    owner_name: "DeThomas Development Group LLC",
    owner_mailing_address: "2300 Satellite Blvd, Duluth, GA 30097",
    site_address: "2300 Satellite Blvd, Duluth, GA 30097",
    acres: 42.5,
    land_use_code: "Industrial",
    zoning: "I-2",
    assessed_total: 2_850_000,
    assessed_land: 1_900_000,
    assessed_improvement: 950_000,
    last_sale_date: "2021-03-15",
    last_sale_price: 3_200_000,
    year_built: 1998,
    building_sqft: 45_000,
    geom: null,
  },
  {
    apn: "R7240-002",
    county: "Gwinnett",
    owner_name: "Peachtree Corners Holdings LLC",
    owner_mailing_address: "5200 W Jones Bridge Rd, Norcross, GA 30092",
    site_address: "5100 Peachtree Industrial Blvd, Norcross, GA 30092",
    acres: 67.3,
    land_use_code: "Industrial",
    zoning: "I-1",
    assessed_total: 4_100_000,
    assessed_land: 3_200_000,
    assessed_improvement: 900_000,
    last_sale_date: "2019-08-22",
    last_sale_price: 4_500_000,
    year_built: null,
    building_sqft: null,
    geom: null,
  },
  {
    apn: "R7240-003",
    county: "Gwinnett",
    owner_name: "Forum at Peachtree Corners LLC",
    owner_mailing_address: "1000 Forum Pl, Peachtree Corners, GA 30092",
    site_address: "5155 Peachtree Pkwy, Peachtree Corners, GA 30092",
    acres: 23.1,
    land_use_code: "Commercial",
    zoning: "C-2",
    assessed_total: 8_500_000,
    assessed_land: 3_100_000,
    assessed_improvement: 5_400_000,
    last_sale_date: "2020-11-01",
    last_sale_price: 12_000_000,
    year_built: 2019,
    building_sqft: 150_000,
    geom: null,
  },
  {
    apn: "R7240-004",
    county: "Gwinnett",
    owner_name: "Berkshire Industrial Realty Inc",
    owner_mailing_address: "100 Crescent Centre Pkwy, Tucker, GA 30084",
    site_address: "3500 Steve Reynolds Blvd, Norcross, GA 30093",
    acres: 95.2,
    land_use_code: "Industrial",
    zoning: "I-2",
    assessed_total: 6_200_000,
    assessed_land: 5_100_000,
    assessed_improvement: 1_100_000,
    last_sale_date: "2022-06-10",
    last_sale_price: 8_750_000,
    year_built: 2005,
    building_sqft: 120_000,
    geom: null,
  },
  {
    apn: "R7240-005",
    county: "Gwinnett",
    owner_name: "Sugarloaf Mills Partners LP",
    owner_mailing_address: "PO Box 12345, Atlanta, GA 30301",
    site_address: "5900 Sugarloaf Pkwy, Lawrenceville, GA 30043",
    acres: 120.8,
    land_use_code: "Commercial",
    zoning: "C-3",
    assessed_total: 15_000_000,
    assessed_land: 8_200_000,
    assessed_improvement: 6_800_000,
    last_sale_date: "2018-04-20",
    last_sale_price: 22_000_000,
    year_built: 2001,
    building_sqft: 800_000,
    geom: null,
  },
  {
    apn: "R7240-006",
    county: "Gwinnett",
    owner_name: "GA Highway 316 Land Trust",
    owner_mailing_address: "400 Westpark Dr, Peachtree City, GA 30269",
    site_address: null,
    acres: 78.4,
    land_use_code: "Agricultural",
    zoning: "A",
    assessed_total: 820_000,
    assessed_land: 820_000,
    assessed_improvement: 0,
    last_sale_date: "2015-02-14",
    last_sale_price: 950_000,
    year_built: null,
    building_sqft: null,
    geom: null,
  },
  {
    apn: "R7240-007",
    county: "Gwinnett",
    owner_name: "Quantix Data Partners LLC",
    owner_mailing_address: "1800 Century Blvd NE, Atlanta, GA 30345",
    site_address: "4000 Shackleford Rd, Norcross, GA 30093",
    acres: 55.0,
    land_use_code: "Industrial",
    zoning: "I-2",
    assessed_total: 3_900_000,
    assessed_land: 2_800_000,
    assessed_improvement: 1_100_000,
    last_sale_date: "2023-01-18",
    last_sale_price: 5_200_000,
    year_built: 2010,
    building_sqft: 75_000,
    geom: null,
  },
  {
    apn: "R7240-008",
    county: "Gwinnett",
    owner_name: "Jones Bridge Ventures LLC",
    owner_mailing_address: "6500 Jones Bridge Rd, Norcross, GA 30092",
    site_address: "6500 Jones Bridge Rd, Norcross, GA 30092",
    acres: 31.7,
    land_use_code: "Mixed-Use",
    zoning: "MU-1",
    assessed_total: 5_400_000,
    assessed_land: 2_600_000,
    assessed_improvement: 2_800_000,
    last_sale_date: "2020-09-30",
    last_sale_price: 6_100_000,
    year_built: 2015,
    building_sqft: 95_000,
    geom: null,
  },
  {
    apn: "F5100-001",
    county: "Fulton",
    owner_name: "Midtown Tech Campus LLC",
    owner_mailing_address: "10 10th St NE, Atlanta, GA 30309",
    site_address: "725 Ponce De Leon Ave, Atlanta, GA 30308",
    acres: 18.5,
    land_use_code: "Commercial",
    zoning: "C-1",
    assessed_total: 12_000_000,
    assessed_land: 7_500_000,
    assessed_improvement: 4_500_000,
    last_sale_date: "2022-02-28",
    last_sale_price: 18_500_000,
    year_built: 2018,
    building_sqft: 200_000,
    geom: null,
  },
  {
    apn: "F5100-002",
    county: "Fulton",
    owner_name: "Westside Industrial Trust",
    owner_mailing_address: "PO Box 54321, Atlanta, GA 30301",
    site_address: "1200 Marietta Blvd NW, Atlanta, GA 30318",
    acres: 52.0,
    land_use_code: "Industrial",
    zoning: "I-1",
    assessed_total: 3_800_000,
    assessed_land: 2_900_000,
    assessed_improvement: 900_000,
    last_sale_date: "2021-07-15",
    last_sale_price: 4_900_000,
    year_built: 1990,
    building_sqft: 65_000,
    geom: null,
  },
  {
    apn: "F5100-003",
    county: "Fulton",
    owner_name: "Chattahoochee Power Partners LP",
    owner_mailing_address: "500 Riverside Pkwy, Roswell, GA 30076",
    site_address: "3000 Holcomb Bridge Rd, Roswell, GA 30076",
    acres: 88.6,
    land_use_code: "Industrial",
    zoning: "I-2",
    assessed_total: 5_600_000,
    assessed_land: 4_800_000,
    assessed_improvement: 800_000,
    last_sale_date: "2023-04-12",
    last_sale_price: 7_200_000,
    year_built: null,
    building_sqft: null,
    geom: null,
  },
  {
    apn: "F5100-004",
    county: "Fulton",
    owner_name: "South Fulton Logistics LLC",
    owner_mailing_address: "9000 Camp Creek Pkwy, East Point, GA 30344",
    site_address: "9200 Camp Creek Pkwy, East Point, GA 30344",
    acres: 145.0,
    land_use_code: "Industrial",
    zoning: "I-2",
    assessed_total: 8_100_000,
    assessed_land: 7_200_000,
    assessed_improvement: 900_000,
    last_sale_date: "2022-11-05",
    last_sale_price: 10_500_000,
    year_built: 2008,
    building_sqft: 180_000,
    geom: null,
  },
];

// ─── Mock Substations ─────────────────────────────────────────
export const MOCK_SUBSTATIONS: Substation[] = [
  { id: "sub-001", name: "Norcross 230kV", capacity_mw: 450, voltage_kv: 230, lat: 33.9410, lng: -84.2135 },
  { id: "sub-002", name: "Duluth 115kV", capacity_mw: 200, voltage_kv: 115, lat: 34.0054, lng: -84.1485 },
  { id: "sub-003", name: "Lawrenceville 500kV", capacity_mw: 800, voltage_kv: 500, lat: 33.9562, lng: -83.9880 },
  { id: "sub-004", name: "Roswell 230kV", capacity_mw: 350, voltage_kv: 230, lat: 34.0234, lng: -84.3616 },
  { id: "sub-005", name: "College Park 115kV", capacity_mw: 280, voltage_kv: 115, lat: 33.6535, lng: -84.4494 },
];

// ─── Mock Infrastructure Data ─────────────────────────────────
export const MOCK_INFRA: Record<string, InfraData> = {
  "R7240-001": {
    distToSubstationMiles: 1.2, distToTransmissionMiles: 0.8, substationCapacityMW: 450,
    distToFiberMiles: 0.3, distToIXPMiles: 8.5, fiberRedundantPaths: 3,
    distToWaterMainMiles: 0.1, droughtRiskScore: 25, femaFloodZone: "X",
    nearWetlands: false, nearFaultLine: false, maxElevationChangePct: 2.1,
  },
  "R7240-004": {
    distToSubstationMiles: 0.8, distToTransmissionMiles: 0.3, substationCapacityMW: 450,
    distToFiberMiles: 0.5, distToIXPMiles: 9.2, fiberRedundantPaths: 2,
    distToWaterMainMiles: 0.2, droughtRiskScore: 25, femaFloodZone: "X",
    nearWetlands: false, nearFaultLine: false, maxElevationChangePct: 1.8,
  },
  "R7240-007": {
    distToSubstationMiles: 1.5, distToTransmissionMiles: 1.0, substationCapacityMW: 200,
    distToFiberMiles: 0.4, distToIXPMiles: 7.8, fiberRedundantPaths: 2,
    distToWaterMainMiles: 0.3, droughtRiskScore: 30, femaFloodZone: "X",
    nearWetlands: false, nearFaultLine: false, maxElevationChangePct: 3.5,
  },
  "F5100-003": {
    distToSubstationMiles: 2.1, distToTransmissionMiles: 1.5, substationCapacityMW: 350,
    distToFiberMiles: 1.2, distToIXPMiles: 12.0, fiberRedundantPaths: 1,
    distToWaterMainMiles: 0.8, droughtRiskScore: 35, femaFloodZone: "AE",
    nearWetlands: true, nearFaultLine: false, maxElevationChangePct: 5.2,
  },
  "F5100-004": {
    distToSubstationMiles: 3.0, distToTransmissionMiles: 2.2, substationCapacityMW: 280,
    distToFiberMiles: 1.8, distToIXPMiles: 15.0, fiberRedundantPaths: 1,
    distToWaterMainMiles: 1.2, droughtRiskScore: 40, femaFloodZone: "X",
    nearWetlands: false, nearFaultLine: false, maxElevationChangePct: 1.2,
  },
};

// Default infra for parcels not in the map
export const DEFAULT_INFRA: InfraData = {
  distToSubstationMiles: null, distToTransmissionMiles: null, substationCapacityMW: null,
  distToFiberMiles: null, distToIXPMiles: null, fiberRedundantPaths: 0,
  distToWaterMainMiles: null, droughtRiskScore: null, femaFloodZone: null,
  nearWetlands: false, nearFaultLine: false, maxElevationChangePct: null,
};

// ─── Mock Entities ────────────────────────────────────────────
export const MOCK_ENTITIES: EntityResult[] = [
  {
    llc_name: "DeThomas Development Group LLC",
    state: "GA",
    principal_name: "Michael DeThomas",
    agent_name: "DeThomas & Associates PA",
    status: "Active",
    formed_date: "2015-06-12",
    related_parcels: MOCK_PARCELS.filter((p) => p.owner_name?.includes("DeThomas")),
  },
  {
    llc_name: "Peachtree Corners Holdings LLC",
    state: "GA",
    principal_name: "Sarah Chen",
    agent_name: "Infilaw Corp Agent",
    status: "Active",
    formed_date: "2017-02-28",
    related_parcels: MOCK_PARCELS.filter((p) => p.owner_name?.includes("Peachtree Corners")),
  },
  {
    llc_name: "Quantix Data Partners LLC",
    state: "DE",
    principal_name: "James Rodriguez",
    agent_name: "CT Corporation System",
    status: "Active",
    formed_date: "2022-09-15",
    related_parcels: MOCK_PARCELS.filter((p) => p.owner_name?.includes("Quantix")),
  },
  {
    llc_name: "Chattahoochee Power Partners LP",
    state: "GA",
    principal_name: "Robert Williams",
    agent_name: "Williams & Hart LLP",
    status: "Active",
    formed_date: "2020-11-03",
    related_parcels: MOCK_PARCELS.filter((p) => p.owner_name?.includes("Chattahoochee")),
  },
];

// ─── Helpers ──────────────────────────────────────────────────
export function getParcelByAPN(apn: string): Parcel | undefined {
  return MOCK_PARCELS.find((p) => p.apn === apn);
}

export function searchParcels(query: string): Parcel[] {
  const q = query.toLowerCase();
  return MOCK_PARCELS.filter(
    (p) =>
      p.apn.toLowerCase().includes(q) ||
      p.owner_name?.toLowerCase().includes(q) ||
      p.site_address?.toLowerCase().includes(q)
  );
}

export function getParcelsByOwner(ownerName: string): Parcel[] {
  return MOCK_PARCELS.filter((p) =>
    p.owner_name?.toLowerCase().includes(ownerName.toLowerCase())
  );
}

export function getInfraForParcel(apn: string): InfraData {
  return MOCK_INFRA[apn] ?? DEFAULT_INFRA;
}

export function lookupEntity(llcName: string): EntityResult | undefined {
  return MOCK_ENTITIES.find((e) =>
    e.llc_name.toLowerCase().includes(llcName.toLowerCase())
  );
}
