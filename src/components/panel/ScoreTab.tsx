"use client";

import { useAppStore } from "@/store/useAppStore";
import { useSiteScore } from "@/hooks/useSiteScore";

export default function ScoreTab() {
  const selectedAPN = useAppStore((s) => s.selectedAPN);
  const firmHistory = useAppStore((s) => s.firmHistory);
  const siteScore = useSiteScore(selectedAPN);

  if (!siteScore) {
    return (
      <div className="flex flex-col gap-4 animate-pulse p-2">
        <div className="mx-auto h-20 w-32 rounded bg-ink3" />
        <div className="mx-auto h-4 w-24 rounded bg-ink3" />
        <div className="space-y-3 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-2 w-20 rounded bg-ink3" />
              <div className="h-1.5 flex-1 rounded-full bg-ink3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Score Hero */}
      <div className="text-center py-4">
        <div className="font-head text-7xl tracking-tighter text-bright leading-none">
          {Math.floor(siteScore.composite / 10)}
          <span className="text-violet">{siteScore.composite % 10}</span>
        </div>
        <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-mid mt-1">
          Site Intelligence Score
        </div>
        <div className="mt-2">
          <span className="inline-flex items-center rounded border border-violet bg-violet-dim px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-violet">
            {siteScore.tier}
          </span>
        </div>
        {(siteScore as { narrative?: string }).narrative && (
          <p className="mt-3 px-2 font-mono text-[9px] leading-relaxed text-mid text-left">
            {(siteScore as { narrative?: string }).narrative}
          </p>
        )}
      </div>

      {/* Breakdown */}
      <div>
        <div className="mb-3 border-b border-line pb-1 font-mono text-[8px] uppercase tracking-[0.14em] text-pd-muted">
          Score Breakdown
        </div>
        <div className="space-y-3">
          <ScoreRow label="Zoning" value={siteScore.zoning} max={20} color="bg-green" />
          <ScoreRow label="Market" value={siteScore.market} max={20} color="bg-amber" />
          <ScoreRow label="Infra" value={siteScore.infrastructure} max={20} color="bg-teal" />
          <ScoreRow label="Access" value={siteScore.access} max={20} color="bg-teal" />
          <ScoreRow label="Demo" value={siteScore.demographics} max={20} color="bg-teal" />
        </div>
      </div>

      {/* Firm History */}
      {firmHistory.length > 0 ? (
        <div className="rounded-lg border border-amber/20 bg-amber-dim p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-amber">
              Firm History · Matches
            </span>
            <span className="rounded bg-amber-dim border border-amber/20 px-1.5 py-0.5 font-mono text-[8px] text-amber">
              {firmHistory.length} Matches
            </span>
          </div>
          <div className="space-y-2">
            {firmHistory.map((match) => (
              <div key={match.id} className="rounded border border-line bg-ink3 p-2.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-body text-[11px] font-semibold text-bright">
                    {match.deal_name}
                  </span>
                  <span className={`rounded px-1.5 py-0.5 font-mono text-[8px] uppercase ${
                    match.outcome === "closed" ? "bg-green-dim text-green border border-green/20" :
                    match.outcome === "passed" ? "bg-red-dim text-red border border-red/20" :
                    "bg-amber-dim text-amber border border-amber/20"
                  }`}>
                    {match.outcome}
                  </span>
                </div>
                <p className="font-mono text-[9px] italic leading-relaxed text-mid">
                  {match.excerpt}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-line2 bg-ink3 p-3 text-center">
          <p className="font-mono text-[8px] uppercase tracking-wider text-pd-muted">
            Firm History
          </p>
          <p className="mt-1 font-mono text-[9px] text-mid/60">
            No matching historical deals were found for this parcel yet.
          </p>
        </div>
      )}
    </div>
  );
}

function ScoreRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const percentage = (value / max) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 flex-shrink-0 font-mono text-[9px] uppercase tracking-wider text-mid">
        {label}
      </span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-ink4">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`w-6 flex-shrink-0 text-right font-mono text-[9px] ${
        color === "bg-green" ? "text-green" : color === "bg-amber" ? "text-amber" : "text-bright"
      }`}>
        {value}
      </span>
    </div>
  );
}
