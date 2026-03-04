"use client";

import { useAppStore } from "@/store/useAppStore";
import { getCounty } from "@/lib/county-registry";

export default function MapHUD() {
  const lat = useAppStore((s) => s.viewportLat);
  const lng = useAppStore((s) => s.viewportLng);
  const zoom = useAppStore((s) => s.viewportZoom);
  const activeCountyId = useAppStore((s) => s.activeCountyId);

  const county = `${getCounty(activeCountyId).name.toUpperCase()} CO`;

  return (
    <>
      {/* Bottom-left: coordinates */}
      <div className="absolute bottom-4 left-4 z-10 rounded border border-line bg-ink/85 px-2 py-1 font-mono text-[9px] tracking-wider text-pd-muted">
        {Math.abs(lat).toFixed(4)} {lat >= 0 ? "N" : "S"} &middot;{" "}
        {Math.abs(lng).toFixed(4)} {lng >= 0 ? "E" : "W"}
      </div>

      {/* Bottom-right: zoom + county */}
      <div className="absolute bottom-4 right-14 z-10 rounded border border-line bg-ink/85 px-2 py-1 font-mono text-[8px] tracking-wider text-pd-muted">
        z{zoom.toFixed(1)} &middot; {county}
      </div>
    </>
  );
}
