"use client";
/**
 * ScoutResultPins — numbered map markers for Tier 2 area search results.
 *
 * Reads `scoutSession.candidates` from Zustand. Shows ranked pins on the map;
 * clicking a pin selects the parcel in the main app flow and flies to it.
 *
 * Must be rendered inside <Map> in ParcelMap.tsx.
 */

import { Marker } from "react-map-gl/mapbox";
import { useAppStore } from "@/store/useAppStore";

export default function ScoutResultPins() {
  const candidates = useAppStore((s) => s.scoutSession.candidates);
  const activeSubMarket = useAppStore((s) => s.scoutSession.activeSubMarket);
  const selectParcel = useAppStore((s) => s.selectParcel);

  // Only show pins when we're in "area" or "results" mode (Tier 2)
  if (!activeSubMarket && candidates.length === 0) return null;

  return (
    <>
      {candidates.map((candidate) => {
        const [lng, lat] = candidate.centroid;
        const composite = candidate.dcScore?.composite ?? null;
        const isDisqualified = candidate.dcScore?.disqualified ?? false;

        // Color based on score
        const color = isDisqualified
          ? "#ef4444"           // red — disqualified
          : composite === null
            ? "#6b7280"         // gray — quick-score only, no full score yet
            : composite >= 70
              ? "#4ade80"       // green — good site
              : composite >= 45
                ? "#f59e0b"     // amber — marginal
                : "#ef4444";    // red — poor

        return (
          <Marker
            key={candidate.apn}
            longitude={lng}
            latitude={lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              selectParcel(candidate.apn);
            }}
          >
            <div
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white/90 text-[10px] font-bold text-white shadow-lg transition-transform hover:scale-110"
              style={{ backgroundColor: color }}
              title={`${candidate.address}\n${composite !== null ? `Score: ${composite}/100` : "Quick score only"}`}
            >
              {candidate.rank}
            </div>
          </Marker>
        );
      })}
    </>
  );
}
