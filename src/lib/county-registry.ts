/**
 * County Registry — single source of truth for multi-county ArcGIS data sources.
 *
 * Each county entry describes:
 *   - ArcGIS service URL and layer IDs
 *   - Field name mappings (county → our Parcel interface)
 *   - Service type (FeatureServer supports GeoJSON; MapServer returns Esri JSON)
 *   - Default map center for UI
 *
 * To add a new county:
 *   1. Find its public ArcGIS endpoint (FeatureServer or MapServer)
 *   2. Query layer 0 (or whichever has parcels) with ?f=json to get field names
 *   3. Add a CountyConfig entry below mapping those fields
 *   4. Set status to "discovered" until fully tested, then "verified"
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ServiceType = "FeatureServer" | "MapServer";
export type CountyStatus = "verified" | "discovered" | "partial" | "unavailable";

/** Maps county-specific ArcGIS field names → our normalized Parcel fields. */
export interface FieldMap {
  /** Parcel ID / APN / PIN — primary key */
  apn: string;
  /** Property owner name */
  owner: string | null;
  /** Site address — single field, or pipe-delimited multi-field (e.g. "LOCADDR|LOCCITY|LOCSTATE|LOCZIP") */
  address: string | null;
  /** Acreage */
  acres: string | null;
  /** Land use code */
  landUseCode: string | null;
  /** Land use description (if separate from code) */
  landUseDesc: string | null;
  /** Zoning code (null if zoning is on a separate layer) */
  zoning: string | null;
  /** Zoning description */
  zoningDesc: string | null;
  /** Total assessed value */
  assessedTotal: string | null;
  /** Land value */
  landValue: string | null;
  /** Improvement value */
  improvementValue: string | null;
  /** Mailing address (single field or pipe-delimited) */
  mailingAddress: string | null;
  /** Legal description */
  legalDesc: string | null;
  /** Deed reference fields (comma-separated field names) */
  deedRefs: string | null;
  /** Previous owner / grantor fields (comma-separated field names) */
  previousOwners: string | null;
}

export interface CountyConfig {
  /** Unique ID — lowercase, used in URLs and store */
  id: string;
  /** Display name */
  name: string;
  /** Full name with "County" */
  fullName: string;
  /** State abbreviation */
  state: string;
  /** FIPS code */
  fips: string;
  /** Integration status */
  status: CountyStatus;

  // ── ArcGIS Service ──
  serviceType: ServiceType;
  /** Base URL for the ArcGIS service (without layer ID or /query) */
  baseUrl: string;
  /** Layer ID for parcel polygons (geometry + basic fields) */
  parcelLayerId: number;
  /** Layer ID for zoning polygons (null if zoning is on the parcel layer) */
  zoningLayerId: number | null;
  /**
   * Layer ID for tax/property table (null if tax data is on the parcel layer).
   * When non-null, this is typically a non-spatial table joined by the APN field.
   */
  taxLayerId: number | null;

  // ── Field Mappings ──
  fields: FieldMap;
  /** Zoning field name on the zoning layer (when zoningLayerId is set) */
  zoningLayerField: string | null;
  /** Zoning description field on the zoning layer */
  zoningLayerDescField: string | null;
  /** Fields to request for parcel bbox queries (comma-separated) */
  parcelOutFields: string;
  /** Fields to request for search queries (comma-separated) */
  searchOutFields: string;

  // ── Behavior Flags ──
  /** FeatureServer supports f=geojson natively; MapServer does not */
  supportsGeoJSON: boolean;
  /**
   * Whether address is composed from multiple fields (pipe-delimited in fields.address).
   * If true, the address field value is "FIELD1|FIELD2|FIELD3" and must be assembled.
   */
  multiFieldAddress: boolean;

  // ── Map Defaults ──
  defaultCenter: [number, number]; // [lng, lat]
  defaultZoom: number;

  // ── Metadata ──
  population: number;
  region: string;
  notes: string;
}


// ─── Verified Counties ──────────────────────────────────────────────────────

const gwinnett: CountyConfig = {
  id: "gwinnett",
  name: "Gwinnett",
  fullName: "Gwinnett County",
  state: "GA",
  fips: "13135",
  status: "verified",

  serviceType: "FeatureServer",
  baseUrl: "https://services3.arcgis.com/RfpmnkSAQleRbndX/arcgis/rest/services/Property_and_Tax/FeatureServer",
  parcelLayerId: 0,
  zoningLayerId: 1,
  taxLayerId: 3,

  fields: {
    apn: "PIN",
    owner: "OWNER1",
    address: "LOCADDR|LOCCITY|LOCSTATE|LOCZIP",
    acres: "LEGALAC",
    landUseCode: "PCDESC",
    landUseDesc: null,
    zoning: "ZONING",
    zoningDesc: "ZONEDESC",
    assessedTotal: "TOTVAL1",
    landValue: "LANDVAL1",
    improvementValue: "DWLGVAL1",
    mailingAddress: "MAILADDR|MAILCITY|MAILSTAT|MAILZIP",
    legalDesc: "LEGAL1",
    deedRefs: "DOC1REF,DOC2REF,DOC3REF",
    previousOwners: "GRANTOR1,GRANTOR2,GRANTOR3",
  },
  zoningLayerField: "TYPE",
  zoningLayerDescField: "JURISDICTION",
  parcelOutFields: "PIN,ADDRESS,CALCULATEDACREAGE,TAXPIN",
  searchOutFields: "PIN,OWNER1,LOCADDR,LOCCITY,ZONING,LEGALAC",

  supportsGeoJSON: true,
  multiFieldAddress: true,

  defaultCenter: [-84.1950, 33.9450],
  defaultZoom: 14,

  population: 805321,
  region: "Atlanta Regional Commission",
  notes: "Production endpoint. Tax data on separate table (layer 3).",
};

