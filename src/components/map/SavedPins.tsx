"use client";

import { Marker } from "react-map-gl/mapbox";
import { useSavedParcels } from "@/hooks/useSavedParcels";
import { getParcelCentroid } from "@/lib/mock-geojson";
import { useAppStore } from "@/store/useAppStore";
import { MapPin } from "lucide-react";

export default function SavedPins() {
  const { savedParcels } = useSavedParcels();
  const selectParcel = useAppStore((s) => s.selectParcel);

  return (
    <>
      {savedParcels.map((sp) => {
        const coords = getParcelCentroid(sp.apn);
        if (!coords) return null;
        return (
          <Marker
            key={sp.id}
            longitude={coords[0]}
            latitude={coords[1]}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              selectParcel(sp.apn);
            }}
          >
            <MapPin className="h-6 w-6 text-amber-500 fill-amber-500/30 cursor-pointer hover:scale-110 transition-transform" />
          </Marker>
        );
      })}
    </>
  );
}
