"use client";

import { X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { BaseMapStyle } from "@/lib/types";

interface LayerControlPopupProps {
  onClose: () => void;
}

const BASE_MAP_OPTIONS: { value: BaseMapStyle; label: string }[] = [
  { value: "streets", label: "Streets" },
  { value: "satellite", label: "Satellite" },
  { value: "hybrid", label: "Hybrid" },
];

export default function LayerControlPopup({ onClose }: LayerControlPopupProps) {
  const baseMapStyle = useAppStore((s) => s.baseMapStyle);
  const showParcels = useAppStore((s) => s.showParcels);
  const showParcelFill = useAppStore((s) => s.showParcelFill);
  const showZoning = useAppStore((s) => s.showZoning);
  const showSavedPins = useAppStore((s) => s.showSavedPins);
  const showRoadLabels = useAppStore((s) => s.showRoadLabels);
  const setBaseMapStyle = useAppStore((s) => s.setBaseMapStyle);
  const toggleParcels = useAppStore((s) => s.toggleParcels);
  const toggleParcelFill = useAppStore((s) => s.toggleParcelFill);
  const toggleZoning = useAppStore((s) => s.toggleZoning);
  const toggleSavedPins = useAppStore((s) => s.toggleSavedPins);
  const toggleRoadLabels = useAppStore((s) => s.toggleRoadLabels);

  return (
    <div className="w-[170px] rounded-lg border border-line2 bg-ink2/97 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-pd-muted">
          Map Layers
        </span>
        <button
          onClick={onClose}
          className="flex h-5 w-5 items-center justify-center rounded text-pd-muted hover:text-bright"
        >
          <X size={10} />
        </button>
      </div>

      {/* Overlay toggles */}
      <div className="px-3 py-2.5">
        <div className="flex flex-col gap-1">
          <ToggleRow
            label="Parcel Boundaries"
            checked={showParcels}
            onToggle={toggleParcels}
          />
          <ToggleRow
            label="Parcel Fill"
            checked={showParcelFill}
            onToggle={toggleParcelFill}
          />
          <ToggleRow
            label="Zoning Colors"
            checked={showZoning}
            onToggle={toggleZoning}
          />
          <ToggleRow
            label="Saved Pins"
            checked={showSavedPins}
            onToggle={toggleSavedPins}
          />
          <ToggleRow
            label="Road Labels"
            checked={showRoadLabels}
            onToggle={toggleRoadLabels}
          />
        </div>
      </div>

      {/* Base map */}
      <div className="border-t border-line px-3 py-2.5">
        <p className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-pd-muted">
          Base Map
        </p>
        <div className="flex gap-1">
          {BASE_MAP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setBaseMapStyle(opt.value)}
              className={`flex-1 rounded px-1.5 py-1 text-center font-mono text-[8px] transition-colors ${
                baseMapStyle === opt.value
                  ? "border border-teal bg-teal-dim text-teal"
                  : "border border-line text-pd-muted hover:text-bright"
              }`}
            >
              {opt.label}
            </button>
          ))}
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
      className="flex items-center justify-between py-1 text-left"
    >
      <span className="font-mono text-[9px] text-mid">{label}</span>
      <div
        className={`h-[13px] w-6 rounded-full border transition-colors ${
          checked
            ? "border-teal bg-teal-dim"
            : "border-line2 bg-transparent"
        } relative`}
      >
        <div
          className={`absolute top-[1.5px] h-2 w-2 rounded-full transition-transform ${
            checked
              ? "translate-x-[11px] bg-teal"
              : "translate-x-[2px] bg-pd-muted"
          }`}
        />
      </div>
    </button>
  );
}
