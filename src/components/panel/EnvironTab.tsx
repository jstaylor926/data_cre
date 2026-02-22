"use client";

import { useAppStore } from "@/store/useAppStore";
import type { EnvFlag } from "@/lib/types";

function FlagCard({ flag }: { flag: EnvFlag }) {
  const styles = {
    critical: { dot: "bg-red", border: "border-red/35 bg-red/5", title: "text-red", text: "text-mid" },
    warning:  { dot: "bg-amber", border: "border-amber/20 bg-amber/5", title: "text-amber", text: "text-mid" },
    clear:    { dot: "bg-green-400", border: "border-green-500/15 bg-green-500/5", title: "text-green-400", text: "text-mid" },
  }[flag.type];

  return (
    <div className={`flex gap-2.5 rounded border p-2.5 ${styles.border}`}>
      <div className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot}`} />
      <div>
        <div className={`font-mono text-[8px] font-medium uppercase tracking-wider mb-0.5 ${styles.title}`}>
          {flag.label}
        </div>
        <p className={`font-mono text-[9px] leading-relaxed ${styles.text}`}>{flag.description}</p>
        {flag.source && (
          <p className={`mt-1 font-mono text-[7px] ${styles.title} opacity-60`}>Source: {flag.source}</p>
        )}
      </div>
    </div>
  );
}

export default function EnvironTab() {
  const dcScore = useAppStore((s) => s.dcScore);
  const dcInfrastructure = useAppStore((s) => s.dcInfrastructure);

  if (!dcInfrastructure) {
    return (
      <div className="flex items-center justify-center p-8 text-mid font-mono text-[10px]">
        Select a parcel to load environmental data
      </div>
    );
  }

  const flags = dcInfrastructure.envFlags;
  const hasCritical = flags.some((f) => f.type === "critical");

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Disqualified hero */}
      {hasCritical && dcScore?.disqualified && (
        <div className="rounded-lg border border-red/35 bg-red/5 p-4 text-center">
          <div className="font-head text-4xl leading-none text-red tracking-wide">DISQUALIFIED</div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-red/70">
            Critical Environmental Condition
          </div>
          <p className="mt-2 font-mono text-[9px] leading-relaxed text-mid">
            Score suppressed — data center insurance cannot be written at this location.
          </p>
        </div>
      )}

      {/* Environ score */}
      {dcScore && !dcScore.disqualified && (
        <div className="flex items-center justify-between rounded border border-line2 bg-ink3 px-3 py-2">
          <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-orange-400">
            Environmental Score
          </span>
          <span className="font-head text-2xl text-green-400">
            {dcScore.environ}<sup className="font-mono text-[10px] text-pd-muted">/10</sup>
          </span>
        </div>
      )}

      {/* Flood zone info */}
      <div>
        <div className="mb-2 border-b border-line pb-1 font-mono text-[8px] uppercase tracking-[0.14em] text-pd-muted">
          FEMA Flood Zone
        </div>
        {dcInfrastructure.floodZone ? (
          <div className="flex items-center justify-between rounded border border-line2 bg-ink3 px-3 py-2">
            <span className="font-mono text-[9px] text-mid">Zone</span>
            <span className={`font-mono text-[11px] font-medium ${hasCritical ? "text-red" : "text-green-400"}`}>
              {dcInfrastructure.floodZone}
              {dcInfrastructure.floodZoneSubtype ? ` · ${dcInfrastructure.floodZoneSubtype}` : ""}
            </span>
          </div>
        ) : (
          <p className="font-mono text-[9px] text-mid">FEMA zone data unavailable for this location.</p>
        )}
      </div>

      {/* All flags */}
      <div>
        <div className="mb-2 border-b border-line pb-1 font-mono text-[8px] uppercase tracking-[0.14em] text-pd-muted">
          Environmental Flags · All ({flags.length})
        </div>
        {flags.length === 0 ? (
          <div className="flex gap-2.5 rounded border border-green-500/15 bg-green-500/5 p-2.5">
            <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
            <div>
              <div className="font-mono text-[8px] font-medium uppercase tracking-wider text-green-400 mb-0.5">
                Clear · No Issues Found
              </div>
              <p className="font-mono text-[9px] text-mid leading-relaxed">
                No FEMA flood zone concerns identified at this location.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {flags.map((flag) => <FlagCard key={flag.code} flag={flag} />)}
          </div>
        )}
      </div>

      {/* Static clear flags for MVP */}
      <div className="space-y-2">
        <FlagCard flag={{
          type: "clear",
          code: "NWI_CHECK",
          label: "Wetlands",
          description: "National Wetlands Inventory integration — Phase 3.2",
          source: "USFWS NWI",
        }} />
        <FlagCard flag={{
          type: "clear",
          code: "EPA_FRS",
          label: "EPA Contamination",
          description: "EPA Facility Registry Service proximity check — Phase 3.2",
          source: "EPA FRS",
        }} />
      </div>
    </div>
  );
}
