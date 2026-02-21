# Pocket Developer

A commercial real estate (CRE) parcel research tool for Gwinnett County, Georgia. Built for DeThomas Development to streamline property due diligence with an interactive parcel map, instant property previews, and persistent saved collections.

## What It Does

Pocket Developer renders 307,000+ real parcel boundaries on an interactive map powered by Mapbox GL. Click any parcel to see an instant preview card with address, PIN, and acreage — pulled directly from the already-loaded GeoJSON with no API call. Tap "View Details" to open a full property panel with ownership, assessed values, zoning, deed history, and legal descriptions sourced from the county's ArcGIS Feature Services.

The search bar queries county property records by owner name, address, or PIN alongside Mapbox geocoding for place-based navigation. Saved parcels and collections persist to Supabase for cross-session bookmarking.

## Tech Stack

- **Next.js 16** (App Router, Turbopack dev server)
- **Mapbox GL JS** via `react-map-gl/mapbox` — parcel polygons, zoning overlays, saved pins
- **Zustand** — single-store state management with persistence for user preferences
- **Supabase** — saved parcels and collections (PostgreSQL + Row Level Security)
- **Tailwind CSS 4** — dark-mode-only design system with custom CSS variables
- **Vaul** — mobile bottom drawer for property details

## Data Sources

All property data comes from Gwinnett County's free, public ArcGIS Feature Services — no paid data subscriptions required for Phase 1.

| Layer | Records | What It Provides |
|-------|---------|-----------------|
| Parcels (Layer 0) | 307,811 | Polygon boundaries, PIN, address, acreage |
| Zoning (Layer 1) | 12,593 | Zoning district polygons with classification codes |
| Property & Tax (Layer 3) | 310,291 | Owner, assessed values, zoning, land use, deed refs, legal descriptions |

Parcels and zoning load dynamically by map viewport (bounding box queries). Property details are fetched on demand when the user opens the full panel.

## Getting Started

### Prerequisites

- Node.js 18+
- A Mapbox account (for the map token)
- A Supabase project (for saved parcels/collections)

### Environment Variables

Create `.env.local` with:

```
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Install and Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The map defaults to Gwinnett County at zoom 14. Zoom in past 13 to see parcel boundaries appear.

### Database Setup

Apply the migration to your Supabase project to create the `collections` and `saved_parcels` tables:

```bash
# Via Supabase CLI
supabase db push

# Or run the SQL directly in the Supabase SQL Editor
# File: supabase/migrations/20260221000000_dev_saved_parcels.sql
```

The migration uses `TEXT` user IDs (default: `dev-user`) instead of auth.users foreign keys, so it works without Supabase Auth configured.

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Serve production build
npx eslint .         # Lint (ESLint 9 flat config)
npx tsc --noEmit     # Type check
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── parcel/[apn]/    # Property detail (county tax table → Parcel)
│   │   ├── parcels/bbox/    # Viewport parcel GeoJSON (county polygons)
│   │   ├── zoning/bbox/     # Viewport zoning GeoJSON
│   │   ├── search/          # County search (PIN, owner, address)
│   │   ├── saved/           # Saved parcels CRUD (Supabase)
│   │   ├── collections/     # Collections CRUD (Supabase)
│   │   └── entity-lookup/   # LLC/entity owner search
│   └── page.tsx             # App shell entry
├── components/
│   ├── map/
│   │   ├── ParcelMap.tsx     # Main map with parcel/zoning layers
│   │   ├── QuickInfoCard.tsx # Tap-to-preview floating card
│   │   ├── ZoningLayer.tsx   # Zoning overlay with county color mapping
│   │   ├── SavedPins.tsx     # Bookmark markers on map
│   │   └── CompMarkers.tsx   # Comparable sale markers
│   ├── panel/
│   │   ├── PanelContent.tsx  # Tab container (data, score, zoning, comps)
│   │   ├── ParcelDataTab.tsx # Full property detail view
│   │   ├── ParcelPanel.tsx   # Desktop slide-in panel (380px)
│   │   └── ParcelDrawer.tsx  # Mobile bottom drawer (Vaul)
│   ├── search/
│   │   ├── SearchBar.tsx     # Dual search (county records + Mapbox geocoding)
│   │   └── SearchDropdown.tsx # Grouped results dropdown
│   └── layout/
│       ├── AppShell.tsx      # Responsive layout orchestrator
│       ├── MapControls.tsx   # Zoom, layers, base map controls
│       └── MapHUD.tsx        # Coordinate/zoom display
├── hooks/
│   ├── useViewportParcels.ts # Debounced bbox parcel loading
│   ├── useViewportZoning.ts  # Debounced bbox zoning loading
│   ├── useParcelClick.ts     # Fetch property detail on panel open
│   ├── useSavedParcels.ts    # Supabase saved parcels hook
│   ├── useMapboxSearch.ts    # Mapbox Search Box API
│   └── useResponsive.ts     # 1024px breakpoint detection
├── lib/
│   ├── arcgis.ts            # Gwinnett County ArcGIS client
│   ├── constants.ts         # Map config, layer IDs, colors
│   ├── formatters.ts        # Currency, acres, dates, $/SF
│   ├── types.ts             # Core interfaces (Parcel, Collection, etc.)
│   ├── supabase.ts          # Browser Supabase client
│   └── supabase-server.ts   # Server Supabase client (SSR cookies)
├── store/
│   └── useAppStore.ts       # Zustand store (selection, layers, viewport)
└── styles/
    └── globals.css          # CSS variables, dark theme, fonts
```

## Phase 1 Features (Current)

- Real parcel boundaries from Gwinnett County (307K+ parcels, loaded by viewport)
- Two-step click flow: instant preview card → full property panel on demand
- Property details: ownership, assessed values, land use, zoning, deed references, legal descriptions
- Zoning overlay with county-specific color mapping (C1-C3, R60/R75/R100, M1/M2, MU, TND, etc.)
- Search by owner name, PIN, or address against county tax records
- Mapbox geocoding for place-based navigation
- Saved parcels and collections (Supabase-backed)
- LLC entity ownership lookup
- Desktop panel (380px slide-in) + mobile drawer (Vaul)
- Layer toggles: parcels, parcel fill, zoning, saved pins, road labels
- Multiple base map styles (streets, satellite, light, dark)

## Phase 2 (Planned)

Site intelligence scoring, AI zoning analysis, comparable sales, firm activity history, AI chat assistant, and investment brief generation. UI scaffolding exists but tabs are locked.

## Design System

Dark-mode only with custom CSS variables. Accent colors: teal (#00d4c8) for interactive elements, amber (#f5a623) for saved/financial items, violet for comparables. Fonts: Bebas Neue (headings), IBM Plex Mono (data), Barlow (body).
