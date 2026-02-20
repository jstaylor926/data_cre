"use client";

import { useAppStore } from "@/store/useAppStore";
import { formatCoordinate } from "@/lib/formatters";

export default function MapHUD() {
  // For now show static coordinates; will connect to map viewState later
  return (
    <>
      {/* Bottom-left: coordinates */}
      <div className="absolute bottom-4 left-4 z-10 rounded border border-line bg-ink/85 px-2 py-1 font-mono text-[9px] tracking-wider text-pd-muted">
        33.9500 N &middot; 84.0700 W
      </div>

      {/* Bottom-right: zoom + county */}
      <div className="absolute bottom-4 right-14 z-10 rounded border border-line bg-ink/85 px-2 py-1 font-mono text-[8px] tracking-wider text-pd-muted">
        z12 &middot; GWINNETT CO
      </div>
    </>
  );
}
