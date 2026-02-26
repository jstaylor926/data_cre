# Atlas CRE

A commercial real estate (CRE) parcel research tool for Gwinnett County, Georgia. Built for DeThomas Development to streamline property due diligence and data center site selection with an interactive parcel map, instant property previews, AI-powered scoring, and persistent saved collections.

## What It Does

Atlas CRE has three modes, accessible from the landing page at `/`:

**Phase 1 — Standard CRE research.** Renders 307,000+ real parcel boundaries on an interactive Mapbox map. Click any parcel for an instant preview card, then open a full property panel with ownership, assessed values, zoning, deed history, legal descriptions, and LLC entity lookups sourced from Gwinnett County ArcGIS services.

**Phase 2 — Site Intelligence.** Adds AI-powered site scoring, zoning analysis chat, comparable sales, firm activity history, and a one-click investment brief generator. All powered by Claude (Anthropic) with structured streaming responses.

**Phase 3 — Data Center Mode.** Switches the app into a specialized workflow for data center site selection. Every selected parcel gets scored across five infrastructure dimensions — power, fiber, water, environmental risk, and composite DC suitability — validated against live federal HIFLD data. Includes a multi-site comparison table with AI consultant narrative, and **Site Scout**: an AI-powered discovery tool that finds candidate sites from a plain-English project description.

---

## Tech Stack

- **Next.js 16** (App Router, Turbopack dev server)
- **Mapbox GL JS** via `react-map-gl/mapbox` — parcel polygons, zoning overlays, infrastructure layers, scout overlays
- **Zustand** — single-store state management with persistence for user preferences
- **Supabase** — saved parcels and collections (PostgreSQL + Row Level Security)
- **Anthropic Claude API** — site scoring narratives, zoning chat, investment briefs, DC scoring, Site Scout geographic reasoning
- **Tailwind CSS 4** — dark-mode-only design system with custom CSS variables
- **Vaul** — mobile bottom drawer for property details

---

## Data Sources

| Source | What It Provides |
|--------|-----------------|
| Gwinnett County ArcGIS — Parcels (Layer 0) | 307,811 polygon boundaries, PIN, address, acreage |
| Gwinnett County ArcGIS — Zoning (Layer 1) | 12,593 zoning district polygons with classification codes |
| Gwinnett County ArcGIS — Property & Tax (Layer 3) | Owner, assessed values, land use, deed refs, legal descriptions |
| HIFLD Electric Substations (ArcGIS FeatureServer) | Substation locations, voltage, operator — used for DC power scoring |
| HIFLD Electric Transmission Lines (ArcGIS FeatureServer) | TX line geometry — used for corridor scoring |
| Mapbox Geocoding API | Place-based search and navigation |

Parcels and zoning load dynamically by viewport bounding box. Infrastructure data is fetched on demand when DC mode is active.

---

## Getting Started

### Prerequisites

- Node.js 18+
- Mapbox account (map token)
- Supabase project (saved parcels/collections)
- Anthropic API key (Phase 2 and 3 AI features)

### Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
ANTHROPIC_API_KEY=your_anthropic_key
NEXTAUTH_URL=http://localhost:3000
```

`NEXTAUTH_URL` is used by the DC Scout area-search route to self-call the dc-score API for batch parcel scoring.

### Install and Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The landing page links to all three phases. The map defaults to Gwinnett County at zoom 14 — zoom past 13 to see parcel boundaries appear.

### Database Setup

```bash
# Via Supabase CLI
supabase db push

