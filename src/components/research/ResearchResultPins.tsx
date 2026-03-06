"use client";

import { Marker } from "react-map-gl/mapbox";
import { useAppStore } from "@/store/useAppStore";

/**
 * ResearchResultPins — renders map markers for research mode results.
 * Positioned inside the react-map-gl <Map> component.
 */
export default function ResearchResultPins() {
  const results = useAppStore((s) => s.researchSession.results);
  const active = useAppStore((s) => s.researchSession.active);
  const selectParcel = useAppStore((s) => s.selectParcel);

  if (!active || results.length === 0) return null;

  return (
    <>
      {results.map((result, i) => (
        <Marker
          key={result.apn}
          longitude={result.coordinates[0]}
          latitude={result.coordinates[1]}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            selectParcel(result.apn);
          }}
        >
          <div className="group relative cursor-pointer">
            {/* Pin shape */}
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-teal bg-ink shadow-lg shadow-teal/20 transition-transform group-hover:scale-110">
              <span className="font-mono text-[9px] font-bold text-teal">
                {i + 1}
              </span>
            </div>
            {/* Pin tail */}
            <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-teal bg-ink" />

            {/* Hover tooltip */}
            <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-ink border border-line2 px-2 py-1 font-mono text-[8px] text-bright opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {result.address.split(",")[0]}
            </div>
          </div>
        </Marker>
      ))}
    </>
  );
}