const fulton: CountyConfig = {
  id: "fulton",
  name: "Fulton",
  fullName: "Fulton County",
  state: "GA",
  fips: "13121",
  status: "verified",

  serviceType: "MapServer",
  baseUrl: "https://gismaps.fultoncountyga.gov/arcgispub2/rest/services/PropertyMapViewer/PropertyMapViewer/MapServer",
  parcelLayerId: 11,
  zoningLayerId: 34,
  taxLayerId: null, // Tax data is on the parcel layer

  fields: {
    apn: "ParcelID",
    owner: "Owner",
    address: "Address",
    acres: "LandAcres",
    landUseCode: "LUCode",
    landUseDesc: null,
    zoning: null, // Zoning requires spatial join to layer 34
    zoningDesc: null,
    assessedTotal: "TotAssess",
    landValue: "LandAssess",
    improvementValue: "ImprAssess",
    mailingAddress: null,
    legalDesc: null,
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: "ZClass",
  zoningLayerDescField: "ZClassDesc",
  parcelOutFields: "ParcelID,Address,LandAcres",
  searchOutFields: "ParcelID,Owner,Address,LandAcres,TotAssess",

  supportsGeoJSON: true,
  multiFieldAddress: false,

  defaultCenter: [-84.39, 33.749],
  defaultZoom: 13,

  population: 920581,
  region: "Atlanta Regional Commission",
  notes: "Tax data on parcel layer. Zoning requires spatial join to layer 34. Covers unincorporated Fulton.",
};


// ─── Discovered Counties (endpoint found, field mapping needs verification) ─

const dekalb: CountyConfig = {
  id: "dekalb",
  name: "DeKalb",
  fullName: "DeKalb County",
  state: "GA",
  fips: "13089",
  status: "discovered",

  serviceType: "FeatureServer",
  baseUrl: "https://services2.arcgis.com/IxVN2oUE9EYLSnPE/arcgis/rest/services/Parcels/FeatureServer",
  parcelLayerId: 0,
  zoningLayerId: null,
  taxLayerId: null,

  fields: {
    apn: "PARCELID",
    owner: "OWNERNME1",
    address: "SITEADDRES",
    acres: "STATEDAREA",
    landUseCode: "USECD",
    landUseDesc: "USEDSCRP",
    zoning: null,
    zoningDesc: null,
    assessedTotal: null,
    landValue: null,
    improvementValue: null,
    mailingAddress: null,
    legalDesc: null,
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: null,
  zoningLayerDescField: null,
  parcelOutFields: "PARCELID,SITEADDRES,STATEDAREA,OWNERNME1",
  searchOutFields: "PARCELID,OWNERNME1,SITEADDRES,STATEDAREA,USECD,USEDSCRP",

  supportsGeoJSON: true,
  multiFieldAddress: false,

  defaultCenter: [-84.2281, 33.7748],
  defaultZoom: 13,

  population: 691893,
  region: "Atlanta Regional Commission",
  notes: "AGOL hosted. Fields: CVTTXCD, CLASSCD, CNVYNAME. No zoning or assessed values in public layer.",
};

const cherokee: CountyConfig = {
  id: "cherokee",
  name: "Cherokee",
  fullName: "Cherokee County",
  state: "GA",
  fips: "13057",
  status: "discovered",

  serviceType: "FeatureServer",
  baseUrl: "https://gis.cherokeecountyga.gov/arcgis/rest/services",
  parcelLayerId: 0,
  zoningLayerId: null,
  taxLayerId: null,

  fields: {
    apn: "PIN",
    owner: null,
    address: null,
    acres: null,
    landUseCode: null,
    landUseDesc: null,
    zoning: null,
    zoningDesc: null,
    assessedTotal: null,
    landValue: null,
    improvementValue: null,
    mailingAddress: null,
    legalDesc: null,
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: null,
  zoningLayerDescField: null,
  parcelOutFields: "*",
  searchOutFields: "*",

  supportsGeoJSON: true,
  multiFieldAddress: false,

  defaultCenter: [-84.4769, 34.2368],
  defaultZoom: 12,

  population: 214346,
  region: "Atlanta Regional Commission",
  notes: "Services root found. Parcel/tax layer IDs and fields need discovery within Hosted folder.",
};

const clayton: CountyConfig = {
  id: "clayton",
  name: "Clayton",
  fullName: "Clayton County",
  state: "GA",
  fips: "13063",
  status: "discovered",

  serviceType: "MapServer",
  baseUrl: "https://weba.co.clayton.ga.us:5443/server/rest/services/TaxAssessor/Parcels/MapServer",
  parcelLayerId: 0,
  zoningLayerId: null,
  taxLayerId: null,

  fields: {
    apn: "PARCELID",
    owner: null,
    address: null,
    acres: null,
    landUseCode: null,
    landUseDesc: null,
    zoning: null,
    zoningDesc: null,
    assessedTotal: null,
    landValue: null,
    improvementValue: null,
    mailingAddress: null,
    legalDesc: null,
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: null,
  zoningLayerDescField: null,
  parcelOutFields: "*",
  searchOutFields: "*",

  supportsGeoJSON: false,
  multiFieldAddress: false,

  defaultCenter: [-84.3624, 33.5413],
  defaultZoom: 12,

  population: 259424,
  region: "Atlanta Regional Commission",
  notes: "Self-hosted behind county firewall (port 5443). May have access restrictions.",
};

const forsyth: CountyConfig = {
  id: "forsyth",
  name: "Forsyth",
  fullName: "Forsyth County",
  state: "GA",
  fips: "13117",
  status: "discovered",

  serviceType: "MapServer",
  baseUrl: "https://geo.forsythco.com/gis/rest/services/EnerGov/EnerGovParcelAddressMapService/MapServer",
  parcelLayerId: 1,
  zoningLayerId: 5,
  taxLayerId: null,

  fields: {
    apn: "PARCELID",
    owner: null,
    address: null,
    acres: null,
    landUseCode: null,
    landUseDesc: null,
    zoning: null,
    zoningDesc: null,
    assessedTotal: null,
    landValue: null,
    improvementValue: null,
    mailingAddress: null,
    legalDesc: null,
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: null,
  zoningLayerDescField: null,
  parcelOutFields: "*",
  searchOutFields: "*",

  supportsGeoJSON: false,
  multiFieldAddress: false,

  defaultCenter: [-84.1410, 34.2263],
  defaultZoom: 12,

  population: 175511,
  region: "Georgia Mountains",
  notes: "Layer 1=TaxParcels, Layer 5=ZoningDistrict. Field names TBD.",
};

const douglas: CountyConfig = {
  id: "douglas",
  name: "Douglas",
  fullName: "Douglas County",
  state: "GA",
  fips: "13097",
  status: "discovered",

  serviceType: "MapServer",
  baseUrl: "https://maps.douglascountyga.gov/arcgis/rest/services",
  parcelLayerId: 0,
  zoningLayerId: null,
  taxLayerId: null,

  fields: {
    apn: "PARCELID",
    owner: null,
    address: null,
    acres: null,
    landUseCode: null,
    landUseDesc: null,
    zoning: null,
    zoningDesc: null,
    assessedTotal: null,
    landValue: null,
    improvementValue: null,
    mailingAddress: null,
    legalDesc: null,
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: null,
  zoningLayerDescField: null,
  parcelOutFields: "*",
  searchOutFields: "*",

  supportsGeoJSON: false,
  multiFieldAddress: false,

  defaultCenter: [-84.7674, 33.7512],
  defaultZoom: 12,

  population: 132403,
  region: "Atlanta Regional Commission",
  notes: "Services root found with PropertyInformation and LandRecords folders. Needs folder drilling.",
};

const fayette: CountyConfig = {
  id: "fayette",
  name: "Fayette",
  fullName: "Fayette County",
  state: "GA",
  fips: "13113",
  status: "discovered",

  serviceType: "FeatureServer",
  baseUrl: "https://gis.fayettecountyga.gov/arcgis/rest/services",
  parcelLayerId: 0,
  zoningLayerId: null,
  taxLayerId: null,

  fields: {
    apn: "PARCELID",
    owner: null,
    address: null,
    acres: null,
    landUseCode: null,
    landUseDesc: null,
    zoning: null,
    zoningDesc: null,
    assessedTotal: null,
    landValue: null,
    improvementValue: null,
    mailingAddress: null,
    legalDesc: null,
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: null,
  zoningLayerDescField: null,
  parcelOutFields: "*",
  searchOutFields: "*",

  supportsGeoJSON: true,
  multiFieldAddress: false,

  defaultCenter: [-84.4549, 33.4139],
  defaultZoom: 12,

  population: 106567,
  region: "Atlanta Regional Commission",
  notes: "Services root found with LandManagement and ParcelNotifications folders. Needs exploration.",
};

const rockdale: CountyConfig = {
  id: "rockdale",
  name: "Rockdale",
  fullName: "Rockdale County",
  state: "GA",
  fips: "13247",
  status: "discovered",

  serviceType: "FeatureServer",
  baseUrl: "https://services.arcgis.com/Tbke9ca9DhtF4VIx/arcgis/rest/services/Tax_Maps_WFL1/FeatureServer",
  parcelLayerId: 28,
  zoningLayerId: null,
  taxLayerId: null,

  fields: {
    apn: "PARCEL_NO",
    owner: null,
    address: null,
    acres: null,
    landUseCode: null,
    landUseDesc: null,
    zoning: null,
    zoningDesc: null,
    assessedTotal: null,
    landValue: null,
    improvementValue: null,
    mailingAddress: null,
    legalDesc: null,
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: null,
  zoningLayerDescField: null,
  parcelOutFields: "PARCEL_NO",
  searchOutFields: "PARCEL_NO",

  supportsGeoJSON: true,
  multiFieldAddress: false,

  defaultCenter: [-84.0195, 33.6553],
  defaultZoom: 13,

  population: 85215,
  region: "Atlanta Regional Commission",
  notes: "Layer 28=Parcels_1. Limited fields — may need supplemental data source.",
};

const coweta: CountyConfig = {
  id: "coweta",
  name: "Coweta",
  fullName: "Coweta County",
  state: "GA",
  fips: "13077",
  status: "discovered",

  serviceType: "FeatureServer",
  baseUrl: "https://cccjcgiswa.coweta.ga.us/arcgis/rest/services/Parcels/FeatureServer",
  parcelLayerId: 0,
  zoningLayerId: null,
  taxLayerId: null,

  fields: {
    apn: "PARCELID",
    owner: null,
    address: null,
    acres: null,
    landUseCode: null,
    landUseDesc: null,
    zoning: null,
    zoningDesc: null,
    assessedTotal: null,
    landValue: null,
    improvementValue: null,
    mailingAddress: null,
    legalDesc: null,
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: null,
  zoningLayerDescField: null,
  parcelOutFields: "*",
  searchOutFields: "*",

  supportsGeoJSON: true,
  multiFieldAddress: false,

  defaultCenter: [-84.7704, 33.3537],
  defaultZoom: 12,

  population: 127317,
  region: "Three Rivers",
  notes: "Self-hosted FeatureServer. Field names TBD.",
};

const newton: CountyConfig = {
  id: "newton",
  name: "Newton",
  fullName: "Newton County",
  state: "GA",
  fips: "13217",
  status: "discovered",

  serviceType: "FeatureServer",
  baseUrl: "https://gis.ncboc.com/arcgis/rest/services/Public/Newton_Parcels/FeatureServer",
  parcelLayerId: 0,
  zoningLayerId: null,
  taxLayerId: null,

  fields: {
    apn: "PARCEL_NO",
    owner: "OwnersName",
    address: "ParcelAddr",
    acres: null,
    landUseCode: null,
    landUseDesc: null,
    zoning: null,
    zoningDesc: null,
    assessedTotal: null,
    landValue: null,
    improvementValue: null,
    mailingAddress: null,
    legalDesc: null,
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: null,
  zoningLayerDescField: null,
  parcelOutFields: "PARCEL_NO,OwnersName,ParcelAddr",
  searchOutFields: "PARCEL_NO,OwnersName,ParcelAddr,StreetNumb,StreetName",

  supportsGeoJSON: true,
  multiFieldAddress: false,

  defaultCenter: [-83.8530, 33.5567],
  defaultZoom: 12,

  population: 99958,
  region: "Northeast Georgia",
  notes: "Also on AGOL: services1.arcgis.com/qTQ6qYkHpxlu0G82.",
};

const bartow: CountyConfig = {
  id: "bartow",
  name: "Bartow",
  fullName: "Bartow County",
  state: "GA",
  fips: "13015",
  status: "discovered",

  serviceType: "FeatureServer",
  baseUrl: "https://services.arcgis.com/0tQ9yX5b2VG5RHei/arcgis/rest/services/Parcels/FeatureServer",
  parcelLayerId: 12,
  zoningLayerId: null,
  taxLayerId: null,

  fields: {
    apn: "PARCELID",
    owner: null,
    address: null,
    acres: "D_LOT_SIZE",
    landUseCode: null,
    landUseDesc: null,
    zoning: null,
    zoningDesc: null,
    assessedTotal: null,
    landValue: null,
    improvementValue: null,
    mailingAddress: null,
    legalDesc: null,
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: null,
  zoningLayerDescField: null,
  parcelOutFields: "PARCELID,D_LOT_SIZE,PIN",
  searchOutFields: "PARCELID,PIN,D_LOT_SIZE",

  supportsGeoJSON: true,
  multiFieldAddress: false,

  defaultCenter: [-84.8390, 34.1879],
  defaultZoom: 12,

  population: 100157,
  region: "Northwest Georgia",
  notes: "Layer 12=Tax Parcels. Also has ExistingLandUse service.",
};

const bibb: CountyConfig = {
  id: "bibb",
  name: "Bibb",
  fullName: "Bibb County",
  state: "GA",
  fips: "13021",
  status: "discovered",

  serviceType: "FeatureServer",
  baseUrl: "https://services2.arcgis.com/zPFLSOZ5HzUzzTQb/arcgis/rest/services/TaxParcels/FeatureServer",
  parcelLayerId: 0,
  zoningLayerId: null,
  taxLayerId: null,

  fields: {
    apn: "PARCELID",
    owner: "OWNERNME1",
    address: "SITEADDRESS",
    acres: "STATEDAREA",
    landUseCode: "USECD",
    landUseDesc: "USEDSCRP",
    zoning: null,
    zoningDesc: null,
    assessedTotal: null,
    landValue: null,
    improvementValue: null,
    mailingAddress: null,
    legalDesc: null,
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: null,
  zoningLayerDescField: null,
  parcelOutFields: "PARCELID,SITEADDRESS,STATEDAREA,OWNERNME1",
  searchOutFields: "PARCELID,OWNERNME1,SITEADDRESS,STATEDAREA,USECD,USEDSCRP",

  supportsGeoJSON: true,
  multiFieldAddress: false,

  defaultCenter: [-83.6324, 32.8407],
  defaultZoom: 13,

  population: 155547,
  region: "Middle Georgia",
  notes: "AGOL hosted. Same vendor schema as DeKalb (CVTTXCD, CLASSCD, CNVYNAME).",
};

const chatham: CountyConfig = {
  id: "chatham",
  name: "Chatham",
  fullName: "Chatham County",
  state: "GA",
  fips: "13051",
  status: "discovered",

  serviceType: "MapServer",
  baseUrl: "https://pub.sagis.org/arcgis/rest/services/OpenData/Parcels/MapServer",
  parcelLayerId: 27,
  zoningLayerId: null,
  taxLayerId: null,

  fields: {
    apn: "PARCELID",
    owner: null,
    address: null,
    acres: null,
    landUseCode: null,
    landUseDesc: null,
    zoning: null,
    zoningDesc: null,
    assessedTotal: null,
    landValue: null,
    improvementValue: null,
    mailingAddress: null,
    legalDesc: null,
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: null,
  zoningLayerDescField: null,
  parcelOutFields: "*",
  searchOutFields: "*",

  supportsGeoJSON: false,
  multiFieldAddress: false,

  defaultCenter: [-81.0998, 32.0809],
  defaultZoom: 12,

  population: 265128,
  region: "Coastal Regional Commission",
  notes: "Hosted by SAGIS (Savannah Area GIS). Layer 27=Parcel Digest 2025.",
};

const hall: CountyConfig = {
  id: "hall",
  name: "Hall",
  fullName: "Hall County",
  state: "GA",
  fips: "13139",
  status: "discovered",

  serviceType: "MapServer",
  baseUrl: "https://webmap.hallcounty.org/server/rest/services/GHCGIS_WebData/MapServer",
  parcelLayerId: 1,
  zoningLayerId: null,
  taxLayerId: null,

  fields: {
    apn: "PARCELID",
    owner: null,
    address: null,
    acres: null,
    landUseCode: null,
    landUseDesc: null,
    zoning: null,
    zoningDesc: null,
    assessedTotal: null,
    landValue: null,
    improvementValue: null,
    mailingAddress: null,
    legalDesc: null,
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: null,
  zoningLayerDescField: null,
  parcelOutFields: "*",
  searchOutFields: "*",

  supportsGeoJSON: false,
  multiFieldAddress: false,

  defaultCenter: [-83.8168, 34.3036],
  defaultZoom: 12,

  population: 179684,
  region: "Georgia Mountains",
  notes: "Self-hosted MapServer. Field names TBD.",
};

const muscogee: CountyConfig = {
  id: "muscogee",
  name: "Muscogee",
  fullName: "Muscogee County",
  state: "GA",
  fips: "13215",
  status: "discovered",

  serviceType: "MapServer",
  baseUrl: "https://gis.columbusga.org/arcgis/rest/services/TaxAssessors/CurrentYear/MapServer",
  parcelLayerId: 20,
  zoningLayerId: null,
  taxLayerId: null,

  fields: {
    apn: "PARCELID",
    owner: null,
    address: null,
    acres: null,
    landUseCode: null,
    landUseDesc: null,
    zoning: null,
    zoningDesc: null,
    assessedTotal: null,
    landValue: null,
    improvementValue: null,
    mailingAddress: null,
    legalDesc: null,
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: null,
  zoningLayerDescField: null,
  parcelOutFields: "*",
  searchOutFields: "*",

  supportsGeoJSON: false,
  multiFieldAddress: false,

  defaultCenter: [-84.9877, 32.4610],
  defaultZoom: 13,

  population: 189885,
  region: "River Valley",
  notes: "Columbus-Muscogee consolidated govt. Layer 20 in TaxAssessors/CurrentYear service.",
};

const columbia: CountyConfig = {
  id: "columbia",
  name: "Columbia",
  fullName: "Columbia County",
  state: "GA",
  fips: "13073",
  status: "discovered",

  serviceType: "FeatureServer",
  baseUrl: "https://services3.arcgis.com/XqCfDEcWKHtcTHsa/arcgis/rest/services/Parcels_Columbia_County_GA/FeatureServer",
  parcelLayerId: 0,
  zoningLayerId: null,
  taxLayerId: null,

  fields: {
    apn: "PIN",
    owner: null,
    address: null,
    acres: "Calc_Acre",
    landUseCode: null,
    landUseDesc: null,
    zoning: null,
    zoningDesc: null,
    assessedTotal: null,
    landValue: null,
    improvementValue: null,
    mailingAddress: null,
    legalDesc: null,
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: null,
  zoningLayerDescField: null,
  parcelOutFields: "PIN,Calc_Acre",
  searchOutFields: "PIN,Calc_Acre",

  supportsGeoJSON: true,
  multiFieldAddress: false,

  defaultCenter: [-82.2540, 33.5449],
  defaultZoom: 12,

  population: 124053,
  region: "Central Savannah River Area",
  notes: "AGOL hosted. Limited fields: PIN, Method, Calc_Acre. May need supplemental tax data.",
};

const dougherty: CountyConfig = {
  id: "dougherty",
  name: "Dougherty",
  fullName: "Dougherty County",
  state: "GA",
  fips: "13095",
  status: "discovered",

  serviceType: "MapServer",
  baseUrl: "https://maps.albanyga.gov/arcgis/rest/services/Parcel/MapServer",
  parcelLayerId: 0,
  zoningLayerId: null,
  taxLayerId: null,

  fields: {
    apn: "PARCELID",
    owner: null,
    address: null,
    acres: null,
    landUseCode: null,
    landUseDesc: null,
    zoning: null,
    zoningDesc: null,
    assessedTotal: null,
    landValue: null,
    improvementValue: null,
    mailingAddress: null,
    legalDesc: null,
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: null,
  zoningLayerDescField: null,
  parcelOutFields: "*",
  searchOutFields: "*",

  supportsGeoJSON: false,
  multiFieldAddress: false,

  defaultCenter: [-84.1557, 31.5785],
  defaultZoom: 13,

  population: 94565,
  region: "Southwest Georgia",
  notes: "Albany-Dougherty. Parcel + ParcelMap + Tax_Address_Points services found.",
};

const jackson: CountyConfig = {
  id: "jackson",
  name: "Jackson",
  fullName: "Jackson County",
  state: "GA",
  fips: "13157",
  status: "discovered",

  serviceType: "FeatureServer",
  baseUrl: "https://services8.arcgis.com/bcbi4lYRFOsss0F5/arcgis/rest/services/Tax_Parcels/FeatureServer",
  parcelLayerId: 9,
  zoningLayerId: null,
  taxLayerId: null,

  fields: {
    apn: "tax_id",
    owner: null,
    address: "HOUSE_NO",
    acres: "TOTALACRES",
    landUseCode: null,
    landUseDesc: null,
    zoning: null,
    zoningDesc: null,
    assessedTotal: null,
    landValue: null,
    improvementValue: null,
    mailingAddress: null,
    legalDesc: "LEGAL_DESC",
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: null,
  zoningLayerDescField: null,
  parcelOutFields: "tax_id,HOUSE_NO,STREET_NAM,TOTALACRES",
  searchOutFields: "tax_id,HOUSE_NO,STREET_NAM,TOTALACRES,REALKEY,LEGAL_DESC",

  supportsGeoJSON: true,
  multiFieldAddress: false,

  defaultCenter: [-83.5596, 34.1174],
  defaultZoom: 12,

  population: 60485,
  region: "Northeast Georgia",
  notes: "Layer 9=Tax Parcels. Fields: REALKEY, OWNKEY, LANDGMD, PARCEL_NO.",
};

const glynn: CountyConfig = {
  id: "glynn",
  name: "Glynn",
  fullName: "Glynn County",
  state: "GA",
  fips: "13127",
  status: "discovered",

  serviceType: "FeatureServer",
  baseUrl: "https://services.arcgis.com/5iWzb1srkjPDXmpL/arcgis/rest/services/Tax_Parcels_Zone_1/FeatureServer",
  parcelLayerId: 0,
  zoningLayerId: null,
  taxLayerId: null,

  fields: {
    apn: "PARCEL_ID",
    owner: null,
    address: null,
    acres: null,
    landUseCode: null,
    landUseDesc: null,
    zoning: null,
    zoningDesc: null,
    assessedTotal: null,
    landValue: null,
    improvementValue: null,
    mailingAddress: null,
    legalDesc: null,
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: null,
  zoningLayerDescField: null,
  parcelOutFields: "PARCEL_ID,PIN",
  searchOutFields: "PARCEL_ID,PIN",

  supportsGeoJSON: true,
  multiFieldAddress: false,

  defaultCenter: [-81.4915, 31.2136],
  defaultZoom: 12,

  population: 79626,
  region: "Coastal Regional Commission",
  notes: "Split across 4 zone services (Zone 1-4). Would need to query all 4 and merge results.",
};

const floyd: CountyConfig = {
  id: "floyd",
  name: "Floyd",
  fullName: "Floyd County",
  state: "GA",
  fips: "13115",
  status: "discovered",

  serviceType: "FeatureServer",
  baseUrl: "https://services2.arcgis.com/nV67H1IJR8GS6SAA/ArcGIS/rest/services/Current_Parcels/FeatureServer",
  parcelLayerId: 3,
  zoningLayerId: null,
  taxLayerId: null,

  fields: {
    apn: "PARCELID",
    owner: null,
    address: null,
    acres: null,
    landUseCode: null,
    landUseDesc: null,
    zoning: null,
    zoningDesc: null,
    assessedTotal: null,
    landValue: null,
    improvementValue: null,
    mailingAddress: null,
    legalDesc: null,
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: null,
  zoningLayerDescField: null,
  parcelOutFields: "*",
  searchOutFields: "*",

  supportsGeoJSON: true,
  multiFieldAddress: false,

  defaultCenter: [-85.1637, 34.2571],
  defaultZoom: 13,

  population: 96317,
  region: "Northwest Georgia",
  notes: "Rome-Floyd County. Field names TBD.",
};

const carroll: CountyConfig = {
  id: "carroll",
  name: "Carroll",
  fullName: "Carroll County",
  state: "GA",
  fips: "13045",
  status: "discovered",

  serviceType: "FeatureServer",
  baseUrl: "https://services.arcgis.com/ISpzx3B5ZsVA6e1Z/ArcGIS/rest/services/Carroll_Parcels/FeatureServer",
  parcelLayerId: 0,
  zoningLayerId: null,
  taxLayerId: null,

  fields: {
    apn: "PARCELID",
    owner: null,
    address: null,
    acres: null,
    landUseCode: null,
    landUseDesc: null,
    zoning: null,
    zoningDesc: null,
    assessedTotal: null,
    landValue: null,
    improvementValue: null,
    mailingAddress: null,
    legalDesc: null,
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: null,
  zoningLayerDescField: null,
  parcelOutFields: "*",
  searchOutFields: "*",

  supportsGeoJSON: true,
  multiFieldAddress: false,

  defaultCenter: [-85.0766, 33.5801],
  defaultZoom: 12,

  population: 110527,
  region: "Three Rivers",
  notes: "AGOL hosted. Field names TBD.",
};

const whitfield: CountyConfig = {
  id: "whitfield",
  name: "Whitfield",
  fullName: "Whitfield County",
  state: "GA",
  fips: "13313",
  status: "discovered",

  serviceType: "MapServer",
  baseUrl: "https://gis.whitfieldcountyga.com/server/rest/services/Parcels_and_Development/MapServer",
  parcelLayerId: 5,
  zoningLayerId: null,
  taxLayerId: null,

  fields: {
    apn: "PARCELID",
    owner: null,
    address: null,
    acres: null,
    landUseCode: null,
    landUseDesc: null,
    zoning: null,
    zoningDesc: null,
    assessedTotal: null,
    landValue: null,
    improvementValue: null,
    mailingAddress: null,
    legalDesc: null,
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: null,
  zoningLayerDescField: null,
  parcelOutFields: "*",
  searchOutFields: "*",

  supportsGeoJSON: false,
  multiFieldAddress: false,

  defaultCenter: [-84.9658, 34.7668],
  defaultZoom: 12,

  population: 102599,
  region: "Northwest Georgia",
  notes: "Self-hosted MapServer. Field names TBD.",
};

const walton: CountyConfig = {
  id: "walton",
  name: "Walton",
  fullName: "Walton County",
  state: "GA",
  fips: "13297",
  status: "discovered",

  serviceType: "FeatureServer",
  baseUrl: "https://services9.arcgis.com/RtJQnMkoH9LGs7n0/arcgis/rest/services/walton_parcels_view/FeatureServer",
  parcelLayerId: 0,
  zoningLayerId: null,
  taxLayerId: null,

  fields: {
    apn: "PARCELID",
    owner: null,
    address: null,
    acres: null,
    landUseCode: null,
    landUseDesc: null,
    zoning: null,
    zoningDesc: null,
    assessedTotal: null,
    landValue: null,
    improvementValue: null,
    mailingAddress: null,
    legalDesc: null,
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: null,
  zoningLayerDescField: null,
  parcelOutFields: "*",
  searchOutFields: "*",

  supportsGeoJSON: true,
  multiFieldAddress: false,

  defaultCenter: [-83.7185, 33.7680],
  defaultZoom: 12,

  population: 83768,
  region: "Northeast Georgia",
  notes: "AGOL hosted. Also has older 2019 dataset available.",
};

const barrow: CountyConfig = {
  id: "barrow",
  name: "Barrow",
  fullName: "Barrow County",
  state: "GA",
  fips: "13013",
  status: "discovered",

  serviceType: "FeatureServer",
  baseUrl: "https://services5.arcgis.com/OVFGXfRTCVcPwl55/ArcGIS/rest/services/Barrow_Parcels/FeatureServer",
  parcelLayerId: 5,
  zoningLayerId: null,
  taxLayerId: null,

  fields: {
    apn: "PARCELID",
    owner: null,
    address: null,
    acres: null,
    landUseCode: null,
    landUseDesc: null,
    zoning: null,
    zoningDesc: null,
    assessedTotal: null,
    landValue: null,
    improvementValue: null,
    mailingAddress: null,
    legalDesc: null,
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: null,
  zoningLayerDescField: null,
  parcelOutFields: "*",
  searchOutFields: "*",

  supportsGeoJSON: true,
  multiFieldAddress: false,

  defaultCenter: [-83.6893, 33.9493],
  defaultZoom: 12,

  population: 69367,
  region: "Northeast Georgia",
  notes: "AGOL hosted. Field names TBD.",
};

const lowndes: CountyConfig = {
  id: "lowndes",
  name: "Lowndes",
  fullName: "Lowndes County",
  state: "GA",
  fips: "13185",
  status: "discovered",

  serviceType: "MapServer",
  baseUrl: "https://www.valorgis.com/arcgis/rest/services/Valor/Parcels/MapServer",
  parcelLayerId: 0,
  zoningLayerId: null,
  taxLayerId: null,

  fields: {
    apn: "PARCELID",
    owner: null,
    address: null,
    acres: null,
    landUseCode: null,
    landUseDesc: null,
    zoning: null,
    zoningDesc: null,
    assessedTotal: null,
    landValue: null,
    improvementValue: null,
    mailingAddress: null,
    legalDesc: null,
    deedRefs: null,
    previousOwners: null,
  },
  zoningLayerField: null,
  zoningLayerDescField: null,
  parcelOutFields: "*",
  searchOutFields: "*",

  supportsGeoJSON: false,
  multiFieldAddress: false,

  defaultCenter: [-83.2785, 30.8327],
  defaultZoom: 12,

  population: 109233,
  region: "Southern Georgia",
  notes: "Hosted by ValorGIS. Field names TBD.",
};


// ─── Registry ───────────────────────────────────────────────────────────────

/** All configured counties, keyed by lowercase county name (id). */
export const COUNTY_REGISTRY: Record<string, CountyConfig> = {
  gwinnett,
  fulton,
  dekalb,
  cherokee,
  clayton,
  forsyth,
  douglas,
  fayette,
  rockdale,
  coweta,
  newton,
  bartow,
  bibb,
  chatham,
  hall,
  muscogee,
  columbia,
  dougherty,
  jackson,
  glynn,
  floyd,
  carroll,
  whitfield,
  walton,
  barrow,
  lowndes,
};

/** Default county used when none is specified */
export const DEFAULT_COUNTY_ID = "gwinnett";

// ─── Lookup Helpers ─────────────────────────────────────────────────────────

/** Get county config by ID. Throws if not found. */
export function getCounty(countyId: string): CountyConfig {
  const config = COUNTY_REGISTRY[countyId.toLowerCase()];
  if (!config) {
    throw new Error(`County not found in registry: "${countyId}". Available: ${Object.keys(COUNTY_REGISTRY).join(", ")}`);
  }
  return config;
}

/** Get county config by ID, returning null if not found. */
export function getCountyOrNull(countyId: string): CountyConfig | null {
  return COUNTY_REGISTRY[countyId.toLowerCase()] ?? null;
}

/** Get the ArcGIS query URL for a specific layer of a county. */
export function getLayerQueryUrl(county: CountyConfig, layerId: number): string {
  return `${county.baseUrl}/${layerId}/query`;
}

/** Get all counties with a given status. */
export function getCountiesByStatus(status: CountyStatus): CountyConfig[] {
  return Object.values(COUNTY_REGISTRY).filter((c) => c.status === status);
}

/** Get all counties that are usable (verified or discovered with sufficient fields). */
export function getUsableCounties(): CountyConfig[] {
  return Object.values(COUNTY_REGISTRY).filter(
    (c) => c.status === "verified" || (c.status === "discovered" && c.fields.apn)
  );
}

/** Get all counties sorted by population descending. */
export function getAllCountiesSorted(): CountyConfig[] {
  return Object.values(COUNTY_REGISTRY).sort((a, b) => b.population - a.population);
}

/**
 * Try to detect which county a coordinate falls in.
 * Uses a simple bounding-box heuristic based on default centers.
 * For production use, this should be replaced with a proper spatial query.
 */
export function guessCountyFromCoords(lng: number, lat: number): CountyConfig | null {
  let closest: CountyConfig | null = null;
  let minDist = Infinity;

  for (const county of Object.values(COUNTY_REGISTRY)) {
    const [cLng, cLat] = county.defaultCenter;
    const dist = Math.sqrt((lng - cLng) ** 2 + (lat - cLat) ** 2);
    if (dist < minDist) {
      minDist = dist;
      closest = county;
    }
  }

  // Only return if reasonably close (roughly within 30km / 0.3 degrees)
  return minDist < 0.3 ? closest : null;
}

/**
 * Assemble a site address from county-specific fields.
 * Handles both single-field and multi-field (pipe-delimited) address configs.
 */
export function assembleAddress(
  county: CountyConfig,
  attrs: Record<string, unknown>
): string | null {
  const fieldSpec = county.fields.address;
  if (!fieldSpec) return null;

  if (county.multiFieldAddress) {
    // Multi-field: "FIELD1|FIELD2|FIELD3"
    const parts = fieldSpec.split("|").map((f) => {
      const val = attrs[f];
      return val != null && val !== "" ? String(val) : null;
    });
    const joined = parts.filter(Boolean).join(", ");
    return joined || null;
  }

  // Single field
  const val = attrs[fieldSpec];
  return val != null && val !== "" ? String(val) : null;
}

/**
 * Assemble a mailing address from county-specific fields.
 */
export function assembleMailingAddress(
  county: CountyConfig,
  attrs: Record<string, unknown>
): string | null {
  const fieldSpec = county.fields.mailingAddress;
  if (!fieldSpec) return null;

  const parts = fieldSpec.split("|").map((f) => {
    const val = attrs[f];
    return val != null && val !== "" ? String(val) : null;
  });
  return parts.filter(Boolean).join(", ") || null;
}

/**
 * Extract deed reference fields from attributes.
 */
export function extractDeedRefs(
  county: CountyConfig,
  attrs: Record<string, unknown>
): string[] {
  if (!county.fields.deedRefs) return [];
  return county.fields.deedRefs
    .split(",")
    .map((f) => attrs[f.trim()])
    .filter((v): v is string => v != null && v !== "" && typeof v === "string");
}

/**
 * Extract previous owner fields from attributes.
 */
export function extractPreviousOwners(
  county: CountyConfig,
  attrs: Record<string, unknown>
): string[] {
  if (!county.fields.previousOwners) return [];
  return county.fields.previousOwners
    .split(",")
    .map((f) => attrs[f.trim()])
    .filter((v): v is string => v != null && v !== "" && typeof v === "string");
}

/**
 * Map raw ArcGIS attributes to our normalized Parcel interface.
 * This is the county-aware replacement for the old `mapTaxToParcel()`.
 */
export function mapAttrsToParcel(
  county: CountyConfig,
  attrs: Record<string, unknown>,
  apn: string
): {
  apn: string;
  county: string;
  owner_name: string | null;
  owner_mailing_address: string | null;
  site_address: string | null;
  acres: number | null;
  land_use_code: string | null;
  zoning: string | null;
  zoning_desc: string | null;
  assessed_total: number | null;
  land_value: number | null;
  improvement_value: number | null;
  last_sale_date: string | null;
  last_sale_price: number | null;
  legal_desc: string | null;
  deed_refs: string[];
  previous_owners: string[];
} {
  const str = (field: string | null): string | null => {
    if (!field) return null;
    const v = attrs[field];
    return v != null && v !== "" ? String(v) : null;
  };
  const num = (field: string | null): number | null => {
    if (!field) return null;
    const v = attrs[field];
    return v != null ? Number(v) || null : null;
  };

  return {
    apn,
    county: county.name,
    owner_name: str(county.fields.owner),
    owner_mailing_address: assembleMailingAddress(county, attrs),
    site_address: assembleAddress(county, attrs),
    acres: num(county.fields.acres),
    land_use_code: str(county.fields.landUseCode) ?? str(county.fields.landUseDesc),
    zoning: str(county.fields.zoning),
    zoning_desc: str(county.fields.zoningDesc),
    assessed_total: num(county.fields.assessedTotal),
    land_value: num(county.fields.landValue),
    improvement_value: num(county.fields.improvementValue),
    last_sale_date: null,  // Rarely available in county open data
    last_sale_price: null, // Rarely available in county open data
    legal_desc: str(county.fields.legalDesc),
    deed_refs: extractDeedRefs(county, attrs),
    previous_owners: extractPreviousOwners(county, attrs),
  };
}