# Or run the SQL directly in the Supabase SQL Editor
# File: supabase/migrations/20260221000000_dev_saved_parcels.sql
```

The migration uses `TEXT` user IDs (default: `dev-user`) so it works without Supabase Auth configured.

---

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Serve production build
npx eslint .         # Lint (ESLint 9 flat config)
npx tsc --noEmit     # Type check
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page — links to all three phases
│   ├── phase-1/page.tsx            # Standard CRE research dashboard
│   ├── phase-2/page.tsx            # Site intelligence dashboard
│   ├── phase-3/page.tsx            # Data center mode dashboard + Site Scout
│   └── api/
│       ├── parcel/[apn]/           # Property detail, score, zoning, comps, brief, dc-score
│       ├── parcel/batch/           # Batch parcel lookup (used by dc-scout area route)
│       ├── parcels/bbox/           # Viewport parcel GeoJSON
│       ├── zoning/bbox/            # Viewport zoning GeoJSON
│       ├── search/                 # County search (PIN, owner, address)
│       ├── infrastructure/tx-lines/ # HIFLD TX line proxy
│       ├── dc-brief/compare/       # Multi-site comparison AI narrative (streaming)
│       ├── dc-scout/discover/      # Site Scout Tier 1: NL → sub-markets (SSE)
│       ├── dc-scout/area/          # Site Scout Tier 2: bbox → parcel scoring (SSE)
│       ├── saved/                  # Saved parcels CRUD (Supabase)
│       ├── collections/            # Collections CRUD (Supabase)
│       └── entity/lookup/          # LLC/entity owner search
├── components/
│   ├── map/
│   │   ├── ParcelMap.tsx           # Main map — all layers, parcel click, viewport tracking
│   │   ├── InfrastructureLayers.tsx # HIFLD substations + TX lines (DC mode only)
│   │   ├── ZoningLayer.tsx         # Zoning overlay with county color mapping
│   │   ├── QuickInfoCard.tsx       # Tap-to-preview floating card
│   │   ├── SavedPins.tsx           # Bookmark markers
│   │   ├── CompMarkers.tsx         # Comparable sale markers + radius ring
│   │   └── GPSMarker.tsx           # User location dot
│   ├── panel/
│   │   ├── PanelContent.tsx        # Tab router — standard mode and DC mode
│   │   ├── ParcelDataTab.tsx       # Full property detail view
│   │   ├── ScoreTab.tsx            # Phase 2 site scoring
│   │   ├── ZoningTab.tsx           # AI zoning analysis + chat
│   │   ├── CompsTab.tsx            # Comparable sales
│   │   ├── DCPanelTabs.tsx         # DC mode tab bar
│   │   ├── DCScoreTab.tsx          # Composite DC score + sub-score breakdown
│   │   ├── PowerTab.tsx            # Power infrastructure detail
│   │   ├── FiberTab.tsx            # Fiber/network infrastructure detail
│   │   ├── WaterTab.tsx            # Water/cooling infrastructure detail
│   │   ├── EnvironTab.tsx          # Flood, seismic, climate risk
│   │   ├── ParcelPanel.tsx         # Desktop slide-in panel (380px)
│   │   ├── ParcelDrawer.tsx        # Mobile bottom drawer (Vaul)
│   │   ├── PanelActionBar.tsx      # Save, brief, compare actions
│   │   ├── BriefOverlay.tsx        # AI investment brief overlay
│   │   └── EntityLookupCard.tsx    # LLC entity lookup UI
│   ├── scout/
│   │   ├── SiteScoutPanel.tsx      # Two-tier AI discovery UI
│   │   ├── SubMarketCard.tsx       # Tier 1 sub-market result card
│   │   ├── SubMarketOverlay.tsx    # Tier 1 bbox rectangles on map
│   │   └── ScoutResultPins.tsx     # Tier 2 ranked parcel pins on map
│   ├── comparison/
│   │   ├── ComparisonTray.tsx      # Bottom-docked multi-site queue (up to 4)
│   │   └── ComparisonTable.tsx     # Full-screen side-by-side comparison + AI narrative
│   ├── layout/
│   │   ├── AppShell.tsx            # Responsive layout orchestrator
│   │   ├── TopBar.tsx              # Nav + search + mode switcher
│   │   ├── MapControls.tsx         # Zoom, GPS, layer controls
│   │   ├── MapHUD.tsx              # Coordinate/zoom display
│   │   └── MobileTabBar.tsx        # Bottom tab bar for mobile
│   ├── search/
│   │   ├── SearchBar.tsx           # Dual search (county records + Mapbox geocoding)
│   │   └── SearchDropdown.tsx      # Grouped results dropdown
│   └── saved/
│       ├── SavedPropertiesList.tsx # Saved parcels and collections view
│       └── SavedPropertyRow.tsx    # Individual saved parcel row
├── hooks/
│   ├── useViewportParcels.ts       # Debounced bbox parcel loading
│   ├── useViewportZoning.ts        # Debounced bbox zoning loading
│   ├── useParcelClick.ts           # Fetch property detail on panel open
│   ├── useDCScore.ts               # Trigger HIFLD fetch + DC scoring on parcel select
│   ├── useSiteScore.ts             # Phase 2 site scoring
│   ├── useZoningSummary.ts         # AI zoning analysis
│   ├── useComps.ts                 # Comparable sales
│   ├── useSavedParcels.ts          # Supabase saved parcels
│   ├── useCollections.ts           # Supabase collections
│   ├── useGeolocation.ts           # Browser GPS
│   ├── useMapboxSearch.ts          # Mapbox Search Box API
│   └── useResponsive.ts            # 1024px desktop/mobile breakpoint
├── lib/
│   ├── arcgis.ts                   # Gwinnett County ArcGIS client
│   ├── hifld.ts                    # HIFLD substation + TX line client
│   ├── dc-scoring.ts               # DC infrastructure scoring engine
│   ├── scoring.ts                  # Phase 2 site scoring engine
│   ├── zoning-standards.ts         # Zoning classification rules
│   ├── claude.ts                   # Anthropic client wrapper
│   ├── constants.ts                # Map config, layer IDs, zoning colors
│   ├── formatters.ts               # Currency, acres, dates, $/SF
│   ├── types.ts                    # All TypeScript interfaces
│   ├── supabase.ts                 # Browser Supabase client
│   ├── supabase-server.ts          # Server Supabase client (SSR cookies)
│   └── utils.ts                    # cn() classname utility
└── store/
    └── useAppStore.ts              # Zustand store — all app state and actions
```

