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

  return (
    <>
      {savedParcels.map((sp) => {
        const centroid = getParcelCentroid(sp.apn);
        if (!centroid) return null;

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
              {/* Pin head */}
              <div className="h-3 w-3 rounded-full border-2 border-ink bg-amber" />
              {/* Pin stem */}
              <div className="-mt-px h-2 w-[1.5px] bg-amber" />
            </div>
          </Marker>
        );
      })}
    </>
  );
}
