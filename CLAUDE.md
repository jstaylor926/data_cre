# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pocket Developer — a commercial real estate (CRE) parcel research tool. Next.js 16 app with Mapbox GL maps, Zustand state management, and Supabase backend (currently using in-memory mock stores during dev). Phase 1 is the active build: interactive parcel map, property detail panels, LLC entity lookup, saved collections.

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Serve production build
npx eslint .         # Lint (ESLint 9 flat config)
npx tsc --noEmit     # Type check without emitting
```

No test runner is configured yet. Playwright is installed as a dev dependency but has no test files.

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_MAPBOX_TOKEN` — Mapbox API key (map rendering + geocoding)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase instance URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key

## Architecture

### State Flow

All UI state lives in a single Zustand store (`src/store/useAppStore.ts`). The flow:

1. User clicks a parcel on map → `selectParcel(apn)` sets `selectedAPN`, `panelOpen: true`, `parcelLoading: true`
2. `useParcelClick` hook watches `selectedAPN`, fetches parcel data, calls `setSelectedParcel(parcel)`
3. Panel/Drawer renders from `selectedParcel` in the store
4. `clearSelection()` resets everything and closes the panel

Layer toggles (`showParcels`, `showParcelFill`, `showZoning`, `showSavedPins`, `showRoadLabels`) and `baseMapStyle` also live in the store and are consumed directly by `ParcelMap.tsx`.

### Desktop vs Mobile

`useResponsive` hook detects the 1024px breakpoint. Desktop gets a 380px slide-in right panel (`ParcelPanel`), mobile gets a bottom drawer via Vaul (`ParcelDrawer`). Both render the same `PanelContent`. The `AppShell` component orchestrates this along with `MapControls` and `MapHUD`.

### Data Layer (Mock → Supabase)

API routes in `src/app/api/` use in-memory `Map` stores for saved parcels and collections. Parcel data comes from `src/lib/mock-data.ts` (20 parcels) and `src/lib/mock-geojson.ts` (GeoJSON for map rendering). Entity lookup uses a mock entity map in the API route.

When migrating to Supabase:
- Replace in-memory stores in API routes with Supabase queries
- Replace `getParcelByAPN()` calls in `useParcelClick` with `/api/parcel/[apn]` fetch
- DB schema is ready in `supabase/migrations/` — tables: `parcels` (with PostGIS), `saved_parcels`, `collections`, all with RLS policies

### Map Integration

`ParcelMap.tsx` uses `react-map-gl` wrapping `mapbox-gl`. Parcels are a GeoJSON `Source` with two layers: a fill layer (interactive, used for click detection) and a line layer (borders). The fill must always have non-zero opacity (`rgba(0,212,200,0.01)` minimum) or click detection breaks. Map controls shift position when the panel opens via padding.

### Panel Tabs

Only the "Data" tab is active in Phase 1. Score, Zoning, and Comps tabs are locked with visual indicators. The `activeTab` state is in the store but only `"data"` renders content via `ParcelDataTab`.

## Design System

Dark-mode only. Custom CSS variables defined in `globals.css`:
- **Surfaces**: `--ink` through `--ink4` (darkest to lightest background)
- **Accent**: `--teal` (#00d4c8) for interactive/selected elements
- **Secondary**: `--amber` (#f5a623) for saved items and financial data
- **Fonts**: Bebas Neue (headings/logo), IBM Plex Mono (data labels/values), Barlow (body text)

Zoning colors are mapped in `src/lib/constants.ts` — commercial=blue, residential=green, industrial=orange, mixed-use=purple, planned=cyan.

Use the `cn()` utility from `src/lib/utils.ts` (clsx + tailwind-merge) for conditional classNames in components.

## Key Conventions

- All components in `src/components/` are client components (`"use client"`)
- Path alias: `@/*` maps to `src/*`
- Formatting: `src/lib/formatters.ts` has standard formatters for currency, acres, sq ft, dates, $/SF — always use these rather than inline formatting
- Types: Core interfaces (`Parcel`, `SavedParcel`, `Collection`, `EntityResult`, `SearchResult`) are in `src/lib/types.ts`
- The wireframe reference is at `project_build/` — design specs come from the Phase 1 wireframes HTML doc
- shadcn components live in `src/components/ui/` and are configured via `components.json` (new-york style, lucide icons)