---

## Feature Status

### Phase 1 — CRE Research ✅ Complete

- Real parcel boundaries from Gwinnett County (307K+ parcels, loaded by viewport)
- Two-step click flow: instant preview card → full property panel on demand
- Property details: ownership, assessed values, land use, zoning, deed references, legal descriptions
- Zoning overlay with county-specific color mapping (C1–C3, R60/R75/R100, M1/M2, MU, TND, etc.)
- Search by owner name, PIN, or address against county tax records
- Mapbox geocoding for place-based navigation
- Saved parcels and named collections (Supabase-backed, persists across sessions)
- LLC/entity ownership lookup
- Desktop panel (380px slide-in) + mobile drawer (Vaul)
- Layer toggles: parcels, parcel fill, zoning, saved pins, road labels
- Multiple base map styles: streets, satellite, light, dark

### Phase 2 — Site Intelligence ✅ Complete

- AI site scoring with weighted criteria (access, zoning, utilities, size) — Claude Haiku
- AI zoning analysis: plain-English summary of current zoning, permitted uses, variances — streaming
- Zoning AI chat for follow-up questions on any parcel
- Comparable sales: nearby sold parcels with price, $/SF, distance
- Firm activity history: LLC ownership patterns and associated entity graph
- Investment brief generator: one-click AI narrative covering deal thesis, risk, and comps — streaming
- Phase 2 tabs live on the Phase 1 dashboard via the same panel

### Phase 3 — Data Center Mode ✅ Complete

**DC Parcel Scoring**
- Composite DC suitability score (0–100) with sub-scores: Power, Fiber, Water, Environmental
- Power tab: nearest substation distance, voltage (kV), operator, transmission line access, estimated available capacity
- Fiber tab: proximity to carrier exchange points, estimated dark fiber availability, latency zone
- Water tab: cooling water availability, watershed, municipal service area, flood zone
- Environmental tab: FEMA flood zone, 100/500-year risk, seismic zone, climate risk factors
- Disqualification flags for hard blockers (flood zone AE/VE, no substation within 20 miles, etc.)
- All infrastructure data validated against live HIFLD federal datasets

**Multi-Site Comparison**
- Add up to 4 parcels to a comparison tray (bottom-docked)
- Full-screen comparison table: all five score dimensions side-by-side, best/worst highlighting
- AI consultant narrative streaming from `/api/dc-brief/compare` — winner, differentiators, risk flags

**Site Scout — AI Discovery**
- Tier 1 (Open Discovery): Describe a project in natural language → Claude identifies candidate sub-markets using geographic reasoning → HIFLD validates real substation data at each location → ranked results with rationale streamed back
- Tier 2 (Area Search): Pick a sub-market or use current map view → batch-scores all viable parcels in the bbox → full DC score on top 5 → numbered map pins with color-coded results
- Sub-market bbox overlays appear on the map as dashed rectangles during Tier 1
- Example queries: hyperscale I-85 corridor, edge deployment near fiber exchange, low-flood-risk Alabama site

---

## Design System

Dark-mode only. Custom CSS variables in `globals.css`:

- **Surfaces**: `--ink` through `--ink4` (darkest → lightest background)
- **Accent**: `--teal` (#00d4c8) — interactive elements, standard mode
- **Secondary**: `--amber` (#f5a623) — saved items, financial data
- **DC accent**: orange-500 — all Data Center mode elements
- **Fonts**: Bebas Neue (headings/logo), IBM Plex Mono (data labels/values), Barlow (body)

Zoning colors in `constants.ts`: commercial=blue, residential=green, industrial=orange, mixed-use=purple, planned=cyan.
