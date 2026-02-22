"use client";

import { MapPin, Zap, ChevronRight } from "lucide-react";
import type { SubMarketCandidate } from "@/lib/types";

interface SubMarketCardProps {
  market: SubMarketCandidate;
  rank: number;
  onExplore: (market: SubMarketCandidate) => void;
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 70 ? "text-green-400" : score >= 45 ? "text-orange-400" : "text-amber";
  return (
    <div className={`flex shrink-0 flex-col items-center justify-center rounded-full border-2 ${
      score >= 70 ? "border-green-500/40 bg-green-500/10" :
      score >= 45 ? "border-orange-400/40 bg-orange-400/10" :
      "border-amber/40 bg-amber/10"
    } h-12 w-12`}>
      <span className={`font-head text-lg leading-none ${color}`}>{score}</span>
      <span className="font-mono text-[6px] text-pd-muted">/100</span>
    </div>
  );
}

export default function SubMarketCard({ market, rank, onExplore }: SubMarketCardProps) {
  const voltageLabel = market.maxVoltage ? `${market.maxVoltage}kV` : "—";
  const distLabel = market.nearestSubDistance
    ? `${market.nearestSubDistance.toFixed(1)}mi`
    : "—";

  return (
    <div className="rounded-lg border border-line2 bg-ink3 p-3 hover:border-orange-400/30 transition-colors">
      <div className="flex items-start gap-3">
        {/* Rank + score */}
        <div className="flex shrink-0 flex-col items-center gap-1">
          <span className="font-mono text-[8px] uppercase tracking-wider text-pd-muted">
            #{rank}
          </span>
          <ScoreRing score={market.quickScore} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin size={10} className="shrink-0 text-orange-400" />
            <h3 className="font-mono text-[11px] font-semibold text-bright truncate">
              {market.name}
            </h3>
          </div>

          <p className="font-mono text-[8px] leading-relaxed text-mid line-clamp-2 mb-2">
            {market.rationale}
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-3">
            <StatChip
              icon={<Zap size={8} />}
              label="Max kV"
              value={voltageLabel}
              highlight={!!market.maxVoltage && market.maxVoltage >= 230}
            />
            <StatChip
              label="Subs"
              value={String(market.substationCount)}
              highlight={market.substationCount >= 3}
            />
            <StatChip
              label="Nearest"
              value={distLabel}
              highlight={
                market.nearestSubDistance !== null &&
                market.nearestSubDistance <= 3
              }
            />
            <span className={`ml-auto font-mono text-[7px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${
              market.floodRisk === "low"
                ? "border-green-500/20 text-green-400 bg-green-500/5"
                : market.floodRisk === "moderate"
                ? "border-amber/20 text-amber bg-amber/5"
                : "border-line2 text-pd-muted"
            }`}>
              {market.floodRisk} flood
            </span>
          </div>
        </div>
      </div>

      {/* Explore button */}
      <button
        onClick={() => onExplore(market)}
        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded border border-orange-400/40 bg-orange-500/10 py-1.5 font-mono text-[8px] uppercase tracking-wider text-orange-400 transition-colors hover:bg-orange-500/20"
      >
        Explore this area
        <ChevronRight size={10} />
      </button>
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
  highlight,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {icon && <span className={highlight ? "text-orange-400" : "text-pd-muted"}>{icon}</span>}
      <span className="font-mono text-[7px] text-pd-muted">{label}</span>
      <span className={`font-mono text-[8px] font-medium ${highlight ? "text-bright" : "text-mid"}`}>
        {value}
      </span>
    </div>
  );
}
