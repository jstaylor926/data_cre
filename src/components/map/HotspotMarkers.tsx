"use client";

import { Marker } from "react-map-gl/mapbox";
import { useAppStore } from "@/store/useAppStore";
import {
  DC_HOTSPOT_MARKETS,
  getHotspotTier,
  type DCHotspotMarket,
} from "@/lib/dc-hotspot-markets";
import { HOTSPOT_ZOOM_THRESHOLD, HOTSPOT_FLY_ZOOM } from "@/lib/constants";
import { Server } from "lucide-react";
import { cn } from "@/lib/utils";

interface HotspotMarkersProps {
  onFlyTo: (lng: number, lat: number, zoom?: number) => void;
}

export default function HotspotMarkers({ onFlyTo }: HotspotMarkersProps) {
  const appMode = useAppStore((s) => s.appMode);
  const viewportZoom = useAppStore((s) => s.viewportZoom);

  if (appMode !== "datacenter") return null;

  // Fade out markers as user zooms in past the threshold
  const opacity = viewportZoom > HOTSPOT_ZOOM_THRESHOLD ? 0 : 1;

  return (
    <>
      {DC_HOTSPOT_MARKETS.map((market) => (
        <Marker
          key={`hotspot-${market.id}`}
          longitude={market.center[0]}
          latitude={market.center[1]}
          anchor="center"
        >
          <HotspotPin
            market={market}
            opacity={opacity}
            onClick={() =>
              onFlyTo(market.center[0], market.center[1], HOTSPOT_FLY_ZOOM)
            }
          />
        </Marker>
      ))}
    </>
  );
}

function HotspotPin({
  market,
  opacity,
  onClick,
}: {
  market: DCHotspotMarket;
  opacity: number;
  onClick: () => void;
}) {
  const tier = getHotspotTier(market.dcScore);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{ opacity, transition: "opacity 300ms ease" }}
      className={cn(
        "group flex flex-col items-center gap-0.5",
        "cursor-pointer transition-transform hover:scale-110",
      )}
      title={`${market.name}, ${market.state} — Score: ${market.dcScore} (${tier})`}
    >
      {/* Pin icon */}
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border-2",
          "border-orange-400 bg-orange-500/20 shadow-lg shadow-orange-500/20",
          "group-hover:border-orange-300 group-hover:bg-orange-500/30",
        )}
      >
        <Server size={14} className="text-orange-400" />
      </div>

      {/* Label */}
      <div className="rounded bg-ink/90 px-1.5 py-0.5 backdrop-blur-sm">
        <span className="whitespace-nowrap font-mono text-[8px] font-semibold text-bright">
          {market.name}
        </span>
      </div>
    </button>
  );
}
