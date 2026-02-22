"use client";
/**
 * ComparisonTray — bottom-docked strip showing up to 4 sites queued for comparison.
 * Clicking "Compare" opens the full-screen ComparisonTable overlay.
 */

import { useState } from "react";
import { X, GitCompare, ChevronUp } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import ComparisonTable from "./ComparisonTable";

export default function ComparisonTray() {
  const dcComparisonTray = useAppStore((s) => s.dcComparisonTray);
  const removeFromComparison = useAppStore((s) => s.removeFromComparison);
  const clearComparison = useAppStore((s) => s.clearComparison);
  const [tableOpen, setTableOpen] = useState(false);

  // Only render if there are sites in the tray
  if (dcComparisonTray.length === 0) return null;

  return (
    <>
      {/* Tray bar */}
      <div className="absolute bottom-0 left-0 right-0 z-40 border-t border-orange-500/30 bg-ink/95 backdrop-blur-sm">
        <div className="flex items-center gap-2 px-4 py-2">
          {/* Label */}
          <div className="flex items-center gap-1.5 shrink-0">
            <GitCompare size={12} className="text-orange-400" />
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-orange-400">
              Compare · {dcComparisonTray.length}/4
            </span>
          </div>

          {/* Site chips */}
          <div className="flex flex-1 gap-2 overflow-x-auto">
            {dcComparisonTray.map((site) => (
              <div
                key={site.apn}
                className="flex shrink-0 items-center gap-1.5 rounded border border-orange-500/30 bg-orange-500/10 px-2 py-1"
              >
                <div className="flex flex-col min-w-0">
                  <span className="max-w-[100px] truncate font-mono text-[8px] text-bright leading-none">
                    {site.address.split(",")[0]}
                  </span>
                  <span className="font-mono text-[7px] text-orange-400 leading-none mt-0.5">
                    {site.dcScore.composite} pts
                    {site.dcScore.disqualified && " · DISQ"}
                  </span>
                </div>
                <button
                  onClick={() => removeFromComparison(site.apn)}
                  className="ml-1 text-pd-muted hover:text-mid transition-colors"
                  aria-label="Remove"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => clearComparison()}
              className="font-mono text-[8px] uppercase tracking-wider text-pd-muted hover:text-mid transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setTableOpen(true)}
              disabled={dcComparisonTray.length < 2}
              className="flex h-7 items-center gap-1 rounded border border-orange-400/60 bg-orange-500/10 px-3 font-mono text-[9px] uppercase tracking-wider text-orange-400 transition-colors hover:bg-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronUp size={10} />
              Compare
            </button>
          </div>
        </div>
      </div>

      {/* Full-screen comparison table overlay */}
      {tableOpen && (
        <ComparisonTable onClose={() => setTableOpen(false)} />
      )}
    </>
  );
}
