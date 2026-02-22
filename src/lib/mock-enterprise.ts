import { Organization, User, Deal, DealActivity } from "./types";

export const MOCK_ORG: Organization = {
  id: "org_dethomas_001",
  name: "DeThomas Development",
  slug: "dethomas",
  branding: {
    primary_color: "#00d4c8", // Teal
    secondary_color: "#f5a623", // Amber
    font_head: "Bebas Neue",
  },
  created_at: new Date().toISOString(),
};

export const MOCK_USER: User = {
  id: "user_josh_001",
  email: "josh@dethomas.com",
  full_name: "Joshua Taylor",
  avatar_url: "https://github.com/shadcn.png",
  org_id: "org_dethomas_001",
  role: "owner",
};

export const MOCK_DEALS: Deal[] = [
  {
    id: "deal_001",
    org_id: "org_dethomas_001",
    apn: "R7001 002",
    property_address: "123 Technology Pkwy, Norcross, GA 30092",
    deal_name: "Norcross Data Center Site A",
    stage: "evaluating",
    priority: "high",
    target_product_type: "Data Center",
    target_sf: 150000,
    projected_roi: 18.5,
    assigned_to: "user_josh_001",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "deal_002",
    org_id: "org_dethomas_001",
    apn: "R6052 144",
    property_address: "4550 Jimmy Carter Blvd, Norcross, GA 30093",
    deal_name: "Carter Blvd Mixed Use",
    stage: "loi",
    priority: "medium",
    target_product_type: "Mixed Use",
    target_sf: 45000,
    projected_roi: 12.2,
    assigned_to: "user_josh_001",
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "deal_003",
    org_id: "org_dethomas_001",
    apn: "R5122 005",
    property_address: "Sugarloaf Pkwy, Lawrenceville, GA 30043",
    deal_name: "Lawrenceville Logistics Hub",
    stage: "due_diligence",
    priority: "high",
    target_product_type: "Industrial",
    target_sf: 300000,
    projected_roi: 15.8,
    assigned_to: "user_josh_001",
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

export const MOCK_ACTIVITIES: DealActivity[] = [
  {
    id: "act_001",
    deal_id: "deal_001",
    user_id: "user_josh_001",
    activity_type: "note",
    content: "Zoning review looks favorable. C-2 allows for planned commercial.",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "act_002",
    deal_id: "deal_001",
    user_id: "user_josh_001",
    activity_type: "stage_change",
    content: "Moved from Identified to Evaluating",
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];
