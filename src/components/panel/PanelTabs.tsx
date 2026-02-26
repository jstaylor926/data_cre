"use client";

import { useAppStore } from "@/store/useAppStore";
import type { PanelTab } from "@/lib/types";

const TABS: { id: PanelTab; label: string; phase2?: boolean }[] = [
  { id: "data", label: "Data" },
  { id: "score", label: "Score", phase2: true },
  { id: "zoning", label: "Zoning", phase2: true },
  { id: "comps", label: "Comps", phase2: true },
];

export default function PanelTabs() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  return (
    <div className="flex border-b border-line">
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        const accentClass = tab.phase2
          ? "border-violet text-violet"
          : "border-teal text-teal";

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1 px-2 py-2.5 font-mono text-[10px] uppercase tracking-wider transition-colors border-b-2 ${
              active
                ? accentClass
                : "border-transparent text-pd-muted hover:text-mid"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
