I have good context on the project. Let me build out a comprehensive phased breakdown.

---

# Atlas CRE — Phased Feature Roadmap

## Phase 1: LandGlide Replication (The Foundation)
**Goal:** Build a fully functional parcel intelligence layer on Mapbox that matches and exceeds what LandGlide offers. This is your demo-ready MVP for DeThomas.

---

### Feature 1.1 — Interactive Parcel Map

**What it is:** Tap anywhere on the map → see parcel boundaries highlight + pull up an info panel with owner, acreage, APN, address, and assessed value. Exactly what LandGlide does.

**Implementation:**

The backbone is Mapbox GL JS with vector tile overlays sourced from **Regrid's Parcel API**. You'll buy a county-level extract (start with Gwinnett + Fulton) in GeoJSON format, host the tiles yourself using **Tippecanoe** to convert them into `.mbtiles`, and serve from a static host or Mapbox's own tileset upload. This avoids live API costs during development.

```
Stack:
- Frontend: Next.js App Router + Mapbox GL JS
- Parcel Data: Regrid county extract → Tippecanoe → Mapbox Tileset
- Hosting: Vercel (frontend) + Supabase (Postgres for saved data)
```

The map click handler fires a `queryRenderedFeatures` call against the parcel layer, extracts the APN, then hits your own `/api/parcel/[apn]` endpoint which returns the enriched record from your local Postgres table seeded from the Regrid extract.

---

### Feature 1.2 — Parcel Detail Panel

**What it is:** A slide-up drawer (mobile) or side panel (desktop) showing the full parcel record — owner name, mailing address, lot size, land use code, zoning, tax assessed value, last sale date + price.

**Implementation:**

All fields come from the Regrid extract. You build a clean schema in Supabase:

```sql
CREATE TABLE parcels (
  apn TEXT PRIMARY KEY,
  county TEXT,
  owner_name TEXT,
  owner_mailing_address TEXT,
  site_address TEXT,
  acres NUMERIC,
  land_use_code TEXT,
  zoning TEXT,
  assessed_total NUMERIC,
  last_sale_date DATE,
  last_sale_price NUMERIC,
  geom GEOMETRY(MultiPolygon, 4326)
);
```

The panel component is a Shadcn/ui Drawer on mobile and a fixed side panel on desktop. Keep it fast — no secondary API calls on open, everything is already in the local DB.

---

### Feature 1.3 — GPS / Current Location + Search

**What it is:** "Go to my location" button that flies the map to the user's GPS coords and highlights the parcel under them. Plus an address search bar (like LandGlide's search) that geocodes and flies to any address.

**Implementation:**

GPS uses the browser's `navigator.geolocation` API — no external calls. On success, fly to coordinates using `map.flyTo()`, then trigger a map click event at that point to surface the parcel.

Address search uses the **Mapbox Geocoding API** (Search Box API v2 — much better than v1). It's free for up to 100K requests/month on the free tier, which is more than enough for a pilot. Build a debounced search input with a dropdown of results.

---

### Feature 1.4 — Owner Lookup & LLC Piercing

**What it is:** When the owner is an LLC, surface a "Lookup Entity" button that attempts to resolve the beneficial owner or related entities — this is something LandGlide doesn't do and is a huge value add for DeThomas.

**Implementation:**

This is a two-step enrichment:

**Step 1 — Georgia SOS Lookup:** Georgia's Secretary of State has a public business search at `ecorp.sos.ga.gov`. You build a lightweight scraper (Playwright headless) that takes an LLC name, searches the SOS site, and returns the registered agent and principal officer names. Run this async on demand, cache results in Supabase.

**Step 2 — Cross-Reference:** Compare the returned principal name against other parcels in your DB to surface other properties the same entity or individual owns. A simple `WHERE owner_name ILIKE '%JohnSmith%'` query surfaces portfolio clustering.

This becomes a unique differentiator immediately.

---

### Feature 1.5 — Saved Properties & Project Collections

**What it is:** Users can bookmark parcels, add notes, and organize them into named project folders (e.g., "DeThomas Norcross Pipeline Q2"). Equivalent to LandGlide's saved properties, but with team collaboration.

**Implementation:**

Supabase Auth for user management. Two tables:

```sql
CREATE TABLE saved_parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  apn TEXT,
  notes TEXT,
  collection_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  name TEXT,
  org_id UUID  -- for team sharing later
);
```

Real-time sync via Supabase's Realtime feature so that team members see updates instantly on shared collections.

---

### Feature 1.6 — Map Layer Toggles

**What it is:** Toggles for satellite imagery, street map, parcel boundaries on/off, zoning overlay, and aerial photography year selector. LandGlide does most of this — you match and beat it.

**Implementation:**

Mapbox style switching for base layers (Streets ↔ Satellite ↔ Hybrid). Parcel boundary toggle using `map.setLayoutProperty('parcels-fill', 'visibility', 'visible'|'none')`.

Zoning overlay is the hardest piece. For the prototype, pull zoning GeoJSON from county open data portals (Gwinnett and Fulton both publish this), load as a separate layer with color coding by zone type. This is a one-time data pull and host it yourself.

---

### Phase 1 Deliverable Summary

| Feature | Effort | External Cost |
|---|---|---|
| Interactive Parcel Map | High | Regrid county extract ~$150 |
| Parcel Detail Panel | Medium | $0 |
| GPS + Address Search | Low | Mapbox free tier |
| LLC Owner Lookup | Medium | $0 (SOS scraper) |
| Saved Properties | Medium | Supabase free tier |
| Layer Toggles | Low | $0 |

**Total Phase 1 timeline:** 6–8 weeks solo, 3–4 weeks with focused sprint blocks. This is what you demo to DeThomas.

---

## Phase 2: AI Site Analysis Layer
Parcel → "Should we build here?" — AI scoring, comp pulling, zoning interpretation, DeThomas deal history RAG.

## Phase 3: Data Center Site Selector
Power infrastructure scoring, fiber availability, utility data, structured scoring model.

## Phase 4: Firm Intelligence Platform
Proprietary deal history ingestion, custom ML scoring trained on DeThomas outcomes, white-label deployment.

---

Want me to go deep on Phase 2 next, or do you want to start building Phase 1 now? I can scaffold the Next.js + Mapbox project structure with the Supabase schema if you're ready to write code.
\
# Phase 2: AI Site Analysis Layer
**Goal:** Transform raw parcel data into actionable development intelligence. A user taps a parcel and instead of just *what's there*, they get *should we build here, what should we build, and what will it cost.*

---

## Feature 2.1 — AI Site Score Card

**What it is:** Every parcel gets an automatically generated "Development Score" — a composite 0–100 score with sub-scores across key dimensions: zoning compatibility, access/visibility, demographics, comparable deal activity, and infrastructure readiness. Think credit score for land.

**Implementation:**

This is a weighted scoring pipeline that runs server-side when a parcel is first viewed (and cached). You build a `site_scores` table and a FastAPI scoring endpoint.

The score is composed of 5 sub-dimensions, each 0–20:

```python
# scoring/engine.py

class SiteScorer:
    def score_parcel(self, apn: str) -> SiteScore:
        parcel = self.db.get_parcel(apn)
        
        scores = {
            "zoning":          self.score_zoning(parcel),
            "access":          self.score_access(parcel),
            "demographics":    self.score_demographics(parcel),
            "market_activity": self.score_market_activity(parcel),
            "infrastructure":  self.score_infrastructure(parcel),
        }
        
        composite = sum(scores.values())  # 0-100
        return SiteScore(apn=apn, composite=composite, breakdown=scores)
```

Each sub-scorer pulls from a different data source:

**Zoning** — Compare the parcel's land use code against a lookup table of DeThomas-preferred use types (C-2, PD, MU-1, etc.). Exact match = 20, adjacent compatible = 12, conditional = 6, incompatible = 0.

