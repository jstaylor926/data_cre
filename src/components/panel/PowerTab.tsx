"use client";

import { useAppStore } from "@/store/useAppStore";
import { effectiveRadius } from "@/lib/dc-scoring";

function voltageColor(v: number) {
  if (v >= 500) return { text: "text-red-400", border: "border-red-400/40", bg: "bg-red-400/10" };
  if (v >= 230) return { text: "text-yellow-400", border: "border-yellow-400/40", bg: "bg-yellow-400/10" };
  if (v >= 115) return { text: "text-green-400", border: "border-green-400/40", bg: "bg-green-400/10" };
  return { text: "text-blue-400", border: "border-blue-400/40", bg: "bg-blue-400/10" };
}

export default function PowerTab() {
  const dcScore = useAppStore((s) => s.dcScore);
  const dcInfrastructure = useAppStore((s) => s.dcInfrastructure);
  const dcMwTarget = useAppStore((s) => s.dcMwTarget);

  if (!dcInfrastructure) {
    return (
      <div className="flex items-center justify-center p-8 text-mid font-mono text-[10px]">
        Select a parcel to load power data
      </div>
    );
  }

  const radius = effectiveRadius(dcMwTarget);
  const subs = dcInfrastructure.substations.slice(0, 8);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Power Score Breakdown */}
      {dcScore && !dcScore.disqualified && (
        <div className="rounded-lg border border-line2 bg-ink3 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-orange-400">
              Power Score
            </span>
            <span className="font-head text-2xl text-green-400">
              {dcScore.power}<sup className="font-mono text-[10px] text-pd-muted">/40</sup>
            </span>
          </div>
          <div className="space-y-1.5">
            <MiniBar label="Sub Distance" note={dcScore.nearestSub ? `${dcScore.nearestSub.distance.toFixed(1)}mi` : "—"} pct={Math.min(1, dcScore.power / 40)} />
            <MiniBar label="Voltage Tier" note={dcScore.nearestSub ? `${dcScore.nearestSub.voltage}kV` : "—"} pct={dcScore.nearestSub ? Math.min(1, dcScore.nearestSub.voltage / 500) : 0} />
            <MiniBar label="Redundancy" note={dcScore.redundancy ? "Dual-feed" : "Single"} pct={dcScore.redundancy ? 1 : 0} />
            <MiniBar
              label="TX Proximity"
              note={dcInfrastructure.nearestTxVoltage ? `${dcInfrastructure.nearestTxVoltage}kV` : "Not found"}
              pct={dcInfrastructure.nearestTxVoltage ? Math.min(1, dcInfrastructure.nearestTxVoltage / 500) : 0}
            />
          </div>
        </div>
      )}

      {/* Substation List */}
      <div>
        <div className="mb-2 border-b border-line pb-1 font-mono text-[8px] uppercase tracking-[0.14em] text-pd-muted">
          Substations Within {radius}mi ({subs.length})
        </div>
        {subs.length === 0 ? (
          <p className="font-mono text-[9px] text-mid p-2">No substations found within {radius}mi.</p>
        ) : (
          <div className="space-y-1.5">
            {subs.map((sub, i) => {
              const vc = voltageColor(sub.voltage);
              const isNearest = i === 0;
              return (
                <div
                  key={sub.id}
                  className={`flex items-center gap-2.5 rounded border p-2 ${
                    isNearest ? `${vc.border} ${vc.bg}` : "border-line2 bg-ink3"
                  }`}
                >
                  <div
                    className={`flex shrink-0 items-center justify-center rounded border text-[7px] ${vc.border} ${vc.bg} ${vc.text}`}
                    style={{ width: Math.max(10, Math.min(18, sub.voltage / 30)), height: Math.max(10, Math.min(18, sub.voltage / 30)) }}
                  >
                    ⚡
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-mono text-[9px] text-bright">{sub.name}</div>
                    <div className="font-mono text-[8px] text-mid">
                      {sub.voltage}kV · {sub.operator?.slice(0, 20)}
                    </div>
                  </div>
                  <div className={`shrink-0 font-mono text-[10px] font-medium ${
                    sub.distance < 2 ? "text-green-400" : sub.distance < 5 ? "text-bright" : "text-mid"
                  }`}>
                    {sub.distance.toFixed(1)}mi
                  </div>
                  {isNearest && <span className="shrink-0 font-mono text-[8px] text-orange-400">★</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Redundancy Analysis */}
      {dcScore && (
        <div className={`rounded-lg border p-3 ${
          dcScore.redundancy
            ? "border-green-500/20 bg-green-500/5"
            : "border-amber/20 bg-amber/5"
        }`}>
          <div className={`mb-1 font-mono text-[8px] uppercase tracking-[0.12em] ${
            dcScore.redundancy ? "text-green-400" : "text-amber"
          }`}>
            Redundancy Analysis
          </div>
          <p className="font-mono text-[9px] leading-relaxed text-text">
            {dcScore.redundancy
              ? `${subs.filter((s) => s.distance <= 5).length} substations within 5mi — dual-feed configuration from separate switching stations is feasible. Meets Tier II redundancy requirement at ${dcMwTarget}MW target.`
              : `Only ${subs.length} substation${subs.length !== 1 ? "s" : ""} found within ${radius}mi. Single-feed configuration — Tier II redundancy requires two substations of different voltage classes within 5mi.`
            }
          </p>
        </div>
      )}
    </div>
  );
}

function MiniBar({ label, note, pct }: { label: string; note: string; pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0 font-mono text-[8px] text-mid">{label}</span>
      <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-ink4">
        <div className="h-full rounded-full bg-green-500 transition-all duration-700" style={{ width: `${pct * 100}%` }} />
      </div>
      <span className="w-16 shrink-0 text-right font-mono text-[8px] text-bright">{note}</span>
    </div>
  );
}
