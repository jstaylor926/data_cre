"use client";

import { useAppStore } from "@/store/useAppStore";

export default function WaterTab() {
  const dcScore = useAppStore((s) => s.dcScore);
  const dcInfrastructure = useAppStore((s) => s.dcInfrastructure);
  const dcMwTarget = useAppStore((s) => s.dcMwTarget);

  if (!dcInfrastructure) {
    return (
      <div className="flex items-center justify-center p-8 text-mid font-mono text-[10px]">
        Select a parcel to load water data
      </div>
    );
  }

  // Cooling requirement estimate: ~2 gallons per kWh × PUE 1.4 × MW
  const dailyCoolingMGD = dcMwTarget * 24 * 2 * 1.4 / 1_000_000;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Water Score */}
      {dcScore && !dcScore.disqualified && (
        <div className="flex items-center justify-between rounded border border-line2 bg-ink3 px-3 py-2">
          <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-orange-400">Water Score</span>
          <span className="font-head text-2xl text-teal">
            {dcScore.water}<sup className="font-mono text-[10px] text-pd-muted">/20</sup>
          </span>
        </div>
      )}

      {/* Cooling demand estimate */}
      <div>
        <div className="mb-2 border-b border-line pb-1 font-mono text-[8px] uppercase tracking-[0.14em] text-pd-muted">
          Cooling Demand Estimate · {dcMwTarget}MW
        </div>
        <div className="space-y-0">
          <div className="flex justify-between border-b border-line py-1.5">
            <span className="font-mono text-[9px] uppercase text-mid">IT Load</span>
            <span className="font-mono text-[10px] text-bright">{dcMwTarget} MW</span>
          </div>
          <div className="flex justify-between border-b border-line py-1.5">
            <span className="font-mono text-[9px] uppercase text-mid">PUE Assumption</span>
            <span className="font-mono text-[10px] text-bright">1.4</span>
          </div>
          <div className="flex justify-between border-b border-line py-1.5">
            <span className="font-mono text-[9px] uppercase text-mid">Est. Cooling Water</span>
            <span className="font-mono text-[10px] text-bright">{dailyCoolingMGD.toFixed(2)} MGD</span>
          </div>
        </div>
        <p className="mt-1.5 font-mono text-[8px] text-pd-muted">
          Estimate assumes water-cooled CRAC/CRAH. Air-side economizer reduces demand ~40%.
        </p>
      </div>

      {/* Water system integration notice */}
      <div className="rounded-lg border border-teal/20 bg-teal/5 p-3">
        <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.12em] text-teal">
          Water System Data
        </div>
        <p className="font-mono text-[9px] leading-relaxed text-mid">
          Utility water system capacity (MGD), source type, and industrial supply tiers
          require direct coordination with the local municipal utility or county water authority.
        </p>
        <p className="mt-2 font-mono text-[8px] text-mid/70">
          EPA SDWIS integration planned for Phase 3.2 — will provide public water system
          boundaries and capacity ratings automatically.
        </p>
      </div>

      {/* Gwinnett guidance */}
      <div className="rounded border border-line2 bg-ink3 p-3">
        <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.12em] text-pd-muted">
          Gwinnett County Water Resources
        </div>
        <p className="font-mono text-[9px] leading-relaxed text-mid">
          Gwinnett County Department of Water Resources serves most of the county.
          Lake Lanier and Lake Varner provide primary supply at ~60 MGD treatment capacity.
          Industrial allocation requests require ~90 day review.
        </p>
      </div>
    </div>
  );
}
