"use client";

import { PANEL_WIDTH } from "@/lib/constants";
import PanelContent from "./PanelContent";

export default function ParcelPanel() {
  return (
    <aside
      className="h-full bg-zinc-950 border-l border-zinc-800 overflow-y-auto shrink-0"
      style={{ width: PANEL_WIDTH }}
    >
      <PanelContent />
    </aside>
  );
}
