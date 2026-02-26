# Tech Stack

## Language
- **TypeScript:** Ensuring type safety and better development experience across the entire codebase.

## Frameworks
- **Frontend Framework:** Next.js 16 (App Router, Turbopack) with React 19 for a high-performance, responsive user experience.
- **Map Engine:** Mapbox GL JS via `react-map-gl` for interactive parcel and infrastructure visualization.
- **State Management:** Zustand (with persistence for user preferences) for efficient, global application state.
- **Styling:** Tailwind CSS 4 (Dark-mode only design system) for a modern, interactive aesthetic.
- **UI Components:** Shadcn/ui, Radix UI, Vaul (Mobile drawers) for accessible and responsive UI components.

## Database & Backend
- **Database/Backend:** Supabase (PostgreSQL, PostGIS, RLS) for real-time data persistence, spatial queries, and secure row-level access.

## APIs & Data Sources
- **Parcel & Zoning Data:** Gwinnett County ArcGIS Feature Services for real-time property and zoning information.
- **Infrastructure Data:** HIFLD Federal Data for substation and transmission line mapping.
- **AI Integration:** Claude (Anthropic SDK) for site scoring, zoning interpretation, and site discovery.
- **Mapbox APIs:** Geocoding and map styles for navigation and base layers.

## Testing & Tooling
- **Linting:** ESLint 9 (Flat Config) for maintaining code quality.
- \*\*Type Checking:\*\* TypeScript compiler for static analysis.
- \*\*Package Manager:\*\* NPM for managing project dependencies.
