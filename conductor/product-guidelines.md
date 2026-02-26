# Product Guidelines

## Design Principles
- **Dark-Mode Only:** All UI elements must adhere to the project's dark-mode design system (`--ink` backgrounds).
- **Responsive & Interactive:** Seamless transitions between Desktop (ParcelPanel) and Mobile (ParcelDrawer) based on the 1024px breakpoint.
- **Data-Rich Layouts:** Display complex real estate and infrastructure data with clarity, prioritizing information density without compromising legibility.

## Typography
- **Headings & Branding:** Use `Bebas Neue` for a bold, professional impact.
- **Data & Values:** Use `IBM Plex Mono` for all numeric values, labels, and data grids to ensure precision and readability.
- **Body Copy:** Use `Barlow` for all standard text and descriptions.

## Color Palette
- **Interactive/Primary:** `--teal` (#00d4c8) for primary selection, map highlights, and general interactivity.
- **Secondary/Financial:** `--amber` (#f5a623) for saved properties, collections, and financial data points.
- **Data Center Mode:** `orange-500` for all specialized infrastructure scoring and Site Scout elements.

## UX & Interaction
- **Two-Step Interaction:** Clicking a parcel triggers an instant `QuickInfoCard` preview. Full details are fetched and displayed in the main panel only upon explicit user selection.
- **Map-First Experience:** Ensure the map remains the primary navigation and interaction tool.
- **Standardized Formatting:** Always use the utility functions in `src/lib/formatters.ts` for currency, acreage, dates, and $/SF values to ensure system-wide consistency.

## Implementation Standards
- **Component Strategy:** Use `"use client"` for all interactive components in `src/components/`.
- **Styling:** Adhere strictly to Tailwind CSS 4 conventions, using `cn()` for class merging.
- **State Management:** Leverage the Zustand store (`useAppStore.ts`) for global UI and selection state, ensuring persistence where appropriate.
