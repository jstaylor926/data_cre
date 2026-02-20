"use client";

import { X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { BaseMapStyle } from "@/lib/types";

interface LayerControlPopupProps {
  onClose: () => void;
}

const BASE_MAP_OPTIONS: { value: BaseMapStyle; label: string }[] = [
  { value: "streets", label: "Street" },
  { value: "satellite", label: "Satellite" },
  { value: "hybrid", label: "Hybrid" },
];

export default function LayerControlPopup({ onClose }: LayerControlPopupProps) {
  const baseMapStyle = useAppStore((s) => s.baseMapStyle);
  const showParcels = useAppStore((s) => s.showParcels);
  const showZoning = useAppStore((s) => s.showZoning);
  const setBaseMapStyle = useAppStore((s) => s.setBaseMapStyle);
  const toggleParcels = useAppStore((s) => s.toggleParcels);
  const toggleZoning = useAppStore((s) => s.toggleZoning);

  return (
    <div className="w-52 rounded-lg border border-line2 bg-ink2 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-pd-muted">
          Map Layers
        </span>
        <button
          onClick={onClose}
          className="flex h-5 w-5 items-center justify-center rounded text-pd-muted hover:text-bright"
        >
          <X size={12} />
        </button>
      </div>

      {/* Base map */}
      <div className="border-b border-line px-3 py-2.5">
        <p className="mb-2 font-mono text-[8px] uppercase tracking-wider text-pd-muted">
          Base Map
        </p>
        <div className="flex gap-1.5">
          {BASE_MAP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setBaseMapStyle(opt.value)}
              className={`flex-1 rounded px-2 py-1.5 font-mono text-[9px] transition-colors ${
                baseMapStyle === opt.value
                  ? "border border-teal bg-teal-dim text-teal"
                  : "border border-line text-mid hover:border-line2 hover:text-bright"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overlays */}
      <div className="px-3 py-2.5">
        <p className="mb-2 font-mono text-[8px] uppercase tracking-wider text-pd-muted">
          Overlays
        </p>
        <div className="flex flex-col gap-2">
          <ToggleRow
            label="Parcel Boundaries"
            checked={showParcels}
            onToggle={toggleParcels}
          />
          <ToggleRow
            label="Zoning Overlay"
            checked={showZoning}
            onToggle={toggleZoning}
          />
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between rounded px-1 py-0.5 text-left transition-colors hover:bg-ink3"
    >
      <span className="font-mono text-[10px] text-text">{label}</span>
      <div
        className={`h-4 w-7 rounded-full transition-colors ${
          checked ? "bg-teal" : "bg-ink4"
        } relative`}
      >
        <div
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-bright transition-transform ${
            checked ? "translate-x-3.5" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}
