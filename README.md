# Atlas CRE

A commercial real estate (CRE) parcel research and intelligence platform for Gwinnett County, Georgia. Built for DeThomas Development to streamline property due diligence and data center site selection through a unified, feature-flagged application.

## Product Overview

Atlas CRE provides a tiered intelligence platform for site selection and property research, accessible via a professional landing page at `/` and a unified application at `/map`.

### Core Intelligence Layers

**Standard Research (Free/Pro)**
Renders 307,000+ real parcel boundaries on an interactive Mapbox map. Includes ownership, assessed values, zoning, deed history, legal descriptions, and LLC entity lookups sourced from Gwinnett County ArcGIS services.

**Site Intelligence (Pro/Enterprise)**
Adds AI-powered site scoring, zoning analysis chat, comparable sales, firm activity history, and a one-click investment brief generator powered by Claude AI with structured streaming responses.

**Data Center Mode (Pro/Enterprise)**
A specialized workflow for data center site selection. Every parcel is scored across power, fiber, water, and environmental risk—validated against live federal HIFLD data. Includes multi-site comparison tables and **Site Scout**: an AI-powered discovery tool.

**Firm Intelligence (Enterprise)**
A proprietary platform layer for multi-tenant CRM, deal pipeline tracking, and internal project management, linking parcels directly to firm-wide outcomes.

---

## Technical Architecture

- **Unified Application**: Consolidated all experimental phases into a single `/map` route with an adaptive UI.
- **Feature Flag System**: Granular control over high-value features (AI, DC, CRM) via the Zustand store and a dedicated Settings Modal.
- **Membership Simulation**: Built-in tier presets (Free, Pro, Enterprise) to demonstrate tiered value propositions.
- **Dark-Mode Only**: A custom design system optimized for high-density data visualization.

---

## Tech Stack

- **Next.js 16** (App Router, Turbopack dev server)
- **Mapbox GL JS** via `react-map-gl/mapbox` — parcel polygons, zoning overlays, infrastructure layers, scout overlays
- **Zustand** — single-store state management with persistence for user preferences and feature flags
- **Supabase** — saved parcels, collections, and multi-tenant CRM (PostgreSQL + RLS)
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
NEXT_PUBLIC_APP_MODE=prod
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
# Files:
# - supabase/migrations/20260221000000_dev_saved_parcels.sql
# - supabase/migrations/20260225000000_phase4_crm.sql
# - supabase/migrations/20260228000100_harden_auth_rls.sql
```

Saved parcel and CRM tables currently use `TEXT` `user_id` columns. Production-safe access is enforced by RLS + Supabase-auth JWT identity; there is no hardcoded `dev-user` default.

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
│   ├── page.tsx                    # Professional Landing Page
│   ├── map/page.tsx                # Unified Application (All features)
│   └── api/
│       ├── parcel/[apn]/           # Property detail, score, zoning, comps, brief, dc-score
│       ├── crm/                    # Organizations, projects, tasks, notes APIs (Phase 4 foundation)
│       ├── ...                     # Other API routes
├── components/
│   ├── layout/
│   │   ├── TopBar.tsx              # Adaptive Nav + Search + Settings trigger
│   │   ├── SettingsModal.tsx       # Feature flag & Tier selection UI
│   │   ├── AppShell.tsx            # Responsive layout orchestrator
│   │   └── ...
│   ├── crm/                        # Firm Intel (Phase 4) components
│   ├── map/                        # All map-related components
│   ├── panel/                      # Property detail panel & adaptive tabs
│   └── ...
├── store/
│   └── useAppStore.ts              # Zustand store — includes feature flag state
```

---

## Feature Status

Status Source of Truth (updated Feb 28, 2026): this README section is canonical for phase completion status. The checklist `.docx` is historical reference only.

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

### Phase 2 — Site Intelligence ⚠️ Partial / Beta

- AI site scoring with weighted criteria is live, but access/demographics are currently proxy-scored from parcel attributes (traffic + census integrations pending)
- AI zoning analysis: plain-English summary of current zoning, permitted uses, variances — streaming
- Zoning AI chat for follow-up questions on any parcel
- Comparable analysis currently uses county assessed values (not transaction history) and marks date as assessed snapshot
- Firm history panel is present, but deal-history ingestion/RAG matching is not yet integrated
- Entity lookup is mock-enabled in dev mode; production endpoint currently returns `501 Not Implemented`
- Investment brief generator: one-click AI narrative covering deal thesis, risk, and comps — streaming
- Phase 2 tabs live on the Phase 1 dashboard via the same panel

### Phase 3 — Data Center Mode ⚠️ Beta (Functional, Data Gaps Remain)

**DC Parcel Scoring**
- Composite DC suitability score (0–100) with sub-scores: Power, Fiber, Water, Environmental
- Power tab: nearest substation distance, voltage (kV), operator, transmission line access, estimated available capacity
- Fiber tab: proximity to carrier exchange points, estimated dark fiber availability, latency zone
- Water tab: cooling demand estimates and watershed context are present; authoritative water-capacity integration is still pending
- Environmental tab: FEMA flood zone, 100/500-year risk, seismic zone, climate risk factors
- Disqualification flags for hard blockers (flood zone AE/VE, no substation within 20 miles, etc.)
- All infrastructure data validated against live HIFLD federal datasets

**Multi-Site Comparison**
- Add up to 4 parcels to a comparison tray (bottom-docked)
- Full-screen comparison table: all five score dimensions side-by-side, best/worst highlighting
- AI consultant narrative streaming from `/api/dc-brief/compare` — winner, differentiators, risk flags

**Site Scout — AI Discovery**
- Tier 1 (Open Discovery): Describe a project in natural language → Claude identifies candidate sub-markets using geographic reasoning → HIFLD validates real substation data at each location → ranked results with rationale streamed back
- Flood risk classification is now based on live FEMA zone lookups at each candidate market center; full parcel-level flood screening is still handled in Tier 2 scoring
- Tier 2 (Area Search): Pick a sub-market or use current map view → batch-scores all viable parcels in the bbox → full DC score on top 5 → numbered map pins with color-coded results
- Sub-market bbox overlays appear on the map as dashed rectangles during Tier 1
- Example queries: hyperscale I-85 corridor, edge deployment near fiber exchange, low-flood-risk Alabama site

### Phase 4 — Firm Intelligence 🧱 Foundation Only

- Core schema exists for organizations, memberships, projects, tasks, and notes
- Multi-tenant RLS is now hardened to org-scoped policies (no broad `USING (true)` access)
- Core CRUD APIs now exist for organizations, projects, tasks, and notes under `/api/crm/*`
- CRM route/UI is functional but still foundation-level (search/create/list only, advanced workflow automation not shipped)

---

## Design System

Dark-mode only. Custom CSS variables in `globals.css`:

- **Surfaces**: `--ink` through `--ink4` (darkest → lightest background)
- **Accent**: `--teal` (#00d4c8) — interactive elements, standard mode
- **Secondary**: `--amber` (#f5a623) — saved items, financial data
- **DC accent**: orange-500 — all Data Center mode elements
- **Fonts**: Bebas Neue (headings/logo), IBM Plex Mono (data labels/values), Barlow (body)

Zoning colors in `constants.ts`: commercial=blue, residential=green, industrial=orange, mixed-use=purple, planned=cyan.
