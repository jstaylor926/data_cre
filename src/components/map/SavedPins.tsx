"use client";

import { Marker } from "react-map-gl/mapbox";
import { useAppStore } from "@/store/useAppStore";
import { getParcelCentroid } from "@/lib/mock-geojson";
import type { SavedParcel } from "@/lib/types";

interface SavedPinsProps {
  savedParcels: SavedParcel[];
}

export default function SavedPins({ savedParcels }: SavedPinsProps) {
  const selectParcel = useAppStore((s) => s.selectParcel);
  const siteScore = useAppStore((s) => s.siteScore);
  const selectedAPN = useAppStore((s) => s.selectedAPN);

  return (
    <>
      {savedParcels.map((sp) => {
        const centroid = getParcelCentroid(sp.apn);
        if (!centroid) return null;

        // Simulate a score for saved pins in Phase 2
        const hasScore = siteScore && sp.apn === selectedAPN;
        const scoreValue = hasScore ? siteScore.composite : (sp.apn.endsWith('1') ? 74 : null);

        return (
          <Marker
            key={sp.id}
            longitude={centroid[0]}
            latitude={centroid[1]}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              selectParcel(sp.apn);
            }}
          >
            <div className="flex cursor-pointer flex-col items-center">
              {scoreValue && (
                <div className="mb-0.5 rounded border border-green/40 bg-ink/90 px-1.5 py-0.5 font-mono text-[9px] font-medium text-green shadow-sm">
                  {scoreValue}
                </div>
              )}
              {/* Pin head */}
              <div className="h-3 w-3 rounded-full border-2 border-ink bg-amber shadow-sm" />
              {/* Pin stem */}
              <div className="-mt-px h-2 w-[1.5px] bg-amber shadow-sm" />
            </div>
          </Marker>
        );
      })}
    </>
  );
}
