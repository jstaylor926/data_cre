import { NextResponse } from "next/server";
import { getParcelsByOwner } from "@/lib/mock-data";
import type { EntityResult } from "@/lib/types";
import { isDevMode } from "@/lib/config";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  CAPABILITY_FORBIDDEN_ERROR,
  hasCapability,
  resolveCapabilityContext,
} from "@/lib/capabilities";

// Mock entity lookup data — simulates GA SOS scraping results
const MOCK_ENTITIES: Record<string, Omit<EntityResult, "related_parcels">> = {
  "Meridian Holdings LLC": {
    llc_name: "Meridian Holdings LLC",
    state: "GA",
    principal_name: "Marcus W. Chen",
    agent_name: "David R. Thornton",
    status: "Active/Compliance",
    formed_date: "2018-03-12",
  },
  "DeThomas Development Group LLC": {
    llc_name: "DeThomas Development Group LLC",
    state: "GA",
    principal_name: "Michael A. DeThomas",
    agent_name: "DeThomas Legal Services Inc",
    status: "Active/Compliance",
    formed_date: "2008-03-14",
  },
  "Peachtree Corners Holdings LLC": {
    llc_name: "Peachtree Corners Holdings LLC",
    state: "GA",
    principal_name: "David R. Kim",
    agent_name: "Kim & Associates PC",
    status: "Active/Compliance",
    formed_date: "2015-07-22",
  },
  "SR Holdings Group LLC": {
    llc_name: "SR Holdings Group LLC",
    state: "GA",
    principal_name: "Steven R. Reynolds",
    agent_name: "Reynolds Law Group",
    status: "Active/Compliance",
    formed_date: "2019-01-08",
  },
  "Norcross Gateway Partners LLC": {
    llc_name: "Norcross Gateway Partners LLC",
    state: "GA",
    principal_name: "James A. Morrison",
    agent_name: "Morrison & Davis LLC",
    status: "Active/Compliance",
    formed_date: "2021-11-30",
  },
  "JCB Retail Ventures LLC": {
    llc_name: "JCB Retail Ventures LLC",
    state: "GA",
    principal_name: "Jennifer C. Banks",
    agent_name: "Banks Commercial Law",
    status: "Active/Compliance",
    formed_date: "2020-05-12",
  },
  "Forum at Peachtree Corners LLC": {
    llc_name: "Forum at Peachtree Corners LLC",
    state: "GA",
    principal_name: "Fuqua Development Inc",
    agent_name: "CT Corporation System",
    status: "Active/Compliance",
    formed_date: "2017-02-28",
  },
  "Pinnacle Logistics Center LLC": {
    llc_name: "Pinnacle Logistics Center LLC",
    state: "GA",
    principal_name: "Robert L. Turner",
    agent_name: "Turner Industrial Group",
    status: "Active/Compliance",
    formed_date: "2022-06-15",
  },
  "Metropolitan Real Estate Group LLC": {
    llc_name: "Metropolitan Real Estate Group LLC",
    state: "GA",
    principal_name: "Andrew W. Chen",
    agent_name: "Chen & Partners",
    status: "Active/Compliance",
    formed_date: "2012-09-03",
  },
  "Westside Industrial Partners LLC": {
    llc_name: "Westside Industrial Partners LLC",
    state: "GA",
    principal_name: "Marcus T. Williams",
    agent_name: "Williams Capital LLC",
    status: "Active/Compliance",
    formed_date: "2018-04-20",
  },
  "Buckhead Tower Associates LLC": {
    llc_name: "Buckhead Tower Associates LLC",
    state: "GA",
    principal_name: "Richard S. Harper",
    agent_name: "King & Spalding LLP",
    status: "Active/Compliance",
    formed_date: "2010-11-15",
  },
  "Berkshire Industrial Realty Inc": {
    llc_name: "Berkshire Industrial Realty Inc",
    state: "GA",
    principal_name: "Thomas P. Berkshire",
    agent_name: "Berkshire Legal Services",
    status: "Active/Compliance",
    formed_date: "2005-08-01",
  },
};

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const context = await resolveCapabilityContext(supabase);
  if (!hasCapability(context.capabilities, "feature.entity_lookup")) {
    return NextResponse.json(
      { error: CAPABILITY_FORBIDDEN_ERROR, capability: "feature.entity_lookup" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { llc_name } = body as { llc_name: string };

  if (!llc_name) {
    return NextResponse.json(
      { error: "llc_name is required" },
      { status: 400 }
    );
  }

  // Prod mode: real GA SOS scraping not yet implemented
  if (!isDevMode) {
    // TODO: Replace with real GA SOS scraping + Supabase cache
    // 1. Check entity_lookups cache table
    // 2. If not cached, scrape ecorp.sos.ga.gov
    // 3. Cache result
    // 4. Cross-reference owner name against parcels table
    return NextResponse.json(
      { error: "Entity lookup not yet available in production" },
      { status: 501 }
    );
  }

  // Dev mode: use mock entity data
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const entity = MOCK_ENTITIES[llc_name];

  if (!entity) {
    return NextResponse.json(
      { error: "Entity not found", llc_name },
      { status: 404 }
    );
  }

  // Cross-reference: find other parcels by the principal's name or the LLC name
  const relatedParcels = getParcelsByOwner(llc_name);

  const result: EntityResult = {
    ...entity,
    related_parcels: relatedParcels,
  };

  return NextResponse.json(result);
}
