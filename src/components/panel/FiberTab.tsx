"use client";

import { useAppStore } from "@/store/useAppStore";

export default function FiberTab() {
  const dcScore = useAppStore((s) => s.dcScore);
  const dcInfrastructure = useAppStore((s) => s.dcInfrastructure);

  if (!dcInfrastructure) {
    return (
      <div className="flex items-center justify-center p-8 text-mid font-mono text-[10px]">
        Select a parcel to load fiber data
      </div>
    );
  }

  const carriers = dcInfrastructure.fiberCarriers;
  const tieDistance = dcInfrastructure.tieDistance;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Fiber Score */}
      {dcScore && !dcScore.disqualified && (
        <div className="flex items-center justify-between rounded border border-line2 bg-ink3 px-3 py-2">
          <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-orange-400">Fiber Score</span>
          <span className="font-head text-2xl text-orange-400">
            {dcScore.fiber}<sup className="font-mono text-[10px] text-pd-muted">/30</sup>
          </span>
        </div>
      )}

      {/* Fiber Carriers */}
      <div>
        <div className="mb-2 border-b border-line pb-1 font-mono text-[8px] uppercase tracking-[0.14em] text-pd-muted">
          Fiber Carriers ({carriers.length})
        </div>
        {carriers.length === 0 ? (
          <p className="font-mono text-[9px] text-mid">
            No fiber providers found at this location via FCC BDC.
          </p>
        ) : (
          <div className="space-y-1.5">
            {carriers.map((carrier) => (
              <div key={carrier} className="flex items-center gap-2 rounded border border-line2 bg-ink3 px-3 py-2">
                <div className="h-1.5 w-1.5 rounded-full bg-teal" />
                <span className="font-mono text-[10px] text-bright">{carrier}</span>
                <span className="ml-auto font-mono text-[8px] text-teal">Fiber</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TIE Distance */}
      {tieDistance !== null && (
        <div>
          <div className="mb-2 border-b border-line pb-1 font-mono text-[8px] uppercase tracking-[0.14em] text-pd-muted">
            Internet Exchange
          </div>
          <div className="flex items-center justify-between rounded border border-line2 bg-ink3 px-3 py-2">
            <div>
              <div className="font-mono text-[9px] text-bright">TIE Atlanta</div>
              <div className="font-mono text-[8px] text-mid">55 Marietta St NW, Atlanta</div>
            </div>
            <span className={`font-mono text-[11px] font-medium ${
              tieDistance <= 10 ? "text-green-400" : tieDistance <= 25 ? "text-bright" : "text-amber"
            }`}>
              {tieDistance.toFixed(1)}mi
            </span>
          </div>
          <p className="mt-1.5 font-mono text-[8px] text-mid">
            {tieDistance <= 10
              ? "Excellent proximity — latency suitable for colocation and CDN deployments."
              : tieDistance <= 25
                ? "Acceptable distance — latency margins viable for most enterprise workloads."
                : "High latency risk — evaluate edge caching strategy for latency-sensitive workloads."
            }
          </p>
        </div>
      )}

      {/* Backbone note */}
      <div className="rounded border border-line2 bg-ink3 p-3">
        <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.12em] text-pd-muted">
          Backbone Data
        </div>
        <p className="font-mono text-[9px] text-mid leading-relaxed">
          Long-haul backbone presence (AT&T, Lumen, Zayo, Cogent) requires on-site survey.
          FCC BDC data reflects last-mile fiber availability only.
        </p>
      </div>
    </div>
  );
}
