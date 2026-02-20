"use client";

import { X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import PanelContent from "./PanelContent";

export default function ParcelPanel() {
  const clearSelection = useAppStore((s) => s.clearSelection);

  return (
    <div className="absolute right-0 top-0 bottom-0 z-20 flex w-[380px] flex-col border-l border-line bg-ink/97 animate-in slide-in-from-right duration-200">
      {/* Close button */}
      <button
        onClick={clearSelection}
        className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded text-pd-muted transition-colors hover:text-bright"
      >
        <X size={14} />
      </button>

      <PanelContent />
    </div>
  );
}
