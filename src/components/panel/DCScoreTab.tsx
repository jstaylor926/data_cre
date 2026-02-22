"use client";

import { useAppStore } from "@/store/useAppStore";
import { mwTier, effectiveRadius } from "@/lib/dc-scoring";

const MW_MARKS = [1, 10, 50, 100, 500];
const MW_MIN = 1;
const MW_MAX = 500;

// Log scale position 0–1 for the slider track
function mwToPos(mw: number): number {
  return (Math.log(mw) - Math.log(MW_MIN)) / (Math.log(MW_MAX) - Math.log(MW_MIN));
}

function posToMw(pos: number): number {
  return Math.round(Math.exp(pos * (Math.log(MW_MAX) - Math.log(MW_MIN)) + Math.log(MW_MIN)));
}

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 font-mono text-[8px] uppercase tracking-wider text-mid">{label}</span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-ink4">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right font-mono text-[9px] text-bright">
        {value}<span className="text-pd-muted">/{max}</span>
      </span>
    </div>
  );
}

export default function DCScoreTab() {
  const dcScore = useAppStore((s) => s.dcScore);
  const dcInfrastructure = useAppStore((s) => s.dcInfrastructure);
  const dcMwTarget = useAppStore((s) => s.dcMwTarget);
  const setDcMwTarget = useAppStore((s) => s.setDcMwTarget);
  const addToComparison = useAppStore((s) => s.addToComparison);
  const selectedAPN = useAppStore((s) => s.selectedAPN);
  const selectedParcel = useAppStore((s) => s.selectedParcel);

  const loading = !dcScore && !dcInfrastructure;
  const fetchingScore = dcInfrastructure && !dcScore;

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mw = posToMw(Number(e.target.value) / 1000);
    setDcMwTarget(Math.max(1, mw));
  };

  const sliderPos = Math.round(mwToPos(dcMwTarget) * 1000);
  const tier = mwTier(dcMwTarget);
  const radius = effectiveRadius(dcMwTarget);

  // Loading skeleton
  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse p-2">
        <div className="h-16 rounded bg-ink3" />
        <div className="h-32 rounded bg-ink3" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-2 w-20 rounded bg-ink3" />
              <div className="h-1.5 flex-1 rounded bg-ink3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      {/* MW Slider */}
      <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-orange-400">
              Target Capacity
            </div>
            <div className="mt-1.5 flex gap-1.5 flex-wrap">
              {[
                { label: "Edge <1MW", active: dcMwTarget < 1 },
                { label: "Enterprise 10MW", active: dcMwTarget >= 1 && dcMwTarget <= 100 },
                { label: "Hyperscale >100MW", active: dcMwTarget > 100 },
              ].map((t) => (
                <span
                  key={t.label}
                  className={`rounded border px-1.5 py-0.5 font-mono text-[7px] ${
                    t.active
                      ? "border-orange-400 bg-orange-500/10 text-orange-400 font-semibold"
                      : "border-line text-pd-muted"
                  }`}
                >
                  {t.active && "● "}{t.label}
                </span>
              ))}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-head text-3xl leading-none text-orange-400">
              {dcMwTarget}<span className="font-mono text-xs text-mid"> MW</span>
            </div>
            <div className="mt-0.5 font-mono text-[8px] text-mid">{tier} · {radius}mi radius</div>
          </div>
        </div>

        {/* Slider track */}
        <div className="relative">
          <div className="h-2 overflow-hidden rounded-full bg-ink4">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400"
              style={{ width: `${sliderPos / 10}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={1000}
            value={sliderPos}
            onChange={handleSlider}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          {/* Thumb */}
          <div
            className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-orange-400 shadow-lg"
            style={{ left: `${sliderPos / 10}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[7px] text-pd-muted">
          {MW_MARKS.map((m) => <span key={m}>{m}MW</span>)}
        </div>
      </div>

      {/* Score Hero */}
      {fetchingScore ? (
        <div className="flex items-center justify-center gap-2 rounded border border-line2 bg-ink3 p-4">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
          <span className="font-mono text-[9px] text-mid">Computing score…</span>
        </div>
      ) : dcScore?.disqualified ? (
        /* DISQUALIFIED state */
        <div className="rounded-lg border border-red/35 bg-red/5 p-4 text-center">
          <div className="font-head text-4xl tracking-wide text-red leading-none">DISQUALIFIED</div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-red/70">
            Critical Environmental Condition
          </div>
          {dcScore.criticalFlag && (
            <div className="mt-2 font-mono text-[9px] leading-relaxed text-mid">
              {dcScore.criticalFlag.description}
            </div>
          )}
        </div>
      ) : dcScore ? (
        <div className="flex items-center gap-4 rounded-lg border border-line2 bg-ink3 p-3">
          <div className="font-head text-6xl leading-none text-orange-400">{dcScore.composite}</div>
          <div className="flex-1">
            <div className="font-mono text-[8px] uppercase tracking-wider text-mid mb-1">
              Data Center Score · {dcMwTarget}MW
            </div>
            <div className="mb-3 inline-flex items-center rounded border border-orange-400 bg-orange-500/10 px-2 py-0.5">
              <span className="font-mono text-[8px] uppercase tracking-wider text-orange-400">
                {dcScore.tier}
              </span>
            </div>
            <div className="space-y-2">
              <ScoreBar label="Power (40%)" value={dcScore.power} max={40} color="bg-green-500" />
              <ScoreBar label="Fiber (30%)" value={dcScore.fiber} max={30} color="bg-orange-400" />
              <ScoreBar label="Water (20%)" value={dcScore.water} max={20} color="bg-teal" />
              <ScoreBar label="Environ (10%)" value={dcScore.environ} max={10} color="bg-green-500" />
            </div>
          </div>
        </div>
      ) : null}

      {/* Nearest Infrastructure Quick Stats */}
      {dcScore && !dcScore.disqualified && dcInfrastructure && (
        <div>
          <div className="mb-1.5 border-b border-line pb-1 font-mono text-[8px] uppercase tracking-[0.14em] text-pd-muted">
            Nearest Infrastructure
          </div>
          <div className="space-y-0">
            {dcScore.nearestSub && (
              <StatRow label="Nearest Sub" value={`${dcScore.nearestSub.voltage}kV · ${dcScore.nearestSub.distance.toFixed(1)}mi`} highlight={dcScore.nearestSub.distance < 2} />
            )}
            {dcInfrastructure.nearestTxVoltage && (
              <StatRow label="TX Line" value={`${dcInfrastructure.nearestTxVoltage}kV within 5mi`} />
            )}
            {dcInfrastructure.utilityTerritory && (
              <StatRow label="Utility" value={dcInfrastructure.utilityTerritory.slice(0, 28)} />
            )}
            {dcInfrastructure.fiberCarriers.length > 0 && (
              <StatRow label="Fiber Carriers" value={dcInfrastructure.fiberCarriers.slice(0, 3).join(" · ")} />
            )}
            {dcInfrastructure.tieDistance !== null && (
              <StatRow label="TIE Atlanta" value={`${dcInfrastructure.tieDistance.toFixed(1)}mi`} highlight={dcInfrastructure.tieDistance < 10} />
            )}
            <StatRow
              label="Redundancy"
              value={dcScore.redundancy ? "Dual-feed capable" : "Single feed only"}
              highlight={dcScore.redundancy}
              warn={!dcScore.redundancy}
            />
          </div>
        </div>
      )}

      {/* Add to Compare button */}
      {dcScore && !dcScore.disqualified && selectedAPN && selectedParcel && (
        <button
          onClick={() =>
            addToComparison({
              apn: selectedAPN,
              address: selectedParcel.site_address ?? selectedAPN,
              dcScore,
              infrastructure: dcInfrastructure,
              mwTarget: dcMwTarget,
            })
          }
          className="flex h-8 w-full items-center justify-center gap-2 rounded border border-orange-400/40 bg-orange-500/5 font-mono text-[9px] uppercase tracking-wider text-orange-400 transition-colors hover:bg-orange-500/10"
        >
          + Add to Comparison
        </button>
      )}
    </div>
  );
}

function StatRow({
  label, value, highlight, warn,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between border-b border-line py-1.5 last:border-0">
      <span className="font-mono text-[9px] uppercase tracking-wider text-mid">{label}</span>
      <span className={`font-mono text-[10px] ${highlight ? "text-green-400" : warn ? "text-amber" : "text-bright"}`}>
        {value}
      </span>
    </div>
  );
}
