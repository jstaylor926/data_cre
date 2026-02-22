"use client";

import { useAppStore } from "@/store/useAppStore";
import type { DCPanelTab } from "@/lib/types";

const TABS: { id: DCPanelTab; label: string }[] = [
  { id: "dc-score", label: "DC Score" },
  { id: "power",    label: "Power" },
  { id: "fiber",    label: "Fiber" },
  { id: "water",    label: "Water" },
  { id: "environ",  label: "Environ." },
];

export default function DCPanelTabs() {
  const dcActiveTab = useAppStore((s) => s.dcActiveTab);
  const setDCActiveTab = useAppStore((s) => s.setDCActiveTab);
  const dcScore = useAppStore((s) => s.dcScore);

  return (
    <div className="flex border-b border-line overflow-x-auto">
      {TABS.map((tab) => {
        const active = dcActiveTab === tab.id;
        const isCrit = tab.id === "environ" && dcScore?.disqualified;
        return (
          <button
            key={tab.id}
            onClick={() => setDCActiveTab(tab.id)}
            className={`flex flex-1 min-w-0 items-center justify-center gap-1 px-2 py-2.5 font-mono text-[10px] uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
              active
                ? isCrit
                  ? "border-red text-red"
                  : "border-orange-400 text-orange-400"
                : isCrit
                  ? "border-transparent text-red/60 hover:text-red"
                  : "border-transparent text-pd-muted hover:text-mid"
            }`}
          >
            {tab.label}
            {isCrit && <span className="text-[9px]">⚠</span>}
          </button>
        );
      })}
    </div>
  );
}
