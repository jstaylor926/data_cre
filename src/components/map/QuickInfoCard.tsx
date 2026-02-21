"use client";

import { Marker } from "react-map-gl/mapbox";
import { useAppStore } from "@/store/useAppStore";
import { useResponsive } from "@/hooks/useResponsive";
import { formatAcres } from "@/lib/formatters";
import { X, ChevronRight } from "lucide-react";

/**
 * Quick-info card that appears when tapping a parcel on the map.
 * Shows instant preview data (address, PIN, acreage) from the GeoJSON feature.
 * User taps "View Details" to open the full panel and trigger an API fetch.
 *
 * Desktop: geo-anchored floating card above the parcel centroid.
 * Mobile: fixed compact bar at the bottom of the screen.
 */
export default function QuickInfoCard() {
  const quickCardData = useAppStore((s) => s.quickCardData);
  const openFullPanel = useAppStore((s) => s.openFullPanel);
  const dismissQuickCard = useAppStore((s) => s.dismissQuickCard);
  const { isMobile } = useResponsive();

  if (!quickCardData) return null;

  const { pin, address, acres, lngLat } = quickCardData;

  // Mobile: fixed bottom bar
  if (isMobile) {
    return (
      <div className="fixed bottom-14 left-3 right-3 z-20 animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center gap-3 rounded-xl border border-line bg-ink/95 px-4 py-3 shadow-2xl backdrop-blur-sm">
          {/* Content */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-bright">
              {address || "Unknown Address"}
            </p>
            <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-pd-muted">
              {pin} &middot; {formatAcres(acres)}
            </p>
          </div>

          {/* View Details button */}
          <button
            onClick={openFullPanel}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-teal/15 px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-wider text-teal transition-colors hover:bg-teal/25"
          >
            Details
            <ChevronRight className="h-3 w-3" />
          </button>

          {/* Dismiss */}
          <button
            onClick={dismissQuickCard}
            className="shrink-0 p-1 text-mid transition-colors hover:text-bright"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Desktop: geo-anchored card via Mapbox Marker
  return (
    <Marker
      longitude={lngLat[0]}
      latitude={lngLat[1]}
      anchor="bottom"
      offset={[0, -8]}
    >
      <div className="w-[220px] animate-in fade-in zoom-in-95 duration-150">
        <div className="rounded-xl border border-line bg-ink/95 p-3 shadow-2xl backdrop-blur-sm">
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              dismissQuickCard();
            }}
            className="absolute right-2 top-2 p-0.5 text-mid transition-colors hover:text-bright"
          >
            <X className="h-3 w-3" />
          </button>

          {/* Content */}
          <p className="pr-4 text-[12px] font-semibold leading-tight text-bright">
            {address || "Unknown Address"}
          </p>
          <div className="mt-1.5 flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-pd-muted">
            <span>{pin}</span>
            <span className="text-line">&middot;</span>
            <span>{formatAcres(acres)}</span>
          </div>

          {/* View Details button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openFullPanel();
            }}
            className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-teal/15 px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-wider text-teal transition-colors hover:bg-teal/25"
          >
            View Details
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {/* Arrow pointing down to parcel */}
        <div className="flex justify-center">
          <div className="h-0 w-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-line" />
        </div>
      </div>
    </Marker>
  );
}
