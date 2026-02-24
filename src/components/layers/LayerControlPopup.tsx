"use client";

import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { X, Map as MapIcon, Satellite, Grid3X3 } from "lucide-react";
import type { BaseMapStyle } from "@/lib/types";

interface LayerControlPopupProps {
  onClose: () => void;
}

export function LayerControlPopup({ onClose }: LayerControlPopupProps) {
  const baseMapStyle = useAppStore((s) => s.baseMapStyle);
  const setBaseMapStyle = useAppStore((s) => s.setBaseMapStyle);
  const showParcels = useAppStore((s) => s.showParcels);
  const showZoning = useAppStore((s) => s.showZoning);
  const showSubstations = useAppStore((s) => s.showSubstations);
  const showTxLines = useAppStore((s) => s.showTxLines);
  const showFiber = useAppStore((s) => s.showFiber);
  const showFloodZones = useAppStore((s) => s.showFloodZones);
  const toggleParcels = useAppStore((s) => s.toggleParcels);
  const toggleZoning = useAppStore((s) => s.toggleZoning);
  const toggleSubstations = useAppStore((s) => s.toggleSubstations);
  const toggleTxLines = useAppStore((s) => s.toggleTxLines);
  const toggleFiber = useAppStore((s) => s.toggleFiber);
  const toggleFloodZones = useAppStore((s) => s.toggleFloodZones);

  const baseMaps: { key: BaseMapStyle; label: string; icon: typeof MapIcon }[] = [
    { key: "streets", label: "Dark", icon: MapIcon },
    { key: "satellite", label: "Satellite", icon: Satellite },
    { key: "hybrid", label: "Hybrid", icon: Grid3X3 },
  ];

  const overlays = [
    { label: "Parcels", active: showParcels, toggle: toggleParcels },
    { label: "Zoning", active: showZoning, toggle: toggleZoning },
    { label: "Substations", active: showSubstations, toggle: toggleSubstations },
    { label: "TX Lines", active: showTxLines, toggle: toggleTxLines },
    { label: "Fiber", active: showFiber, toggle: toggleFiber },
    { label: "Flood Zones", active: showFloodZones, toggle: toggleFloodZones },
  ];

  return (
    <div className="absolute top-16 right-4 z-50 w-64 bg-zinc-900/95 border border-zinc-700 rounded-lg p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-200">Map Layers</h3>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5 text-zinc-400" />
        </Button>
      </div>

      {/* Base Map */}
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Base Map</p>
        <div className="flex gap-2">
          {baseMaps.map((bm) => (
            <button
              key={bm.key}
              onClick={() => setBaseMapStyle(bm.key)}
              className={`flex-1 py-1.5 px-2 rounded text-xs border transition-colors ${
                baseMapStyle === bm.key
                  ? "bg-teal-600/20 border-teal-500 text-teal-400"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {bm.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overlays */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Overlays</p>
        <div className="space-y-1.5">
          {overlays.map((o) => (
            <button
              key={o.label}
              onClick={o.toggle}
              className={`w-full flex items-center gap-2 py-1.5 px-2 rounded text-xs transition-colors ${
                o.active
                  ? "bg-zinc-800 text-teal-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <div
                className={`h-2.5 w-2.5 rounded-sm border ${
                  o.active
                    ? "bg-teal-500 border-teal-400"
                    : "border-zinc-600"
                }`}
              />
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
