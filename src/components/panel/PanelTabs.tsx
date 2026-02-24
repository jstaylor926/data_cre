"use client";

import { useAppStore } from "@/store/useAppStore";
import type { PanelTab } from "@/lib/types";

const TABS: { key: PanelTab; label: string }[] = [
  { key: "data", label: "Data" },
  { key: "score", label: "DC Score" },
  { key: "zoning", label: "Zoning" },
  { key: "power", label: "Power" },
  { key: "fiber", label: "Fiber" },
  { key: "water", label: "Water" },
  { key: "environ", label: "Environ" },
  { key: "comps", label: "Comps" },
];

export default function PanelTabs() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  return (
    <div className="flex border-b border-zinc-800 px-4 overflow-x-auto scrollbar-hide">
      {TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => setActiveTab(t.key)}
          className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
            activeTab === t.key
              ? "border-teal-500 text-teal-400"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
