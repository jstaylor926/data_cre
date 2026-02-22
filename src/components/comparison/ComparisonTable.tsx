"use client";
/**
 * ComparisonTable — full-screen overlay comparing up to 4 DC sites.
 * Each column is one site; rows are scoring dimensions.
 * Best value in each row is highlighted green; worst is amber.
 * AI recommendation section streams from /api/dc-brief/compare.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { ComparisonSite } from "@/lib/types";

interface ComparisonTableProps {
  onClose: () => void;
}

type ScoreKey = "composite" | "power" | "fiber" | "water" | "environ";

// Row definitions
const SCORE_ROWS: { key: ScoreKey; label: string; max: number }[] = [
  { key: "composite", label: "Composite Score", max: 100 },
  { key: "power",     label: "Power",            max: 40  },
  { key: "fiber",     label: "Fiber",             max: 30  },
  { key: "water",     label: "Water",             max: 20  },
  { key: "environ",   label: "Environmental",     max: 10  },
];

const INFRA_ROWS: {
  label: string;
  get: (s: ComparisonSite) => string;
  compareNum?: (s: ComparisonSite) => number | null;
  higherIsBetter?: boolean;
}[] = [
  {
    label: "Nearest Sub",
    get: (s) =>
      s.dcScore.nearestSub
        ? `${s.dcScore.nearestSub.voltage}kV · ${s.dcScore.nearestSub.distance.toFixed(1)}mi`
        : "—",
    compareNum: (s) => s.dcScore.nearestSub?.distance ?? null,
    higherIsBetter: false,
  },
  {
    label: "Redundancy",
    get: (s) => (s.dcScore.redundancy ? "Dual-feed" : "Single feed"),
    compareNum: (s) => (s.dcScore.redundancy ? 1 : 0),
    higherIsBetter: true,
  },
  {
    label: "TX Line",
    get: (s) =>
      s.infrastructure?.nearestTxVoltage ? `${s.infrastructure.nearestTxVoltage}kV` : "None",
    compareNum: (s) => s.infrastructure?.nearestTxVoltage ?? 0,
    higherIsBetter: true,
  },
  {
    label: "Fiber Carriers",
    get: (s) => String(s.infrastructure?.fiberCarriers.length ?? 0),
    compareNum: (s) => s.infrastructure?.fiberCarriers.length ?? 0,
    higherIsBetter: true,
  },
  {
    label: "TIE Distance",
    get: (s) =>
      s.infrastructure?.tieDistance != null
        ? `${s.infrastructure.tieDistance.toFixed(1)}mi`
        : "—",
    compareNum: (s) => s.infrastructure?.tieDistance ?? null,
    higherIsBetter: false,
  },
  {
    label: "Flood Zone",
    get: (s) => s.infrastructure?.floodZone ?? "None",
    compareNum: (s) => (s.dcScore.disqualified ? 0 : 1),
    higherIsBetter: true,
  },
  {
    label: "MW Target",
    get: (s) => `${s.mwTarget} MW`,
  },
  {
    label: "Tier",
    get: (s) => (s.dcScore.disqualified ? "DISQUALIFIED" : s.dcScore.tier),
  },
];

function getBestWorst(
  sites: ComparisonSite[],
  getValue: (s: ComparisonSite) => number | null,
  higherIsBetter: boolean
): { best: number | null; worst: number | null } {
  const values = sites
    .map(getValue)
    .filter((v): v is number => v !== null);
  if (values.length < 2) return { best: null, worst: null };
  return {
    best:  higherIsBetter ? Math.max(...values) : Math.min(...values),
    worst: higherIsBetter ? Math.min(...values) : Math.max(...values),
  };
}

export default function ComparisonTable({ onClose }: ComparisonTableProps) {
  const sites = useAppStore((s) => s.dcComparisonTray);
  const [aiRec, setAiRec] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  // Stream AI recommendation
  const fetchRecommendation = useCallback(async () => {
    if (sites.length < 2) return;
    setAiLoading(true);
    setAiRec("");
    setAiError("");
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/dc-brief/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sites }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        setAiError("AI recommendation unavailable");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) setAiRec((prev) => prev + decoder.decode(value));
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setAiError("Failed to generate recommendation");
      }
    } finally {
      setAiLoading(false);
    }
  }, [sites]);

  useEffect(() => {
    fetchRecommendation();
    return () => abortRef.current?.abort();
  }, [fetchRecommendation]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-line px-6 py-3 shrink-0">
        <h2 className="font-head text-xl tracking-wider text-bright">
          SITE COMPARISON
        </h2>
        <span className="font-mono text-[9px] uppercase tracking-wider text-pd-muted">
          {sites.length} sites
        </span>
        <div className="flex-1" />
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded border border-line2 bg-ink3 text-mid hover:text-bright transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Score table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-36 pb-3 pr-4 text-left font-mono text-[8px] uppercase tracking-wider text-pd-muted">
                  Metric
                </th>
                {sites.map((site) => (
                  <th
                    key={site.apn}
                    className={`pb-3 px-3 text-left ${
                      site.dcScore.disqualified
                        ? "border-b-2 border-red/40"
                        : "border-b-2 border-orange-400/40"
                    }`}
                  >
                    <div className="font-semibold text-[12px] text-bright leading-tight">
                      {site.address.split(",")[0]}
                    </div>
                    <div className="mt-0.5 font-mono text-[8px] text-pd-muted">
                      {site.apn}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* ── Score rows ── */}
              {SCORE_ROWS.map((row) => {
                const vals = sites.map((s) =>
                  row.key === "composite" && s.dcScore.disqualified
                    ? null
                    : (s.dcScore[row.key] as number)
                );
                const nums = vals.filter((v): v is number => v !== null);
                const best  = nums.length >= 2 ? Math.max(...nums) : null;
                const worst = nums.length >= 2 ? Math.min(...nums) : null;

                return (
                  <tr key={row.key} className="border-b border-line/50">
                    <td className="py-2 pr-4 font-mono text-[9px] uppercase tracking-wider text-mid">
                      {row.label}
                    </td>
                    {sites.map((site, i) => {
                      const val = vals[i];
                      const isDisq = row.key === "composite" && site.dcScore.disqualified;
                      const isBest  = val !== null && val === best;
                      const isWorst = val !== null && val === worst && val !== best;
                      return (
                        <td key={site.apn} className="px-3 py-2">
                          {isDisq ? (
                            <span className="font-mono text-[10px] font-semibold text-red">
                              DISQ
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              {/* Bar */}
                              <div className="relative h-1 w-16 overflow-hidden rounded-full bg-ink4">
                                <div
                                  className={`h-full rounded-full ${
                                    isBest ? "bg-green-500" : isWorst ? "bg-amber" : "bg-orange-400/50"
                                  }`}
                                  style={{ width: `${((val ?? 0) / row.max) * 100}%` }}
                                />
                              </div>
                              <span
                                className={`font-mono text-[11px] font-medium ${
                                  isBest ? "text-green-400" : isWorst ? "text-amber" : "text-bright"
                                }`}
                              >
                                {val ?? "—"}
                                <span className="text-[8px] text-pd-muted">/{row.max}</span>
                              </span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* Spacer */}
              <tr><td colSpan={sites.length + 1} className="py-2" /></tr>

              {/* ── Infrastructure rows ── */}
              {INFRA_ROWS.map((row) => {
                const { best, worst } = row.compareNum
                  ? getBestWorst(sites, row.compareNum, row.higherIsBetter ?? true)
                  : { best: null, worst: null };

                return (
                  <tr key={row.label} className="border-b border-line/30">
                    <td className="py-1.5 pr-4 font-mono text-[9px] uppercase tracking-wider text-mid">
                      {row.label}
                    </td>
                    {sites.map((site) => {
                      const displayVal = row.get(site);
                      const numVal = row.compareNum?.(site) ?? null;
                      const isBest  = numVal !== null && numVal === best;
                      const isWorst = numVal !== null && numVal === worst && numVal !== best;
                      return (
                        <td key={site.apn} className="px-3 py-1.5">
                          <span
                            className={`font-mono text-[10px] ${
                              isBest ? "text-green-400" : isWorst ? "text-amber" : "text-bright"
                            }`}
                          >
                            {displayVal}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* AI Recommendation */}
        <div className="mt-6 rounded-lg border border-violet/20 bg-violet/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-violet shrink-0" />
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-violet">
              AI Recommendation
            </span>
            {aiLoading && (
              <Loader2 size={10} className="ml-1 animate-spin text-violet/60" />
            )}
          </div>

          {aiError ? (
            <p className="font-mono text-[10px] text-amber">{aiError}</p>
          ) : aiRec ? (
            <p className="font-mono text-[10px] leading-relaxed text-text whitespace-pre-wrap">
              {aiRec}
              {aiLoading && <span className="animate-pulse text-violet">▋</span>}
            </p>
          ) : aiLoading ? (
            <p className="font-mono text-[9px] text-pd-muted animate-pulse">
              Analyzing sites…
            </p>
          ) : (
            <button
              onClick={fetchRecommendation}
              className="font-mono text-[9px] uppercase tracking-wider text-violet hover:text-violet/80 transition-colors"
            >
              Generate Recommendation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
