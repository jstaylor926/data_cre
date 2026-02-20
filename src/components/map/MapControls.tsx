"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Minus, Crosshair, Layers } from "lucide-react";
import LayerControlPopup from "@/components/layers/LayerControlPopup";

interface MapControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onGPS?: () => void;
}

export default function MapControls({ onZoomIn, onZoomOut, onGPS }: MapControlsProps) {
  const [showLayers, setShowLayers] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup on outside click
  useEffect(() => {
    if (!showLayers) return;
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowLayers(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showLayers]);

  return (
    <div className="absolute bottom-6 right-4 z-10 flex flex-col items-end gap-1.5">
      {/* Layer popup */}
      {showLayers && (
        <div ref={popupRef} className="mb-2">
          <LayerControlPopup onClose={() => setShowLayers(false)} />
        </div>
      )}

      <ControlButton icon={<Plus size={14} />} label="Zoom in" onClick={onZoomIn} />
      <ControlButton icon={<Minus size={14} />} label="Zoom out" onClick={onZoomOut} />
      <div className="h-1" />
      <ControlButton icon={<Crosshair size={14} />} label="My location" onClick={onGPS} />
      <ControlButton
        icon={<Layers size={14} />}
        label="Layers"
        onClick={() => setShowLayers((v) => !v)}
        active={showLayers}
      />
    </div>
  );
}

function ControlButton({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded border bg-ink/90 transition-colors ${
        active
          ? "border-teal text-teal"
          : "border-line2 text-mid hover:border-teal hover:text-teal"
      }`}
    >
      {icon}
    </button>
  );
}
