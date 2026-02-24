"use client";

import { useAppStore } from "@/store/useAppStore";
import {
  ZoomIn,
  ZoomOut,
  Locate,
  Layers,
  Grid3X3,
  MousePointerSquareDashed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useState } from "react";
import { LayerControlPopup } from "@/components/layers/LayerControlPopup";

export default function MapControls() {
  const [showLayers, setShowLayers] = useState(false);
  const { locate } = useGeolocation();
  const assemblageModeActive = useAppStore((s) => s.assemblageModeActive);
  const toggleAssemblageMode = useAppStore((s) => s.toggleAssemblageMode);

  return (
    <>
      <div className="absolute bottom-24 right-4 z-10 flex flex-col gap-2">
        <Button
          size="icon"
          variant="secondary"
          className="h-9 w-9 bg-zinc-900/90 border border-zinc-700 hover:bg-zinc-800"
          onClick={() => {}}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4 text-zinc-300" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-9 w-9 bg-zinc-900/90 border border-zinc-700 hover:bg-zinc-800"
          onClick={() => {}}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4 text-zinc-300" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-9 w-9 bg-zinc-900/90 border border-zinc-700 hover:bg-zinc-800"
          onClick={locate}
          title="My Location"
        >
          <Locate className="h-4 w-4 text-zinc-300" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-9 w-9 bg-zinc-900/90 border border-zinc-700 hover:bg-zinc-800"
          onClick={() => setShowLayers(true)}
          title="Layers"
        >
          <Layers className="h-4 w-4 text-zinc-300" />
        </Button>
        <Button
          size="icon"
          variant={assemblageModeActive ? "default" : "secondary"}
          className={`h-9 w-9 border ${
            assemblageModeActive
              ? "bg-amber-600 border-amber-500 hover:bg-amber-700"
              : "bg-zinc-900/90 border-zinc-700 hover:bg-zinc-800"
          }`}
          onClick={toggleAssemblageMode}
          title="Assemblage Mode (Shift+Click)"
        >
          <MousePointerSquareDashed
            className={`h-4 w-4 ${assemblageModeActive ? "text-white" : "text-zinc-300"}`}
          />
        </Button>
      </div>

      {showLayers && <LayerControlPopup onClose={() => setShowLayers(false)} />}
    </>
  );
}
