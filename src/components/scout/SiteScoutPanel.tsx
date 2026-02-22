"use client";
/**
 * SiteScoutPanel — the full Site Scout UI.
 *
 * Tier 1 (Open Discovery): User describes project → Claude identifies
 *   sub-markets → HIFLD validates them → ranked results with "Explore" CTA
 *
 * Tier 2 (Area Search): Activated when user explores a sub-market OR when
 *   scout is opened while looking at the map (uses current viewport bbox)
 *
 * Both tiers use SSE streams. Results feed Zustand → map layers update reactively.
 */

import { useCallback, useRef, useState } from "react";
import {
  X, Search, Loader2, Sparkles, MapPin,
  ChevronLeft, Building2, AlertTriangle
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import SubMarketCard from "./SubMarketCard";
import type { SubMarketCandidate, RankedCandidate } from "@/lib/types";

interface SiteScoutPanelProps {
  /** Called when the panel wants the map to fly to a location */
  onFlyTo: (lng: number, lat: number, zoom?: number) => void;
  /** Current map viewport bbox for Tier 2 area search */
  viewportBbox: [number, number, number, number];
}

export default function SiteScoutPanel({ onFlyTo, viewportBbox }: SiteScoutPanelProps) {
  // Individual selectors — never return object literals from useAppStore to avoid
  // the "getSnapshot should be cached" infinite-loop error in React 18+
  const setScoutPanelOpen    = useAppStore((s) => s.setScoutPanelOpen);
  const scoutSession         = useAppStore((s) => s.scoutSession);
  const setScoutQuery        = useAppStore((s) => s.setScoutQuery);
  const setScoutLoading      = useAppStore((s) => s.setScoutLoading);
  const setScoutError        = useAppStore((s) => s.setScoutError);
  const setScoutSubMarkets   = useAppStore((s) => s.setScoutSubMarkets);
  const setScoutCandidates   = useAppStore((s) => s.setScoutCandidates);
  const setScoutActiveSubMarket = useAppStore((s) => s.setScoutActiveSubMarket);
  const appendScoutSummary   = useAppStore((s) => s.appendScoutSummary);
  const resetScout           = useAppStore((s) => s.resetScout);
  const dcMwTarget           = useAppStore((s) => s.dcMwTarget);
  const selectParcel         = useAppStore((s) => s.selectParcel);

  const [inputValue, setInputValue] = useState(scoutSession.query);
  const [statusText, setStatusText] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  // ── Tier 1: Open Discovery ──────────────────────────────────────────────────
  const runDiscover = useCallback(async (query: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setScoutQuery(query);
    setScoutLoading(true);
    setScoutError(null);
    resetScout();
    setScoutQuery(query);
    setScoutLoading(true);
    setStatusText("Starting…");

    try {
      const res = await fetch("/api/dc-scout/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        setScoutError("Discovery request failed. Check your API key.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const { event, data } = JSON.parse(line.slice(6));
            if (event === "status") setStatusText(data);
            if (event === "markets") {
              setScoutSubMarkets(data);
              // Fly to the top market
              if (data.length > 0) {
                onFlyTo(data[0].center[0], data[0].center[1], 10);
              }
            }
            if (event === "summary_chunk") appendScoutSummary(data);
            if (event === "error") setScoutError(data);
            if (event === "done") setScoutLoading(false);
          } catch {
            // malformed chunk — skip
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setScoutError("Connection error — check dev server and API key.");
      }
    } finally {
      setScoutLoading(false);
    }
  }, [setScoutQuery, setScoutLoading, setScoutError, resetScout, setScoutSubMarkets,
      appendScoutSummary, onFlyTo]);

  // ── Tier 2: Area Drill-Down ─────────────────────────────────────────────────
  const runAreaSearch = useCallback(async (
    bbox: [number, number, number, number],
    market?: SubMarketCandidate
  ) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (market) {
      setScoutActiveSubMarket(market);
      onFlyTo(market.center[0], market.center[1], 12);
    }

    setScoutLoading(true);
    setScoutError(null);
    setStatusText("Searching area…");

    try {
      const res = await fetch("/api/dc-scout/area", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bbox, mw: dcMwTarget }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        setScoutError("Area search failed.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const { event, data } = JSON.parse(line.slice(6));
            if (event === "status") setStatusText(data);
            if (event === "quick_results") setScoutCandidates(data);
            if (event === "full_results") setScoutCandidates(data);
            if (event === "summary_chunk") appendScoutSummary(data);
            if (event === "error") setScoutError(data);
            if (event === "done") setScoutLoading(false);
          } catch {
            // skip
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setScoutError("Connection error.");
      }
    } finally {
      setScoutLoading(false);
    }
  }, [dcMwTarget, setScoutLoading, setScoutError, setScoutActiveSubMarket,
      setScoutCandidates, appendScoutSummary, onFlyTo]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = inputValue.trim();
      if (!q) return;
      // If no location context, run Tier 1 discovery; otherwise could run Tier 2
      runDiscover(q);
    },
    [inputValue, runDiscover]
  );

  const handleExploreMarket = useCallback(
    (market: SubMarketCandidate) => {
      runAreaSearch(market.bbox, market);
    },
    [runAreaSearch]
  );

  const handleSearchHere = useCallback(() => {
    runAreaSearch(viewportBbox);
  }, [viewportBbox, runAreaSearch]);

  const handleSelectCandidate = useCallback(
    (candidate: RankedCandidate) => {
      onFlyTo(candidate.centroid[0], candidate.centroid[1], 16);
      selectParcel(candidate.apn);
    },
    [onFlyTo, selectParcel]
  );

  const handleBack = useCallback(() => {
    abortRef.current?.abort();
    setScoutActiveSubMarket(null);
    setScoutCandidates([]);
    setScoutLoading(false);
  }, [setScoutActiveSubMarket, setScoutCandidates, setScoutLoading]);

  const isInAreaMode =
    scoutSession.activeSubMarket !== null || scoutSession.candidates.length > 0;
  const hasSubMarkets = scoutSession.subMarkets.length > 0;
  const hasCandidates = scoutSession.candidates.length > 0;

  return (
    <div className="absolute right-0 top-0 z-30 flex h-full w-[340px] flex-col border-l border-line bg-ink/97 shadow-2xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-orange-500/20 bg-orange-500/5 px-4 py-3">
        {isInAreaMode && (
          <button
            onClick={handleBack}
            className="mr-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border border-line2 text-mid hover:text-bright transition-colors"
          >
            <ChevronLeft size={12} />
          </button>
        )}
        <Sparkles size={13} className="shrink-0 text-orange-400" />
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-400">
            Site Scout
          </div>
          {isInAreaMode && scoutSession.activeSubMarket && (
            <div className="truncate font-mono text-[8px] text-pd-muted">
              {scoutSession.activeSubMarket.name}
            </div>
          )}
        </div>
        <button
          onClick={() => { abortRef.current?.abort(); setScoutPanelOpen(false); }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-line2 text-mid hover:text-bright transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      {/* Query input */}
      {!isInAreaMode && (
        <form onSubmit={handleSubmit} className="shrink-0 border-b border-line px-3 py-3">
          <div className="flex gap-2">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g. 100MW hyperscale near I-85, Georgia, 230kV+"
              className="flex-1 rounded border border-line2 bg-ink3 px-3 py-2 font-mono text-[10px] text-bright placeholder:text-pd-muted focus:border-orange-400/60 focus:outline-none"
              disabled={scoutSession.loading}
            />
            <button
              type="submit"
              disabled={scoutSession.loading || !inputValue.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-orange-400/40 bg-orange-500/10 text-orange-400 transition-colors hover:bg-orange-500/20 disabled:opacity-40"
            >
              {scoutSession.loading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Search size={13} />
              )}
            </button>
          </div>

          {/* "Search current map view" shortcut */}
          <button
            type="button"
            onClick={handleSearchHere}
            disabled={scoutSession.loading}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded border border-line2 py-1.5 font-mono text-[8px] uppercase tracking-wider text-mid transition-colors hover:border-orange-400/30 hover:text-orange-400 disabled:opacity-40"
          >
            <MapPin size={9} />
            Score parcels in current map view
          </button>
        </form>
      )}

      {/* Status ticker */}
      {scoutSession.loading && statusText && (
        <div className="shrink-0 border-b border-line/50 bg-orange-500/5 px-4 py-1.5">
          <div className="flex items-center gap-2">
            <Loader2 size={9} className="shrink-0 animate-spin text-orange-400" />
            <span className="font-mono text-[8px] text-orange-400/70 animate-pulse">
              {statusText}
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {scoutSession.error && (
        <div className="shrink-0 border-b border-red/20 bg-red/5 px-4 py-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={10} className="shrink-0 text-red" />
            <span className="font-mono text-[8px] text-red">{scoutSession.error}</span>
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Tier 2: Candidate parcels ────────────────────────────────────── */}
        {isInAreaMode && (
          <div className="flex flex-col">
            {/* AI summary */}
            {scoutSession.summary && (
              <div className="border-b border-line/50 px-4 py-3">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Sparkles size={9} className="text-orange-400" />
                  <span className="font-mono text-[7px] uppercase tracking-wider text-orange-400">
                    Area Summary
                  </span>
                </div>
                <p className="font-mono text-[9px] leading-relaxed text-text whitespace-pre-wrap">
                  {scoutSession.summary}
                  {scoutSession.loading && (
                    <span className="animate-pulse text-orange-400">▋</span>
                  )}
                </p>
              </div>
            )}

            {/* Candidate list */}
            {hasCandidates ? (
              <div className="divide-y divide-line/30">
                {scoutSession.candidates.map((candidate) => (
                  <CandidateRow
                    key={candidate.apn}
                    candidate={candidate}
                    onSelect={handleSelectCandidate}
                  />
                ))}
              </div>
            ) : scoutSession.loading ? (
              <div className="flex flex-col gap-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-ink3" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 p-8">
                <Building2 size={24} className="text-pd-muted/40" />
                <p className="font-mono text-[9px] text-mid text-center">
                  No viable parcels found in this area.
                  <br />Try a different sub-market or zoom out.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Tier 1: Sub-market results ────────────────────────────────────── */}
        {!isInAreaMode && hasSubMarkets && (
          <div className="flex flex-col gap-3 p-3">
            {/* AI synthesis */}
            {scoutSession.summary && (
              <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Sparkles size={9} className="text-orange-400" />
                  <span className="font-mono text-[7px] uppercase tracking-wider text-orange-400">
                    Scout Report
                  </span>
                </div>
                <p className="font-mono text-[9px] leading-relaxed text-text whitespace-pre-wrap">
                  {scoutSession.summary}
                  {scoutSession.loading && (
                    <span className="animate-pulse text-orange-400">▋</span>
                  )}
                </p>
              </div>
            )}

            {/* Sub-market cards */}
            {scoutSession.subMarkets.map((market, i) => (
              <SubMarketCard
                key={market.id}
                market={market}
                rank={i + 1}
                onExplore={handleExploreMarket}
              />
            ))}
          </div>
        )}

        {/* ── Empty state / prompts ────────────────────────────────────────── */}
        {!isInAreaMode && !hasSubMarkets && !scoutSession.loading && (
          <div className="flex flex-col gap-4 p-4">
            <p className="font-mono text-[9px] leading-relaxed text-mid">
              Describe your data center project and Site Scout will identify the
              best candidate markets — validated with live federal infrastructure data.
            </p>

            <div className="space-y-2">
              <p className="font-mono text-[7px] uppercase tracking-[0.14em] text-pd-muted">
                Example queries
              </p>
              {EXAMPLE_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInputValue(q);
                    runDiscover(q);
                  }}
                  className="w-full rounded border border-line2 bg-ink3 px-3 py-2 text-left font-mono text-[9px] text-mid transition-colors hover:border-orange-400/30 hover:text-bright"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Candidate Row (Tier 2) ────────────────────────────────────────────────────

function CandidateRow({
  candidate,
  onSelect,
}: {
  candidate: RankedCandidate;
  onSelect: (c: RankedCandidate) => void;
}) {
  const score = candidate.dcScore;
  const isDisq = score?.disqualified;
  const scoreVal = score ? (isDisq ? "DISQ" : String(score.composite)) : "—";
  const scoreColor = isDisq
    ? "text-red"
    : score && score.composite >= 70
    ? "text-green-400"
    : score && score.composite >= 45
    ? "text-orange-400"
    : "text-mid";

  return (
    <button
      onClick={() => onSelect(candidate)}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-ink3"
    >
      {/* Rank */}
      <span className="w-4 shrink-0 font-mono text-[8px] text-pd-muted">
        #{candidate.rank}
      </span>

      {/* Address + meta */}
      <div className="flex-1 min-w-0">
        <div className="truncate font-mono text-[10px] text-bright">
          {candidate.address.split(",")[0]}
        </div>
        <div className="font-mono text-[7px] text-mid">
          {candidate.acres?.toFixed(1)} ac · {candidate.zoning ?? "—"}
        </div>
      </div>

      {/* Score */}
      <div className="shrink-0 text-right">
        <div className={`font-head text-base leading-none ${scoreColor}`}>
          {scoreVal}
        </div>
        {score && !isDisq && (
          <div className="font-mono text-[6px] text-pd-muted">P{score.power} F{score.fiber}</div>
        )}
      </div>
    </button>
  );
}

// ── Example queries ───────────────────────────────────────────────────────────

const EXAMPLE_QUERIES = [
  "100MW hyperscale near I-85 in Georgia, 230kV minimum",
  "25MW enterprise site in Alabama with low flood risk",
  "10MW edge deployment close to Atlanta fiber exchange",
  "Hyperscale campus site, Southeast, strong water access",
];
