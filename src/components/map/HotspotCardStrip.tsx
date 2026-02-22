"use client";

import { useAppStore } from "@/store/useAppStore";
import {
  DC_HOTSPOT_MARKETS_RANKED,
  getHotspotTier,
  type DCHotspotMarket,
} from "@/lib/dc-hotspot-markets";
import { HOTSPOT_ZOOM_THRESHOLD } from "@/lib/constants";
import { Server, Zap, Wifi, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HotspotCardStripProps {
  onFlyTo: (lng: number, lat: number, zoom?: number) => void;
}

export default function HotspotCardStrip({ onFlyTo }: HotspotCardStripProps) {
  const appMode = useAppStore((s) => s.appMode);
  const viewportZoom = useAppStore((s) => s.viewportZoom);
  const hotspotCardsCollapsed = useAppStore((s) => s.hotspotCardsCollapsed);

  // Only show in datacenter mode, when zoomed out, and not manually collapsed
  if (appMode !== "datacenter") return null;
  if (viewportZoom > HOTSPOT_ZOOM_THRESHOLD || hotspotCardsCollapsed) return null;

  return (
    <div className="absolute left-0 right-0 top-14 z-10 px-3">
      {/* Header */}
      <div className="mb-1.5 flex items-center gap-2 px-1">
        <Server size={12} className="text-orange-400" />
        <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-mid">
          Top DC Markets
        </span>
        <span className="font-mono text-[8px] text-pd-muted">
          Southern US
        </span>
      </div>

      {/* Scrollable card strip */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {DC_HOTSPOT_MARKETS_RANKED.map((market) => (
          <HotspotCard key={market.id} market={market} onFlyTo={onFlyTo} />
        ))}
      </div>
    </div>
  );
}

function HotspotCard({
  market,
  onFlyTo,
}: {
  market: DCHotspotMarket;
  onFlyTo: (lng: number, lat: number, zoom?: number) => void;
}) {
  const tier = getHotspotTier(market.dcScore);
  const tierColor =
    market.dcScore >= 85
      ? "text-teal border-teal/40 bg-teal/10"
      : market.dcScore >= 70
        ? "text-emerald-400 border-emerald-400/40 bg-emerald-400/10"
        : "text-amber border-amber/40 bg-amber/10";

  return (
    <button
      onClick={() => onFlyTo(market.center[0], market.center[1], 12)}
      className={cn(
        "group flex shrink-0 cursor-pointer items-start gap-2.5",
        "w-[210px] rounded-lg border border-line2 bg-ink/95 p-3",
        "backdrop-blur-sm transition-all",
        "hover:border-teal/60 hover:shadow-lg hover:shadow-teal/10",
      )}
    >
      {/* Score badge */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-full border-2",
          tierColor,
        )}
      >
        <span className="font-mono text-sm font-bold leading-none">
          {market.dcScore}
        </span>
        <span className="font-mono text-[6px] uppercase leading-none opacity-70">
          {tier}
        </span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-1.5">
          <h4 className="truncate font-mono text-[11px] font-semibold text-bright">
            {market.name}
          </h4>
          <span className="shrink-0 rounded bg-ink3 px-1 py-px font-mono text-[7px] uppercase text-pd-muted">
            {market.state}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 font-mono text-[8px] leading-tight text-mid">
          {market.rationale}
        </p>

        {/* Breakdown mini-badges */}
        <div className="mt-1.5 flex items-center gap-1">
          <span className="flex items-center gap-0.5 rounded bg-orange-500/10 px-1 py-0.5 font-mono text-[7px] text-orange-400">
            <Zap size={7} />
            {market.breakdown.power}
          </span>
          <span className="flex items-center gap-0.5 rounded bg-sky-500/10 px-1 py-0.5 font-mono text-[7px] text-sky-400">
            <Wifi size={7} />
            {market.breakdown.fiber}
          </span>
          <ChevronRight
            size={10}
            className="ml-auto text-pd-muted opacity-0 transition-opacity group-hover:opacity-100"
          />
        </div>
      </div>
    </button>
  );
}