**Access/Visibility** — Use Mapbox's Isochrone API to measure drive-time access. Pull road classification from OpenStreetMap Overpass API to detect frontage on arterials vs. local roads. Highway interchange proximity from your own computed distance field.

**Demographics** — Integrate **Census Bureau API** (free, no key needed beyond registration) to pull ACS 5-year estimates for the census tract: median household income, population density, daytime population, retail spending index. Normalize these against DeThomas's target market profile.

**Market Activity** — Query your own parcel DB for sales within a 1-mile radius in the last 24 months. High transaction velocity = healthy market. Also factor in days-on-market for comparable listings if you integrate an MLS feed later.

**Infrastructure** — Proximity to utilities (you'll build this dataset in Phase 3), fiber availability, flood zone from FEMA NFHL API (free), and wetlands from the National Wetlands Inventory (free GeoJSON).

All five scorers are modular and independently tunable. This matters because DeThomas may want to re-weight them — retail developers care more about demographics and access than, say, an industrial developer would.

---

## Feature 2.2 — Zoning Intelligence Engine

**What it is:** Instead of just showing the raw zoning code (which means nothing to most people), the AI interprets what can be built, what's prohibited, what requires a variance, and flags any recent rezoning activity on or near the parcel.

**Implementation:**

Two components: a structured lookup layer and an LLM interpretation layer.

**Structured Layer:** Build a `zoning_rules` table seeded from county zoning ordinances (Gwinnett, Fulton, Cherokee, etc.). These are public documents — PDFs from county websites. For Phase 2, you manually extract the key rules for the top 10–15 zone types you'll encounter most often with DeThomas.

```sql
CREATE TABLE zoning_rules (
  id UUID PRIMARY KEY,
  county TEXT,
  zone_code TEXT,          -- e.g. 'C-2'
  zone_name TEXT,          -- e.g. 'General Commercial'
  permitted_uses TEXT[],
  conditional_uses TEXT[],
  prohibited_uses TEXT[],
  max_lot_coverage NUMERIC,
  max_height_ft NUMERIC,
  min_lot_size_sqft NUMERIC,
  setback_front_ft NUMERIC,
  setback_side_ft NUMERIC,
  setback_rear_ft NUMERIC,
  notes TEXT
);
```

**LLM Layer:** When the user asks "Can I build a strip mall here?" or "What would it take to get a drive-through approved?", the question + zoning rules + parcel context go into a structured prompt to GPT-4o or Claude via API. The model returns a plain-language answer grounded in the actual ordinance rules you've loaded.

```python
# ai/zoning_interpreter.py

def interpret_zoning_query(parcel: Parcel, query: str) -> str:
    rules = db.get_zoning_rules(parcel.county, parcel.zoning)
    
    prompt = f"""
    You are a zoning expert assistant for a commercial real estate developer.
    
    Parcel: {parcel.site_address}
    Zone: {parcel.zoning} ({rules.zone_name}) in {parcel.county} County, GA
    Lot Size: {parcel.acres} acres
    
    Zoning Rules:
    - Permitted Uses: {', '.join(rules.permitted_uses)}
    - Conditional Uses: {', '.join(rules.conditional_uses)}
    - Max Height: {rules.max_height_ft} ft
    - Max Lot Coverage: {rules.max_lot_coverage}%
    - Setbacks: Front {rules.setback_front_ft}ft, Side {rules.setback_side_ft}ft, Rear {rules.setback_rear_ft}ft
    
    Developer Question: {query}
    
    Answer directly and specifically. Flag any variance or conditional use permit 
    requirements. Be concise — the developer is in the field.
    """
    
    return llm.complete(prompt)
```

This is the first feature that clearly cannot be replicated by LandGlide. It's the most compelling demo moment for DeThomas.

---

## Feature 2.3 — Comparable Sales Analysis (Auto-Comps)

**What it is:** When viewing a parcel, the system automatically surfaces the 5 most relevant comparable land sales within a configurable radius and time window, with a summary of what they imply about the subject parcel's value.

**Implementation:**

The comps engine runs a spatial + attribute query against your parcel DB:

```python
# analysis/comps.py

def find_comps(parcel: Parcel, radius_miles: float = 1.0, months: int = 24) -> list[Comp]:
    return db.query("""
        SELECT 
            apn,
            site_address,
            acres,
            last_sale_price,
            last_sale_date,
            zoning,
            land_use_code,
            ST_Distance(geom::geography, ST_MakePoint(:lon, :lat)::geography) / 1609.34 AS distance_miles,
            last_sale_price / (acres * 43560) AS price_per_sqft
        FROM parcels
        WHERE 
            ST_DWithin(geom::geography, ST_MakePoint(:lon, :lat)::geography, :radius_meters)
            AND last_sale_date >= NOW() - INTERVAL ':months months'
            AND last_sale_price > 0
            AND acres BETWEEN :min_acres AND :max_acres
            AND county = :county
        ORDER BY distance_miles ASC
        LIMIT 10
    """, params={
        "lon": parcel.lon, "lat": parcel.lat,
        "radius_meters": radius_miles * 1609.34,
        "months": months,
        "min_acres": parcel.acres * 0.5,
        "max_acres": parcel.acres * 2.0,
        "county": parcel.county
    })
```

The comps surface in a table in the panel with distance, sale date, $/SF, and zoning. An LLM summary runs over the top 5 and generates a two-sentence value range implication: *"Based on 4 comparable land sales within 0.8 miles, similar C-2 parcels in this corridor traded between $8.20–$12.40/SF over the last 18 months. At {parcel.acres} acres, this implies a range of $X–$Y."*

For Phase 2, your comps data is the Regrid extract. In Phase 3+, you layer in a direct MLS/CoStar feed.

---

## Feature 2.4 — Deal History RAG (DeThomas Proprietary Intelligence)

**What it is:** DeThomas has ~20 years of deal history — proformas, LOIs, due diligence reports, site selection memos. This feature ingests all of that, chunks and embeds it, and makes it queryable. When a user views a parcel, the system asks: *"Have we looked at anything like this before? What did we learn?"*

This is the actual moat. No competitor can replicate it without the client's data.

**Implementation:**

The ingestion pipeline is a Python FastAPI background job:

```
Document Sources → Extraction → Chunking → Embedding → pgvector
```

**Extraction:** PDFs and Word docs from a Google Drive folder (or S3 bucket) using **LlamaParse** for high-fidelity extraction from deal docs with mixed tables/text. For scanned PDFs, add a **Tesseract OCR** fallback.

**Chunking:** Semantic chunking by document section — don't just split at N characters. A proforma has distinct sections (assumptions, revenue, costs, returns) that should stay coherent. Use LlamaIndex's `SemanticSplitterNodeParser`.

**Embedding:** `text-embedding-3-large` from OpenAI (3072 dims, best retrieval quality) or `text-embedding-004` from Google if you're staying in the Vertex ecosystem. Store in Supabase with `pgvector`.

```sql
CREATE TABLE deal_documents (
  id UUID PRIMARY KEY,
  org_id UUID,
  filename TEXT,
  document_type TEXT,  -- 'proforma', 'loi', 'site_memo', 'due_diligence'
  deal_name TEXT,
  property_address TEXT,
  year INT,
  chunk_index INT,
  chunk_text TEXT,
  embedding VECTOR(3072)
);

CREATE INDEX ON deal_documents USING ivfflat (embedding vector_cosine_ops);
```

**Retrieval:** When a parcel is viewed, build a query from its attributes and fire a similarity search:

```python
def retrieve_relevant_deals(parcel: Parcel, query: str = None) -> list[DealChunk]:
    # Build a descriptive query from parcel attributes
    auto_query = f"""
    {parcel.acres:.1f} acre {parcel.zoning} zoned commercial site 
    in {parcel.county} County Georgia near {parcel.site_address}
    """
    
    final_query = query if query else auto_query
    embedding = embed(final_query)
    
    return db.query("""
        SELECT *, 1 - (embedding <=> :embedding) AS similarity
        FROM deal_documents
        WHERE org_id = :org_id
        ORDER BY embedding <=> :embedding
        LIMIT 5
    """, params={"embedding": embedding, "org_id": org_id})
```

The retrieved chunks + parcel context go into a RAG prompt and the model surfaces: *"In 2019, DeThomas evaluated a 2.3-acre C-2 site on Buford Highway in similar conditions. The deal passed due to traffic count issues — the ADT was under 28K. This site shows 41K ADT, which addresses that concern. The 2019 proforma used a $1.8M land cost assumption for comparable acreage."*

That's the demo moment that closes the DeThomas deal.

---

## Feature 2.5 — AI Development Feasibility Brief

**What it is:** A one-click "Generate Site Brief" button that produces a 1–2 page structured analysis document for any parcel. Combines everything from 2.1–2.4 into a human-readable brief that a developer can send directly to their investment committee.

**Implementation:**

This is a structured generation pipeline, not a freeform chat. You define the output schema as a Pydantic model and force the LLM to fill it:

```python
class SiteBrief(BaseModel):
    executive_summary: str          # 3-4 sentences
    site_overview: SiteOverview     # address, acres, zoning, county
    development_score: SiteScore    # from Feature 2.1
    zoning_summary: str             # plain language from Feature 2.2
    value_indication: str           # derived from comps (Feature 2.3)
    historical_context: str         # from RAG (Feature 2.4)
    key_risks: list[str]            # 3-5 flagged risks
    recommended_next_steps: list[str]
    generated_at: datetime
    generated_by: str               # user name
```

The brief renders in the UI as a clean formatted panel and can be exported as a PDF (using **Puppeteer** server-side or **react-pdf** client-side). This is a deliverable the user can hand to their principal.

The PDF export is worth calling out — it's the moment the AI output leaves your platform and circulates in the real world. Watermark it with the firm name and generation date.

---

## Phase 2 Architecture Overview

```
Next.js Frontend
    ↓ (parcel selected)
FastAPI Backend
    ├── Scoring Engine        → Supabase (scores cache)
    ├── Zoning Interpreter    → Supabase (zoning_rules) → LLM
    ├── Comps Engine          → Supabase (parcels, spatial query)
    ├── RAG Retriever         → Supabase pgvector → LLM
    └── Brief Generator       → aggregates all above → structured LLM → PDF
```

---

## Phase 2 Deliverable Summary

| Feature | Effort | External Cost |
|---|---|---|
| AI Site Score Card | High | Census API (free) |
| Zoning Intelligence | High | LLM API ~$0.05/query |
| Auto-Comps | Medium | $0 (local data) |
| Deal History RAG | High | LlamaParse ~$3/1K pages, OpenAI embeddings ~$0.10/1K docs |
| Feasibility Brief + PDF | Medium | LLM API ~$0.15/brief |

**Total Phase 2 timeline:** 8–10 weeks. By the end, you have a product that no off-the-shelf tool can match for DeThomas's specific workflow.

---

Ready to go into Phase 3 (Data Center Site Selector) or do you want to start scaffolding the code for any of these features?




# Phase 3: Data Center Site Selector
**Goal:** Transform Atlas CRE into a specialized tool for evaluating parcels as potential data center sites — scoring power infrastructure, fiber, utilities, environmental risk, and regulatory fit. This is the feature that opens the door beyond DeThomas to a much larger market.

---

## Why This Is a Separate Phase

Data center site selection is a fundamentally different evaluation framework than retail/mixed-use development. The variables that matter — MW capacity, carrier-neutral fiber, PUE implications, water availability for cooling, seismic risk, flood zone — have nothing to do with foot traffic or zoning compatibility for commercial retail. You're essentially building a second scoring engine on top of the same parcel layer, which is why Phase 1 and 2 had to come first.

The market opportunity here is also distinct. DeThomas mentioned data centers as a long-term interest. But hyperscalers (AWS, Microsoft, Google), colocation REITs (Equinix, Digital Realty), and boutique data center developers are actively spending billions on site acquisition right now, particularly in the Southeast. A tool purpose-built for their workflow is a completely separate product line.

---

## Feature 3.1 — Power Infrastructure Scoring

**What it is:** The single most important variable in data center site selection. A parcel needs to be near adequate electrical infrastructure — substations with available capacity, transmission lines, and ideally redundant feeds. This feature overlays power infrastructure data on the map and scores every parcel against it.

**Implementation:**

Power infrastructure data comes from three public sources you combine into a unified layer:

**EIA (Energy Information Administration)** publishes the Homeland Infrastructure Foundation-Level Data (HIFLD) datasets, which include transmission lines, substations, and power plants as GeoJSON — completely free. Download once, host in your Postgres instance as geometry tables.

```sql
CREATE TABLE power_substations (
  id UUID PRIMARY KEY,
  name TEXT,
  owner TEXT,
  state TEXT,
  county TEXT,
  voltage_kv NUMERIC[],        -- e.g. ARRAY[115, 230]
  max_capacity_mw NUMERIC,
  status TEXT,
  geom GEOMETRY(Point, 4326)
);

CREATE TABLE transmission_lines (
  id UUID PRIMARY KEY,
  owner TEXT,
  voltage_kv NUMERIC,
  status TEXT,
  geom GEOMETRY(LineString, 4326)
);
```

The scoring function for any parcel computes:

```python
class PowerScorer:
    def score(self, parcel: Parcel) -> PowerScore:
        
        # Find nearest substations within 10 miles
        substations = self.db.query("""
            SELECT *, 
                ST_Distance(geom::geography, ST_MakePoint(:lon,:lat)::geography) / 1609.34 AS dist_miles
            FROM power_substations
            WHERE ST_DWithin(geom::geography, ST_MakePoint(:lon,:lat)::geography, 16093)
            ORDER BY dist_miles ASC
            LIMIT 5
        """, lon=parcel.lon, lat=parcel.lat)
        
        # Find transmission lines within 2 miles
        transmission = self.db.query("""
            SELECT voltage_kv, owner,
                ST_Distance(geom::geography, ST_MakePoint(:lon,:lat)::geography) / 1609.34 AS dist_miles
            FROM transmission_lines  
            WHERE ST_DWithin(geom::geography, ST_MakePoint(:lon,:lat)::geography, 3218)
            ORDER BY dist_miles ASC
        """, lon=parcel.lon, lat=parcel.lat)
        
        score = 0
        
        # Nearest substation distance scoring (0-8 pts)
        nearest = substations[0].dist_miles if substations else 99
        score += max(0, 8 - (nearest * 2))  # 8pts at 0mi, 0pts at 4+mi
        
        # Substation voltage capacity (0-6 pts)
        if substations:
            max_voltage = max(s.voltage_kv for s in substations[:2] for v in s.voltage_kv)
            if max_voltage >= 230:   score += 6
            elif max_voltage >= 115: score += 4
            elif max_voltage >= 69:  score += 2
        
        # Redundant feed potential — 2+ substations within 5 miles (0-4 pts)
        nearby_count = sum(1 for s in substations if s.dist_miles <= 5)
        score += min(4, nearby_count * 2)
        
        # Transmission line proximity (0-2 pts)
        if transmission and transmission[0].dist_miles < 1:
            score += 2
        elif transmission and transmission[0].dist_miles < 2:
            score += 1
        
        return PowerScore(raw=score, normalized=score/20*100, substations=substations[:3])
```

The map layer renders substations as icon markers (colored by voltage tier) and transmission lines as colored polylines. Users can toggle voltage thresholds to filter for only 115kV+ lines, for example.

**Critical addition — Utility Territory Overlay:** Georgia Power, Sawnee EMC, Cobb EMC, and other utilities serve different geographic territories. Data center developers need to know which utility they'll be dealing with before anything else — rates, interconnection timelines, and available capacity vary dramatically. You source territory boundary GeoJSON from each utility's public rate filings (FERC HIFLD also has this) and render it as a map layer. When a parcel is tapped, the panel immediately names the serving utility and links to their large-load interconnection program page.

---

## Feature 3.2 — Fiber & Connectivity Scoring

**What it is:** Data centers live and die on connectivity. This feature maps fiber routes, carrier presence, and estimated latency to major internet exchange points (IXPs) — and scores parcels against data center connectivity standards.

**Implementation:**

Fiber data is the hardest infrastructure dataset to acquire because carriers treat route data as proprietary. You layer three sources:

**FCC Broadband Data Collection** — The FCC publishes fabric-level broadband availability data including fiber provider presence by census block. Free download, updated twice yearly. This tells you which carriers have fiber in a given area, not exact routes, but it's enough to score carrier diversity.

**NTIA BroadbandUSA** — Publishes state-level broadband maps including some middle-mile fiber routes. Free.

**OpenStreetMap** — The OSM `telecom` layer has community-contributed fiber route data. Incomplete but useful for metro areas. Pull via Overpass API.

```python
class FiberScorer:
    def score(self, parcel: Parcel) -> FiberScore:
        score = 0
        
        # FCC carrier count in census block (0-8 pts)
        carriers = self.fcc.get_fiber_providers(parcel.census_block_geoid)
        carrier_count = len(carriers)
        score += min(8, carrier_count * 2)  # 2pts per carrier, max 8
        
        # Carrier diversity bonus — Tier 1 presence (0-4 pts)
        tier1_carriers = {'ATT', 'Lumen', 'Zayo', 'Cogent', 'Crown Castle'}
        tier1_present = [c for c in carriers if c.name in tier1_carriers]
        score += min(4, len(tier1_present) * 2)
        
        # Latency to nearest IXP (0-8 pts)
        # IXP coordinates hardcoded for Southeast: TIE Atlanta, OIX, etc.
        nearest_ixp_dist = self.compute_nearest_ixp_distance(parcel)
        if nearest_ixp_dist < 5:    score += 8
        elif nearest_ixp_dist < 15: score += 6
        elif nearest_ixp_dist < 30: score += 4
        elif nearest_ixp_dist < 60: score += 2
        
        return FiberScore(raw=score, normalized=score/20*100, carriers=carriers)
```

Atlanta is a major fiber hub — the Southeast's version of Ashburn. The **Technology Innovation Exchange (TIE Atlanta)** at 55 Marietta Street is the primary IXP. Distance to TIE Atlanta is a direct latency proxy and becomes a key scoring input. Parcels within 30 miles of downtown Atlanta have a structural advantage here.

The map layer renders fiber carrier presence as a heatmap by census block — darker = more carrier diversity.

---

## Feature 3.3 — Water & Cooling Infrastructure Analysis

**What it is:** Data centers require enormous amounts of water for cooling — hyperscale facilities can use millions of gallons per day. This feature assesses water availability, proximity to municipal water systems, discharge/wastewater capacity, and flags sites where cooling constraints would be a deal-killer.

**Implementation:**

**Water System Proximity:** EPA's Safe Drinking Water Information System (SDWIS) and the EPA Water Infrastructure Geospatial data publish water system service areas and treatment plant locations. Free. Load into Postgres.

```sql
CREATE TABLE water_systems (
  pwsid TEXT PRIMARY KEY,       -- EPA Public Water System ID
  name TEXT,
  system_type TEXT,
  population_served INT,
  design_capacity_mgd NUMERIC,  -- million gallons per day
  source_type TEXT,             -- 'surface water', 'groundwater', 'purchased'
  county TEXT,
  geom GEOMETRY(MultiPolygon, 4326)
);

CREATE TABLE water_treatment_plants (
  id UUID PRIMARY KEY,
  pws_id TEXT REFERENCES water_systems(pwsid),
  name TEXT,
  capacity_mgd NUMERIC,
  geom GEOMETRY(Point, 4326)
);
```

**Scoring logic:**

```python
class WaterScorer:
    # Minimum requirements for different data center scales
    THRESHOLDS = {
        "edge":       {"min_mgd": 0.05,  "pts": 4},   # <1 MW
        "enterprise": {"min_mgd": 0.5,   "pts": 8},   # 1-10 MW  
        "hyperscale": {"min_mgd": 5.0,   "pts": 20},  # 100+ MW
    }
    
    def score(self, parcel: Parcel, target_scale: str = "enterprise") -> WaterScore:
        score = 0
        
        # Find serving water system
        water_system = self.db.get_water_system_for_parcel(parcel.geom)
        
        if not water_system:
            return WaterScore(raw=0, flag="NO_MUNICIPAL_WATER", critical=True)
        
        # Capacity adequacy (0-10 pts)
        threshold = self.THRESHOLDS[target_scale]["min_mgd"]
        # Assume new load shouldn't exceed 10% of system capacity
        available_headroom = water_system.design_capacity_mgd * 0.10
        if available_headroom >= threshold * 2: score += 10
        elif available_headroom >= threshold:   score += 6
        else:                                   score += 2
        
        # Source type reliability (0-6 pts)
        if water_system.source_type == "surface water":  score += 6
        elif water_system.source_type == "groundwater":  score += 4
        elif water_system.source_type == "purchased":    score += 2
        
        # Proximity to treatment plant (0-4 pts) — pressure matters
        plant_dist = self.nearest_plant_distance(parcel)
        score += max(0, 4 - int(plant_dist / 2))
        
        return WaterScore(raw=score, normalized=score/20*100, system=water_system)
```

**Cooling Technology Flag:** Based on the water score, the AI brief auto-suggests cooling approach. Low water availability → flag air-side economizers or dry coolers as required. High water availability → evaporative cooling viable, better PUE possible. This is a meaningful recommendation that saves the developer weeks of preliminary engineering.

---

## Feature 3.4 — Environmental & Risk Layer

**What it is:** A composite environmental risk assessment that flags deal-killers before a developer spends money on due diligence. Flood zone, wetlands, brownfield contamination, seismic risk, wildfire risk, and flight path restrictions — all surfaced automatically.

**Implementation:**

Every data source here is a free federal dataset. You ingest them once and query spatially.

```python
ENVIRONMENTAL_DATA_SOURCES = {
    "flood_zones": {
        "source": "FEMA National Flood Hazard Layer (NFHL)",
        "url": "https://msc.fema.gov/portal/downloadProduct?productTypeID=NFHL",
        "key_field": "FLD_ZONE",
        "critical_values": ["AE", "AO", "VE", "A"]  # 100-yr floodplain
    },
    "wetlands": {
        "source": "USFWS National Wetlands Inventory",
        "url": "https://www.fws.gov/program/national-wetlands-inventory",
        "key_field": "WETLAND_TYPE",
    },
    "brownfields": {
        "source": "EPA ACRES / FRS (Facility Registry Service)",
        "url": "https://www.epa.gov/cleanups/cleanups-my-community",
        "key_field": "SITE_STATUS"
    },
    "seismic": {
        "source": "USGS National Seismic Hazard Model",
        "url": "https://earthquake.usgs.gov/hazards/hazmaps/",
        "key_field": "PGA_PCT2IN50"  # Peak ground acceleration
    },
    "flight_paths": {
        "source": "FAA Digital Obstacle File + Class B/C airspace",
        "url": "https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/",
        "note": "Crane height limits during construction, not operational concern"
    }
}
```

The risk assessment returns a structured flag list, not a score — because some of these are binary disqualifiers:

```python
class EnvironmentalAssessor:
    def assess(self, parcel: Parcel) -> EnvironmentalAssessment:
        flags = []
        
        # Flood zone check
        flood_zone = self.fema.get_flood_zone(parcel.geom)
        if flood_zone in ["AE", "AO", "VE"]:
            flags.append(RiskFlag(
                category="FLOOD",
                severity="CRITICAL",
                detail=f"Parcel is in FEMA {flood_zone} flood zone (100-yr floodplain). "
                       f"Flood insurance required. Foundation engineering implications.",
                disqualifying=True
            ))
        
        # Wetlands check — buffer matters, not just parcel boundary
        wetland_coverage = self.nwi.get_wetland_coverage(parcel.geom, buffer_ft=300)
        if wetland_coverage.parcel_pct > 0.15:
            flags.append(RiskFlag(
                category="WETLANDS",
                severity="HIGH",
                detail=f"{wetland_coverage.parcel_pct:.0%} of parcel in or near wetlands. "
                       f"Section 404 Army Corps permit likely required. 6-12 month delay risk.",
                disqualifying=False
            ))
        
        # EPA brownfield / contamination history
        epa_sites = self.epa.get_nearby_sites(parcel.geom, radius_ft=1000)
        for site in epa_sites:
            severity = "CRITICAL" if site.status == "ACTIVE" else "MEDIUM"
            flags.append(RiskFlag(
                category="CONTAMINATION",
                severity=severity,
                detail=f"EPA {site.program} site '{site.name}' {site.distance_ft:.0f}ft away. "
                       f"Status: {site.status}. Phase I ESA strongly recommended.",
                disqualifying=(site.status == "ACTIVE")
            ))
        
        return EnvironmentalAssessment(flags=flags, clean=(len(flags) == 0))
```

The UI renders these as a flagged list with red/yellow/green severity coloring. A "Clean Site" badge is a meaningful positive signal that accelerates developer confidence.

---

## Feature 3.5 — Data Center Composite Score & Tier Classification

**What it is:** Aggregates all sub-scores (power, fiber, water, environmental) into a single Data Center Readiness Score with an automatic Tier classification recommendation — Tier I through Tier IV per the Uptime Institute standard. This is the top-line number a data center developer wants before anything else.

**Implementation:**

```python
class DataCenterScorer:
    
    # Uptime Institute Tier thresholds mapped to our composite scoring
    TIER_THRESHOLDS = {
        "Tier IV": {"min_composite": 85, "power_min": 18, "fiber_min": 16, "water_min": 15},
        "Tier III": {"min_composite": 70, "power_min": 14, "fiber_min": 12, "water_min": 10},
        "Tier II": {"min_composite": 50, "power_min": 10, "fiber_min": 8,  "water_min": 6},
        "Tier I":  {"min_composite": 30, "power_min": 0,  "fiber_min": 0,  "water_min": 0},
    }
    
    def score(self, parcel: Parcel, target_mw: float = 10.0) -> DataCenterScore:
        power = PowerScorer().score(parcel)
        fiber = FiberScorer().score(parcel)
        water = WaterScorer().score(parcel, target_scale=self.mw_to_scale(target_mw))
        env   = EnvironmentalAssessor().assess(parcel)
        
        # Environmental critical flags override everything
        critical_flags = [f for f in env.flags if f.disqualifying]
        if critical_flags:
            return DataCenterScore(
                composite=0,
                tier=None,
                disqualified=True,
                disqualify_reason=critical_flags[0].detail
            )
        
        # Weighted composite (power matters most for data centers)
        composite = (
            power.normalized * 0.40 +   # Power is king
            fiber.normalized * 0.30 +   # Connectivity second
            water.normalized * 0.20 +   # Water third
            env_bonus * 0.10            # Clean env = bonus pts
        )
        
        # Determine tier
        tier = self.classify_tier(composite, power.raw, fiber.raw, water.raw)
        
        return DataCenterScore(
            composite=composite,
            tier=tier,
            target_mw=target_mw,
            power=power,
            fiber=fiber,
            water=water,
            environmental=env
        )
    
    def classify_tier(self, composite, power, fiber, water) -> str | None:
        for tier, thresholds in self.TIER_THRESHOLDS.items():
            if (composite >= thresholds["min_composite"] and
                power >= thresholds["power_min"] and
                fiber >= thresholds["fiber_min"] and
                water >= thresholds["water_min"]):
                return tier
        return None  # Below Tier I viability
```

The UI displays this as a prominent badge on the parcel panel — **"Tier III Ready | 78/100"** — with a radial breakdown chart showing how each sub-score contributed. Developers immediately understand this language.

**MW Slider:** Add a target MW input that recalculates water and power scores relative to the stated requirement. A 1 MW edge compute node has very different site requirements than a 100 MW hyperscale campus. The slider makes the tool flexible across buyer types.

---

## Feature 3.6 — Site Comparison Mode

**What it is:** Select 2–4 parcels simultaneously and view them in a side-by-side comparison table across all data center scoring dimensions. This is how real site selection decisions get made — you're never evaluating one site in isolation.

**Implementation:**

State management in Next.js using Zustand — a `comparisonList` array that users add parcels to via a "Compare" button in the parcel panel. When 2+ parcels are in the list, a "Compare Selected" button activates and opens a full-screen comparison modal.

```typescript
// store/comparison.ts
interface ComparisonStore {
  parcels: Parcel[];
  scores: Record<string, DataCenterScore>;
  addParcel: (parcel: Parcel) => void;
  removeParcel: (apn: string) => void;
  clear: () => void;
}

const useComparisonStore = create<ComparisonStore>((set) => ({
  parcels: [],
  scores: {},
  addParcel: (parcel) => set((state) => ({
    parcels: [...state.parcels.slice(-3), parcel]  // max 4
  })),
  // ...
}));
```

The comparison table renders each parcel as a column with color-coded cells — green for top score in each row, red for lowest. A "Generate Comparison Brief" button at the bottom fires the LLM to produce a structured recommendation: *"Of the four sites evaluated, Site B (Braselton, Jackson County) is the strongest candidate for your 20 MW requirement, primarily due to its proximity to a 230kV substation and Tier 1 fiber diversity. Site A is viable at lower MW targets but carries flood zone risk that would require elevated foundation costs."*

---

## Phase 3 Architecture Additions

```
Phase 2 Stack
    +
Infrastructure Data Layer (Postgres/PostGIS)
    ├── power_substations        ← HIFLD / EIA
    ├── transmission_lines       ← HIFLD / EIA
    ├── utility_territories      ← FERC / HIFLD
    ├── fiber_providers_by_block ← FCC BDC
    ├── water_systems            ← EPA SDWIS
    ├── water_treatment_plants   ← EPA
    ├── fema_flood_zones         ← FEMA NFHL
    ├── nwi_wetlands             ← USFWS NWI
    └── epa_brownfields          ← EPA FRS/ACRES

New FastAPI Services
    ├── /api/datacenter/score/{apn}      → full composite score
    ├── /api/datacenter/compare          → multi-parcel comparison
    └── /api/datacenter/brief/{apn}      → AI brief for DC use case
```

All infrastructure datasets are one-time ingests with quarterly refresh cycles. Total storage footprint for Georgia coverage is roughly 8–12 GB in PostGIS, well within Supabase's free/pro tier limits.

---

## Phase 3 Deliverable Summary

| Feature | Effort | External Cost |
|---|---|---|
| Power Infrastructure Scoring | High | $0 (HIFLD data) |
| Fiber & Connectivity Scoring | High | $0 (FCC data) |
| Water & Cooling Analysis | Medium | $0 (EPA data) |
| Environmental Risk Layer | Medium | $0 (FEMA/EPA/USFWS) |
| DC Composite Score + Tier | Medium | $0 |
| Site Comparison Mode | Medium | LLM API ~$0.20/comparison |

**Total Phase 3 timeline:** 8–10 weeks. By the end of Phase 3, you have a product that can compete directly with specialized tools like SiteCompli or custom broker GIS platforms — at a fraction of what those firms charge, and with an AI layer none of them have.

**Market expansion unlocked:** At Phase 3 completion, Atlas CRE is no longer just a DeThomas tool. It's a sellable product to data center developers, site consultants, economic development agencies, and utility companies doing load forecasting. That's a completely different and substantially larger revenue conversation.

---

Ready to go into Phase 4 (Firm Intelligence Platform + white-label) or do you want to start building any specific component from Phases 1–3?


# Phase 4: Firm Intelligence Platform
**Goal:** Transform Atlas CRE from a smart site tool into a proprietary, white-labeled intelligence platform that becomes deeply embedded in a firm's institutional knowledge and decision-making workflow. The product stops being software they use and starts being infrastructure they depend on.

---

## The Strategic Shift at Phase 4

Phases 1–3 built features. Phase 4 builds **lock-in**. By this point, DeThomas has been using the platform for 6–12 months. Their deal history is ingested, their team's saved searches and scoring preferences are baked in, and their institutional knowledge lives inside your system. The switching cost is now enormous — which is exactly where you want to be before you have the pricing and expansion conversation.

Phase 4 is also when the product becomes genuinely multi-tenant — multiple firms, each with their own data silo, their own branded experience, their own AI trained on their specific history. This is the architecture that supports a real SaaS business.

---

## Feature 4.1 — Proprietary ML Scoring Model (Firm-Trained)

**What it is:** Instead of using the generic scoring weights from Phase 2, the platform trains a firm-specific model on the client's actual deal outcomes. The model learns what *this firm* has historically found valuable, what they've passed on and why, and starts predicting which new sites are most likely to become executed deals.

**Implementation:**

This requires two things to be true first: the firm has been using the platform long enough to have meaningful interaction data, and their historical deal docs have been ingested via the Phase 2 RAG pipeline. Phase 4 builds on top of both.

The training data construction is the most important engineering decision here. You're building a supervised learning dataset where each row is a site evaluation and the label is the outcome:

```python
# ml/dataset_builder.py

class DealOutcomeDataset:
    """
    Constructs training data from firm's historical deal history.
    Each sample = (site features) → (outcome label)
    """
    
    OUTCOME_LABELS = {
        "executed":     1.0,   # Deal closed, built/acquired
        "loi_signed":   0.8,   # Got to LOI but didn't close
        "passed":       0.0,   # Evaluated and consciously passed
        "lost":        -0.1,   # Wanted it, lost to competitor
    }
    
    def build(self, org_id: str) -> pd.DataFrame:
        # Pull all deal records with known outcomes
        deals = self.db.query("""
            SELECT 
                d.apn,
                d.outcome,
                d.outcome_reason,
                d.target_product_type,
                d.projected_roi,
                d.actual_roi,
                -- Site features at time of evaluation
                p.acres,
                p.zoning,
                p.county,
                p.assessed_value_per_acre,
                p.last_sale_price,
                -- Computed scores from scoring engine
                s.power_score,
                s.fiber_score, 
                s.water_score,
                s.demo_score,
                s.access_score,
                s.market_activity_score,
                -- Derived features
                p.acres * 43560 AS sqft,
                p.last_sale_price / NULLIF(p.acres * 43560, 0) AS price_per_sqft,
                ST_Distance(p.geom::geography, ixp.geom::geography) / 1609 AS miles_to_ixp,
                -- Demographic snapshot
                d.median_hhi_1mi,
                d.daytime_pop_1mi,
                d.traffic_adt
            FROM deals d
            JOIN parcels p ON d.apn = p.apn
            JOIN site_scores s ON d.apn = s.apn
            CROSS JOIN (SELECT geom FROM ixp_locations WHERE name = 'TIE Atlanta') ixp
            WHERE d.org_id = :org_id
              AND d.outcome IS NOT NULL
        """, org_id=org_id)
        
        df = pd.DataFrame(deals)
        df["label"] = df["outcome"].map(self.OUTCOME_LABELS)
        return df
```

The model itself is a **gradient boosted tree** (XGBoost or LightGBM) rather than a neural network. The reasons are practical: you'll have hundreds of training samples, not millions — tree models generalize better in this regime. They're also interpretable, which matters enormously when you're telling a developer "our model predicts this site scores 82 — here's why."

```python
# ml/firm_model.py

import xgboost as xgb
from sklearn.model_selection import cross_val_score
import shap

class FirmSiteModel:
    
    FEATURE_COLUMNS = [
        "acres", "price_per_sqft", "power_score", "fiber_score",
        "water_score", "demo_score", "access_score", "market_activity_score",
        "median_hhi_1mi", "daytime_pop_1mi", "traffic_adt", "miles_to_ixp",
        # One-hot encoded categoricals
        "zoning_C2", "zoning_MU1", "zoning_PD", "zoning_I1",
        "county_gwinnett", "county_fulton", "county_cherokee",
    ]
    
    def train(self, dataset: pd.DataFrame) -> TrainingResult:
        X = dataset[self.FEATURE_COLUMNS].fillna(dataset.median())
        y = dataset["label"]
        
        model = xgb.XGBRegressor(
            n_estimators=200,
            max_depth=4,          # Shallow trees prevent overfitting on small datasets
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42
        )
        
        # Cross-validate to check generalization
        cv_scores = cross_val_score(model, X, y, cv=5, scoring="r2")
        
        model.fit(X, y)
        
        # SHAP for interpretability
        explainer = shap.TreeExplainer(model)
        
        return TrainingResult(
            model=model,
            explainer=explainer,
            cv_r2_mean=cv_scores.mean(),
            cv_r2_std=cv_scores.std(),
            feature_importance=dict(zip(self.FEATURE_COLUMNS, model.feature_importances_))
        )
    
    def predict_with_explanation(self, parcel_features: dict) -> Prediction:
        X = self.prepare_features(parcel_features)
        score = float(self.model.predict(X)[0])
        
        # SHAP explanation — what drove this score
        shap_values = self.explainer.shap_values(X)
        
        top_drivers = sorted(
            zip(self.FEATURE_COLUMNS, shap_values[0]),
            key=lambda x: abs(x[1]),
            reverse=True
        )[:5]
        
        return Prediction(
            firm_score=score,
            top_positive_drivers=[d for d in top_drivers if d[1] > 0],
            top_negative_drivers=[d for d in top_drivers if d[1] < 0],
        )
```

The SHAP explanation is what makes this usable in the real world. Instead of just outputting a number, the platform tells the developer: *"This site scores 79 on the DeThomas model. Primary drivers: strong traffic count (ADT 44K, +12 pts), C-2 zoning match (+9 pts), comparable Gwinnett sites performed well (+7 pts). Primary drags: price per SF is 18% above your historical acquisition range (-8 pts), demographics slightly below your median HHI threshold (-4 pts)."*

That's a tool a principal will trust and act on.

**Retraining Cadence:** Every time a new deal outcome is recorded in the system — whether a close, pass, or LOI — the model automatically queues for retraining overnight. The model improves continuously as the firm uses the platform. This is the compounding flywheel that creates real lock-in.

---

## Feature 4.2 — Pipeline & Deal Lifecycle Management

**What it is:** A full CRM-lite deal pipeline embedded directly in the platform, so the site intelligence layer and the deal tracking layer live in the same product. Sites move through stages (Identified → Under Evaluation → LOI → Due Diligence → Closed / Passed) and the platform tracks what happened at each stage and why.

**Implementation:**

This is the data collection mechanism that feeds Feature 4.1. Without structured outcome data, the ML model can't train. The pipeline UI is the interface through which that data flows in.

```sql
-- Deal pipeline schema

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  apn TEXT,
  property_address TEXT,
  deal_name TEXT,
  stage TEXT CHECK (stage IN (
    'identified', 'evaluating', 'loi', 'due_diligence', 
    'under_contract', 'closed', 'passed', 'lost'
  )),
  target_product_type TEXT,   -- 'strip_center', 'mixed_use', 'data_center', 'industrial'
  target_sf INT,
  projected_roi NUMERIC,
  actual_roi NUMERIC,         -- filled on close
  assigned_to UUID REFERENCES users(id),
  outcome TEXT,               -- 'executed', 'passed', 'lost'
  outcome_reason TEXT,        -- free text, but also structured tags
  outcome_tags TEXT[],        -- ['price_too_high', 'zoning_issue', 'lost_to_competition']
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  target_close_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id),
  user_id UUID REFERENCES users(id),
  activity_type TEXT,   -- 'note', 'stage_change', 'document_added', 'task_completed'
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE deal_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id),
  assigned_to UUID REFERENCES users(id),
  title TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

The UI is a Kanban board rendered alongside the map — users can drag deals between stages, and each card links directly back to the parcel on the map. Clicking a card opens the full deal panel: site scores, AI brief, uploaded documents, activity log, and tasks.

The key design decision here is that **outcome tagging is structured, not just free text.** When a deal is marked "Passed," the user picks from a predefined taxonomy of pass reasons: `price_too_high`, `zoning_incompatible`, `environmental_issue`, `traffic_insufficient`, `competitor_acquisition`, `ownership_unwilling`, `financing_unavailable`. These tags become features in the ML training data and let the model learn *why* the firm passes on sites, not just which sites they pass on.

---

## Feature 4.3 — White-Label Multi-Tenant Architecture

**What it is:** The ability to onboard multiple firms as separate tenants, each with their own branded interface, their own data silo, their own ML model, and their own admin controls — without any code changes between clients.

**Implementation:**

This is primarily a backend architecture problem. You move from a single-tenant mental model to a proper multi-tenant one, with row-level security enforced at the database layer.

```sql
-- Every user-owned table gets org_id + RLS

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  slug TEXT UNIQUE,           -- 'dethomas', 'acme-development'
  plan TEXT,                  -- 'starter', 'professional', 'enterprise'
  branding JSONB,             -- logo_url, primary_color, secondary_color, font
  settings JSONB,             -- feature flags, scoring weight overrides
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all data tables
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_scores ENABLE ROW LEVEL SECURITY;

-- Policy: users only see their org's data
CREATE POLICY org_isolation ON deals
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Same pattern for every sensitive table
```

**Branding System:** Each org's `branding` JSONB column drives a CSS custom properties injection at the Next.js layout level. The platform renders in the firm's colors, with their logo in the header, their name in the page title. For enterprise clients this is table stakes — they don't want their team using a tool that says "Atlas CRE" in the corner.

```typescript
// app/layout.tsx
export default async function Layout({ children }) {
  const org = await getOrgFromSession();
  
  return (
    <html>
      <head>
        <style>{`
          :root {
            --brand-primary: ${org.branding.primary_color};
            --brand-secondary: ${org.branding.secondary_color};
            --brand-logo: url('${org.branding.logo_url}');
          }
        `}</style>
        <title>{org.name} | Site Intelligence</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**Feature Flags:** The `settings` JSONB on the organization record controls which Phase 1–4 features are enabled per tenant. A starter-tier client might only have Phase 1 features enabled. Enterprise gets everything including the ML model. This lets you price in tiers without maintaining separate codebases.

```typescript
const ORG_FEATURE_FLAGS = {
  starter:      ["parcel_map", "parcel_detail", "search", "saved_properties"],
  professional: ["...starter", "ai_scorecard", "zoning_ai", "auto_comps", "deal_pipeline"],
  enterprise:   ["...professional", "deal_rag", "firm_ml_model", "white_label", "api_access"]
};
```

---

## Feature 4.4 — Team Collaboration & Permissions

**What it is:** Role-based access control within an organization, shared deal visibility, @mention notifications, and collaborative annotations on parcels and deals. This is what makes the platform viable for a firm with 5–20 users rather than just a solo analyst.

**Implementation:**

```sql
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'member', 'viewer');

CREATE TABLE org_memberships (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  role org_role DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- Permission matrix
-- owner:  full admin + billing
-- admin:  user management, all data access
-- member: full feature access, own + shared deals
-- viewer: read-only, no deal management
```

**Notifications:** Real-time deal stage change notifications via Supabase Realtime subscriptions, plus daily digest emails using **Resend** (simple transactional email API, generous free tier). When a teammate moves a deal to LOI or adds a note, relevant team members get a notification in the app sidebar and optionally an email digest.

**Parcel Annotations:** Any team member can drop a pin-style annotation on any parcel with a note — *"Spoke to owner 2/14, not interested in selling for 18 months"* or *"Adjacent parcel to our Norcross project — watch this one."* These annotations are org-scoped and persist on the map for all members. They're also indexed and searchable, and they feed the RAG context so the AI brief can surface them: *"Note from your team (Feb 2026): Owner indicated 18-month hold period."*

---

## Feature 4.5 — Executive Intelligence Dashboard

**What it is:** A senior-leadership-facing analytics view that aggregates pipeline activity, market trends, team performance, and AI model insights into a single dashboard. This is what the principal or partner sees when they log in on Monday morning.

**Implementation:**

The dashboard is a separate Next.js route (`/dashboard`) with server-rendered charts using **Recharts** or **Tremor** (Tremor has excellent pre-built analytics components that look polished with minimal effort).

Key panels:

**Pipeline Summary:** Deals by stage, total pipeline value, deals added/closed this month, average days per stage. Materialized view in Postgres, refreshed nightly.

**Market Heat Map:** A choropleth overlay on the Mapbox map at the county/zip level showing deal activity density — where your team is looking, where you're finding viable sites, where you're passing. Surfaces geographic patterns that aren't obvious from the deal list.

**AI Model Performance Panel:** Shows the firm ML model's current accuracy (R² from last training run), which features are driving scores most heavily, and a "Model Drift Alert" if the model's predictions have been diverging from outcomes (a signal you need more training data or market conditions have shifted).

```typescript
// components/dashboard/ModelPerformanceCard.tsx

interface ModelStats {
  last_trained: Date;
  cv_r2: number;          // Cross-validation R²
  training_samples: number;
  top_features: { name: string; importance: number }[];
  drift_detected: boolean;
}

export function ModelPerformanceCard({ stats }: { stats: ModelStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Firm Intelligence Model</CardTitle>
        <Badge variant={stats.cv_r2 > 0.7 ? "success" : "warning"}>
          R² {stats.cv_r2.toFixed(2)}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted">
          Trained on {stats.training_samples} historical deals · 
          Last updated {formatRelative(stats.last_trained)}
        </p>
        {stats.drift_detected && (
          <Alert variant="warning">
            Model drift detected. Consider adding recent deal outcomes 
            to improve prediction accuracy.
          </Alert>
        )}
        <FeatureImportanceChart features={stats.top_features} />
      </CardContent>
    </Card>
  );
}
```

**Competitive Intelligence Feed:** An LLM-powered digest that runs weekly, pulling public records (deed transfers, permit applications, rezoning requests) from county portals in your target markets and surfacing: *"3 large commercial land transfers recorded in Cherokee County this week. One matches your typical acquisition profile — 4.2 acres, C-2 zoning on Hwy 92. Review attached."* This is a proactive push that keeps the platform top-of-mind even when users aren't actively searching.

---

## Feature 4.6 — External API & Webhook Layer

**What it is:** A documented REST API that lets enterprise clients pipe Atlas CRE data into their own internal systems — financial models in Excel, ERP systems, BI tools like Tableau or Power BI, or their own custom applications. Webhooks push real-time events (deal stage changes, new high-scoring sites in a watch area) to external systems automatically.

**Implementation:**

This is the feature that justifies enterprise-tier pricing because it makes the platform infrastructure, not just a tool.

```python
# api/external/v1/router.py

@router.get("/parcels/{apn}")
async def get_parcel(apn: str, api_key: APIKey = Depends(verify_api_key)):
    """Returns full parcel record + all computed scores for the authenticated org."""
    parcel = db.get_parcel(apn)
    scores = db.get_scores(apn, org_id=api_key.org_id)
    return ParcelResponse(parcel=parcel, scores=scores)

@router.post("/parcels/score-batch")
async def score_batch(apns: list[str], api_key: APIKey = Depends(verify_api_key)):
    """Score up to 100 parcels in a single request. Returns async job_id."""
    job = scoring_queue.enqueue(batch_score, apns, org_id=api_key.org_id)
    return {"job_id": job.id, "status": "queued", "parcel_count": len(apns)}

@router.get("/deals")
async def list_deals(
    stage: str = None, 
    assigned_to: UUID = None,
    api_key: APIKey = Depends(verify_api_key)
):
    """Returns deal pipeline for the org with optional filters."""
    return db.get_deals(org_id=api_key.org_id, stage=stage, assigned_to=assigned_to)
```

**Webhook System:**

```python
# webhooks/dispatcher.py

WEBHOOK_EVENTS = [
    "deal.stage_changed",
    "deal.created",
    "parcel.score_completed",
    "site_alert.new_match",       # watch area triggered
    "model.retrained",
    "competitive.new_transfer",   # public records alert
]

class WebhookDispatcher:
    def dispatch(self, event: str, payload: dict, org_id: UUID):
        endpoints = db.get_webhook_endpoints(org_id, event)
        for endpoint in endpoints:
            # Fire and forget with retry queue via Redis/ARQ
            webhook_queue.enqueue(
                deliver_webhook,
                url=endpoint.url,
                secret=endpoint.signing_secret,
                event=event,
                payload=payload,
                retry=3
            )
```

Webhook payloads are HMAC-signed so the receiving system can verify authenticity. This is standard practice (same as Stripe's webhook model) and enterprise clients will expect it.

---

## Feature 4.7 — Site Watch Alerts

**What it is:** Users configure watch areas — geographic polygons, county boundaries, or radius around a point — with filter criteria (min acres, zoning types, price range). When new parcel transfers, permit applications, or rezoning requests match the criteria in a watch area, the platform sends an alert immediately. You find opportunities before competitors do.

**Implementation:**

The watch system is a scheduled job that runs nightly against fresh public records data:

```python
# jobs/watch_alerts.py

@scheduler.scheduled_job("cron", hour=6, minute=0)  # 6 AM daily
async def run_watch_alerts():
    alerts = db.get_all_active_watches()
    
    for watch in alerts:
        # Check new parcel transfers since last run
        new_transfers = db.query("""
            SELECT p.*, 
                   1 - (p.embedding <=> :watch_embedding) AS relevance
            FROM parcels p
            WHERE 
                ST_Within(p.geom, :watch_area)
                AND p.last_sale_date >= :last_run_date
                AND p.last_sale_price BETWEEN :min_price AND :max_price
                AND p.acres BETWEEN :min_acres AND :max_acres
                AND p.zoning = ANY(:zoning_types)
            ORDER BY relevance DESC
        """, **watch.criteria)
        
        for transfer in new_transfers:
            score = await DataCenterScorer().score(transfer)
            if score.composite >= watch.min_score_threshold:
                await notify_watch_trigger(watch, transfer, score)
```

The alert delivers via email, in-app notification, and optionally webhook. It includes a pre-rendered site scorecard so the user can evaluate the alert in 30 seconds without opening the app. High-scoring alerts get a priority flag.

This is the feature that transforms the product from reactive (you go look at sites) to proactive (the platform finds sites for you). It's extremely compelling in a demo.

---

## Full Phase 4 Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Next.js Frontend                   │
│   White-label theming · Multi-tenant routing         │
│   Kanban pipeline · Executive dashboard              │
│   Team collaboration · Map annotations              │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│                  FastAPI Backend                      │
│                                                       │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────┐  │
│  │  ML Training │  │  Scoring Eng. │  │  RAG     │  │
│  │  Pipeline    │  │  (all phases) │  │  Engine  │  │
│  └──────────────┘  └───────────────┘  └──────────┘  │
│                                                       │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────┐  │
│  │  Watch Alert │  │  Webhook      │  │ External │  │
│  │  Scheduler   │  │  Dispatcher   │  │  API v1  │  │
│  └──────────────┘  └───────────────┘  └──────────┘  │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│              Supabase (Postgres + pgvector)           │
│   Row-Level Security · Org isolation                 │
│   Realtime subscriptions · Auth                      │
│   pgvector embeddings · PostGIS spatial              │
└─────────────────────────────────────────────────────┘
                 +
        Redis (ARQ job queues)
        S3/R2 (document storage)
        Resend (transactional email)
        XGBoost model artifacts (S3)
```

---

## Phase 4 Deliverable Summary

| Feature | Effort | External Cost |
|---|---|---|
| Firm ML Model (XGBoost + SHAP) | Very High | $0 (open source) |
| Deal Pipeline CRM | High | $0 |
| Multi-Tenant White Label | High | $0 |
| Team Collaboration + RBAC | Medium | Resend ~$20/mo |
| Executive Dashboard | Medium | $0 |
| External API + Webhooks | Medium | $0 |
| Site Watch Alerts | Medium | $0 |

**Total Phase 4 timeline:** 10–14 weeks. This is the build that takes you from a smart tool to a platform business.

---

## Full Roadmap Summary

| Phase | Theme | Timeline | Key Unlock |
|---|---|---|---|
| 1 | LandGlide Replication | 6–8 weeks | DeThomas demo-ready |
| 2 | AI Site Analysis | 8–10 weeks | Closes the DeThomas contract |
| 3 | Data Center Selector | 8–10 weeks | New market vertical |
| 4 | Firm Intelligence Platform | 10–14 weeks | SaaS business with real lock-in |

**Total build timeline:** ~36–42 weeks solo, ~18–22 weeks with a co-founder or second engineer. The revenue conversation with DeThomas should happen at the end of Phase 1 — you don't need Phase 4 to charge money. You need Phase 4 to charge *serious* money and expand to a second client.

---

Want to start scaffolding the actual codebase now? I'd suggest starting with the Next.js + Mapbox + Supabase foundation from Phase 1, Feature 1.1 — that's the thing you can put in front of DeThomas in the shortest time.



PHASE 3 Screens:

6 Desktop screens:

DC Map Mode — full infrastructure layer stack on the warm orange grid: voltage-tiered TX lines, scaled substation icons, utility territory polygons, cyan fiber routes, map legend
DC Score · Normal — MW slider with tier classification, composite score hero with 4 weighted sub-scores, nearest infrastructure data
DC Score · DISQUALIFIED — FEMA flood zone floods the map red, score is suppressed entirely, action buttons disabled
Power Detail Tab — score breakdown by component, ranked substation list with voltage icons, redundancy analysis, radius circle, connector line to selected sub
Comparison Tray — persistent bottom dock with 3 sites + numbered orange circles on map, DISQ badge on disqualified site
Comparison Table — full-screen overlay with color-coded cells, disqualified column showing "—" throughout, LLM recommendation with orange left border

5 Mobile screens:

DC Map mode with infrastructure layers + mini legend
DC Score tab with MW slider + score hero + sub-scores
DISQUALIFIED state with flood zone overlay
Horizontal-scroll comparison table with AI rec
Comparison tray as a sticky strip above the tab bar

Key Phase 3 design decisions made:

Orange (#f97316) is definitively the DC accent — power should feel hot
DISQUALIFIED is never 0, it's a named state that overrides everything
Voltage color system: red → yellow → green → blue (matches electrical engineering conventions)
MW slider is the unforgettable interaction — recalculates locally, no API round-trip
Tray is a strip, not a sheet — low friction, always visible