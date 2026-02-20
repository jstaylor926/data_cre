"use client";

import { Marker } from "react-map-gl/mapbox";
import { useAppStore } from "@/store/useAppStore";

export default function CompMarkers() {
  const comps = useAppStore((s) => s.comps);
  const activeTab = useAppStore((s) => s.activeTab);

  if (activeTab !== "comps" || comps.length === 0) return null;

  return (
    <>
      {comps.map((comp) => (
        <Marker
          key={comp.id}
          longitude={comp.coordinates[0]}
          latitude={comp.coordinates[1]}
        >
          <div className="h-2 w-2 rounded-full border border-ink bg-violet shadow-sm" />
        </Marker>
      ))}
    </>
  );
}
