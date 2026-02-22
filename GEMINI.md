# GEMINI.md - Project Context: Pocket Developer

This file provides essential context for Gemini CLI to assist in the development of **Pocket Developer**, a specialized Commercial Real Estate (CRE) parcel research and intelligence platform.

## Project Overview
Pocket Developer is an interactive parcel mapping and intelligence tool designed for DeThomas Development. It focuses on Gwinnett County, Georgia, providing real-time property data, zoning analysis, and advanced site selection capabilities.

### Core Mission
To transform raw parcel data into actionable development intelligence, moving from basic mapping (Phase 1) to AI-driven site analysis (Phase 2), specialized infrastructure scoring for data centers (Phase 3), and a proprietary firm-wide intelligence platform (Phase 4).

## Technical Stack
- **Framework:** Next.js 16 (App Router, Turbopack)
- **Map Engine:** Mapbox GL JS via `react-map-gl`
- **State Management:** Zustand (with persistence for user preferences)
- **Database/Backend:** Supabase (PostgreSQL, PostGIS, RLS)
- **Styling:** Tailwind CSS 4 (Dark-mode only design system)
- **UI Components:** Shadcn/ui, Radix UI, Vaul (Mobile drawers)
- **Data Sources:** Gwinnett County ArcGIS Feature Services (Parcels, Zoning, Tax Table)
- **AI Integration:** Claude (Anthropic SDK) for zoning interpretation and RAG-based deal history.

## Development Lifecycle & Commands

### Setup
1.  **Environment Variables:** Create `.env.local` with:
    -   `NEXT_PUBLIC_MAPBOX_TOKEN`
    -   `NEXT_PUBLIC_SUPABASE_URL`
    -   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2.  **Database:** Apply migrations in `supabase/migrations/` using `supabase db push`.

### Commands
-   **Development:** `npm run dev`
-   **Build:** `npm run build`
-   **Start:** `npm run start`
-   **Linting:** `npx eslint .`
-   **Type Checking:** `npx tsc --noEmit`

## Architectural Patterns

### State Management (`src/store/useAppStore.ts`)
A single Zustand store manages the global application state:
-   **Selection:** `selectedAPN`, `selectedParcel`, `quickCardData`.
-   **UI State:** `panelOpen`, `activeTab`, `entityLookupOpen`.
-   **Map Settings:** `baseMapStyle`, layer toggles (`showParcels`, `showZoning`, etc.).
-   **Persistence:** Layer preferences are persisted to `localStorage`.

### Data Flow
1.  **Map Interaction:** Clicking a parcel triggers `showQuickCard` (instant preview from GeoJSON data).
2.  **Detail Fetching:** "View Details" calls `openFullPanel`, which triggers the `useParcelClick` hook to fetch detailed tax data via `fetchPropertyByPIN` (ArcGIS) or `/api/parcel/[apn]`.
3.  **Responsive Layout:** `useResponsive` (1024px breakpoint) determines if the UI renders the `ParcelPanel` (Desktop side-slide) or `ParcelDrawer` (Mobile bottom-drawer).

### Map Integration (`src/components/map/ParcelMap.tsx`)
-   Uses `react-map-gl`.
-   **Parcel Layers:** A fill layer (for clicks) and a line layer (for borders). Fill opacity must be > 0 (e.g., `0.01`) for interaction.
-   **Zoning Layers:** Dynamically colored based on the `ZONING_COLORS` map in `src/lib/constants.ts`.

## Design System (Dark-Mode Only)
-   **Colors:**
    -   `--teal` (#00d4c8): Primary interactive/selection color.
    -   `--amber` (#f5a623): Secondary color for saved/financial items.
    -   `--violet`: Comparable sales and Phase 2 indicators.
-   **Typography:**
    -   `Bebas Neue`: Headings and branding.
    -   `IBM Plex Mono`: Data labels and numeric values.
    -   `Barlow`: Body copy.

## Project Roadmap

### Phase 1: LandGlide Replication (Current)
-   Interactive Mapbox parcel map.
-   Property detail panels (Ownership, Value, Zoning).
-   LLC Entity Lookup (Piercing LLC owners).
-   Saved Properties & Collections.

### Phase 2: AI Site Analysis (Active)
-   **Site Score Card:** Composite 0-100 development score.
-   **Zoning AI:** Natural language interpretation of zoning ordinances.
-   **Auto-Comps:** Spatial query for recent comparable land sales.
-   **Deal History RAG:** Querying historical firm documents for site context.

### Phase 3: Data Center Selector (Planned)
-   Infrastructure scoring (Power, Fiber, Water).
-   Environmental risk assessment (Flood, Wetlands).
-   Tier classification (Tier I-IV).

### Phase 4: Firm Intelligence Platform (Planned)
-   Proprietary ML scoring trained on firm-specific outcomes.
-   Full Deal Lifecycle/CRM.
-   White-label multi-tenancy.

## Key Files
-   `src/lib/arcgis.ts`: Logic for querying Gwinnett County's ArcGIS services.
-   `src/lib/types.ts`: Central TypeScript interfaces.
-   `src/lib/formatters.ts`: Standardized formatting for currency, acres, and dates.
-   `src/hooks/useParcelClick.ts`: Orchestrates the transition from preview to full detail.
-   `src/store/useAppStore.ts`: The source of truth for application state.
-   `project_notes.md`: Detailed feature and phase breakdowns.

## Development Conventions
-   **Client Components:** Use `"use client"` for all components in `src/components/`.
-   **Formatting:** Always use formatters from `src/lib/formatters.ts` for data display.
-   **Utilities:** Use `cn()` from `src/lib/utils.ts` for Tailwind class merging.
-   **API Routes:** API routes in `src/app/api/` should handle data enrichment and Supabase interactions.
