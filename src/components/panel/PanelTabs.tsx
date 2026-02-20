"use client";

import { useAppStore } from "@/store/useAppStore";
import type { PanelTab } from "@/lib/types";

const TABS: { id: PanelTab; label: string; locked?: boolean }[] = [
  { id: "data", label: "Data" },
  { id: "score", label: "Score", locked: true },
  { id: "zoning", label: "Zoning", locked: true },
  { id: "comps", label: "Comps", locked: true },
];

export default function PanelTabs() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  return (
    <div className="flex border-b border-line">
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1 px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              active
                ? "border-b-2 border-teal text-teal"
                : "text-pd-muted hover:text-mid"
            }`}
          >
            {tab.label}
            {tab.locked && (
              <svg
                width="8"
                height="8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="opacity-50"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
