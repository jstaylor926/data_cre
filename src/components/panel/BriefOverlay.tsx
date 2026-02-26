"use client";

import { useAppStore } from "@/store/useAppStore";
import { useEffect, useRef, useState } from "react";
import { X, Download, Check } from "lucide-react";
import type { BriefSection, Parcel, SiteScore } from "@/lib/types";
import { formatCurrency } from "@/lib/formatters";

const SECTIONS_DEF: BriefSection[] = [
  { id: "summary",  label: "Executive Summary",           status: "pending", description: "APN data · Owner record · Parcel attributes", time: "0.3s" },
  { id: "score",    label: "Development Score",           status: "pending", description: "5-dimension composite score + sub-scores",      time: "1.1s" },
  { id: "zoning",   label: "Zoning Analysis + Comps",    status: "pending", description: "Ordinance summary · Comparable properties",      time: "2.4s" },
  { id: "history",  label: "Firm Historical Context",     status: "pending", description: "Searching deal documents…",                      time: "1.8s" },
  { id: "risks",    label: "Risk Analysis + Recommendations", status: "pending", description: "Environmental flags · Next steps",           time: "2.2s" },
];

/** Split raw Claude markdown output into labelled sections */
function parseBriefSections(text: string): Record<string, string> {
  const result: Record<string, string> = {};

  // Map heading positions to section IDs
  const H2_RE = /^#{1,2}\s+(.+)$/gm;
  const h2matches: Array<{ label: string; start: number }> = [];
  let m2;
  while ((m2 = H2_RE.exec(text)) !== null) {
    h2matches.push({ label: m2[1], start: m2.index });
  }

  const sectionIds = ["summary", "score", "zoning", "history", "risks"];
  h2matches.forEach((h, i) => {
    const id = sectionIds[i] ?? `section-${i}`;
    const start = h.start + h.label.length + 3; // after the heading line
    const end = i + 1 < h2matches.length ? h2matches[i + 1].start : text.length;
    result[id] = text.slice(start, end).trim();
  });


  return result;
}

export default function BriefOverlay() {
  const isOpen = useAppStore((s) => s.isBriefOverlayOpen);
  const setOpen = useAppStore((s) => s.setBriefOverlayOpen);
  const briefStatus = useAppStore((s) => s.briefStatus);
  const setBriefStatus = useAppStore((s) => s.setBriefStatus);
  const parcel = useAppStore((s) => s.selectedParcel);
  const siteScore = useAppStore((s) => s.siteScore);
  const selectedAPN = useAppStore((s) => s.selectedAPN);

  const [sections, setSections] = useState<BriefSection[]>(SECTIONS_DEF.map(s => ({ ...s })));
  const [activeNav, setActiveNav] = useState("summary");
  const [briefText, setBriefText] = useState("");
  const [parsedSections, setParsedSections] = useState<Record<string, string>>({});
  const abortRef = useRef<AbortController | null>(null);

  // Reset when overlay opens fresh
  useEffect(() => {
    if (isOpen && briefStatus === "generating") {
      setSections(SECTIONS_DEF.map(s => ({ ...s })));
      setBriefText("");
      setParsedSections({});
      setActiveNav("summary");

      // 1. Start fake progress animation
      let idx = 0;
      const interval = setInterval(() => {
        setSections((prev) => {
          const next = [...prev];
          if (idx > 0) next[idx - 1] = { ...next[idx - 1], status: "done" };
          if (idx < next.length) {
            next[idx] = { ...next[idx], status: "current" };
            idx++;
            return next;
          } else {
            clearInterval(interval);
            return next;
          }
        });
      }, 1600);

      // 2. Fetch real brief from API (stream)
      const controller = new AbortController();
      abortRef.current = controller;
      let accumulated = "";

      (async () => {
        try {
          if (!selectedAPN) return;
          const res = await fetch(`/api/parcel/${encodeURIComponent(selectedAPN)}/brief`, {
            signal: controller.signal,
          });
          if (!res.ok || !res.body) throw new Error("Brief API failed");

          const reader = res.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split("\n")) {
              if (!line.startsWith("data: ")) continue;
              const payload = line.slice(6);
              if (payload === "[DONE]") break;
              try {
                const parsed = JSON.parse(payload) as { text?: string };
                if (parsed.text) accumulated += parsed.text;
              } catch { /* skip */ }
            }
          }

          setBriefText(accumulated);
          setParsedSections(parseBriefSections(accumulated));
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            setBriefText("Error generating brief. Please check your ANTHROPIC_API_KEY.");
          }
        } finally {
          clearInterval(interval);
          // Mark all done
          setSections((prev) => prev.map(s => ({ ...s, status: "done" })));
          setTimeout(() => setBriefStatus("generated"), 400);
        }
      })();

      return () => {
        clearInterval(interval);
        controller.abort();
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, briefStatus]);

  const handleClose = () => {
    abortRef.current?.abort();
    setOpen(false);
    setBriefStatus("idle");
    setSections(SECTIONS_DEF.map(s => ({ ...s })));
    setBriefText("");
    setParsedSections({});
  };

  if (!isOpen || !parcel) return null;

  const isGenerating = briefStatus === "generating";
  const progress = (sections.filter(s => s.status === "done").length / sections.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/95 backdrop-blur-xl animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="flex h-[52px] items-center gap-4 border-b border-line px-6">
        <div className="font-head text-sm tracking-widest text-bright">
          Atlas<span className="text-violet">CRE</span>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-violet flex-1">
          {isGenerating ? "Generating Site Brief…" : "Site Feasibility Brief"} &middot; {parcel.site_address}
        </div>
        <div className="flex gap-2">
          {!isGenerating && briefText && (
            <button
              onClick={() => {
                const blob = new Blob([briefText], { type: "text/plain" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `brief-${parcel.apn}.txt`;
                a.click();
              }}
              className="flex items-center gap-2 rounded bg-violet px-3 py-1.5 font-mono text-[9px] font-semibold uppercase text-ink"
            >
              <Download size={10} />
              Export
            </button>
          )}
          <button
            onClick={handleClose}
            className="flex items-center gap-2 rounded border border-line px-3 py-1.5 font-mono text-[9px] uppercase text-pd-muted"
          >
            <X size={10} />
            {isGenerating ? "Cancel" : "Close"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {isGenerating ? (
          /* Generating State */
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="w-full max-w-[480px]">
              <div className="mb-6 text-center font-mono text-[9px] uppercase tracking-[0.2em] text-violet">
                Building your site intelligence brief
              </div>
              <div className="flex flex-col gap-2.5">
                {sections.map((s, i) => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-4 rounded-lg border p-3.5 transition-all duration-500 ${
                      s.status === "done" ? "bg-ink3 border-green/20" :
                      s.status === "current" ? "bg-ink3 border-violet/30 animate-pulse" :
                      "bg-ink3 border-line opacity-40"
                    }`}
                  >
                    <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] ${
                      s.status === "done" ? "bg-green text-ink" :
                      s.status === "current" ? "bg-violet-dim border border-violet text-violet" :
                      "bg-ink4 border border-line2 text-mid"
                    }`}>
                      {s.status === "done" ? <Check size={12} /> : i + 1}
                    </div>
                    <div className="flex-1">
                      <div className={`font-mono text-[9px] ${
                        s.status === "done" ? "text-green" :
                        s.status === "current" ? "text-violet" :
                        "text-mid"
                      }`}>
                        {s.label}
                      </div>
                      <div className="mt-0.5 font-mono text-[8px] text-pd-muted">
                        {s.description}
                      </div>
                    </div>
                    {s.status === "done" && (
                      <div className="font-mono text-[8px] text-pd-muted">{s.time}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mt-8 h-[3px] w-full overflow-hidden rounded-full bg-ink4">
                <div
                  className="h-full bg-gradient-to-r from-violet to-teal transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-3 text-center font-mono text-[8px] text-pd-muted">
                Step {sections.filter(s => s.status === "done").length} of {sections.length} · Synthesizing ordinance + market data…
              </div>
            </div>
          </div>
        ) : (
          /* Generated State */
          <>
            {/* Left Nav */}
            <div className="w-[240px] border-r border-line py-6 flex-shrink-0">
              {SECTIONS_DEF.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setActiveNav(s.id)}
                  className={`flex w-full items-center gap-3 px-6 py-2.5 font-mono text-[9px] uppercase tracking-wider transition-colors border-l-2 ${
                    activeNav === s.id
                      ? "border-violet bg-violet-dim text-violet"
                      : "border-transparent text-pd-muted hover:text-mid"
                  }`}
                >
                  <span className="text-[8px] opacity-50">0{i + 1}</span>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-12">
              <div className="max-w-[800px] mx-auto">
                {briefText ? (
                  /* Real AI-generated content */
                  <BriefContent
                    activeNav={activeNav}
                    parsedSections={parsedSections}
                    rawText={briefText}
                    parcel={parcel}
                    siteScore={siteScore}
                  />
                ) : (
                  /* Fallback summary if API failed */
                  <FallbackSummary parcel={parcel} siteScore={siteScore} />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BriefContent({
  activeNav,
  parsedSections,
  rawText,
  parcel,
  siteScore,
}: {
  activeNav: string;
  parsedSections: Record<string, string>;
  rawText: string;
  parcel: Parcel;
  siteScore: SiteScore | null;
}) {
  // Show parsed section if available, otherwise show full raw text for first section
  const content = parsedSections[activeNav] ?? (activeNav === "summary" ? rawText : "");

  return (
    <section>
      <h1 className="font-head text-3xl tracking-wide text-bright mb-6">
        {SECTIONS_DEF.find(s => s.id === activeNav)?.label ?? "Brief"}
      </h1>

      {/* Quick stats header for summary */}
      {activeNav === "summary" && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          <KVCard label="Site Score" value={`${siteScore?.composite ?? "—"} / 100`} color="text-violet" />
          <KVCard label="Lot Size" value={parcel.acres ? `${parcel.acres} ac` : "—"} color="text-teal" />
          <KVCard label="Zoning" value={parcel.zoning ?? "N/A"} color="text-teal" />
          <KVCard label="Assessed" value={formatCurrency(parcel.assessed_total ?? 0)} color="text-amber" />
          <KVCard label="Tier" value={siteScore?.tier ?? "—"} color="text-violet" />
          <KVCard label="Owner" value={(parcel.owner_name ? (parcel.owner_name.length > 18 ? parcel.owner_name.slice(0, 16) + "…" : parcel.owner_name) : "N/A")} />
        </div>
      )}

      {content ? (
        <div className="prose-brief">
          {content.split("\n").map((line, i) => {
            if (!line.trim()) return <div key={i} className="h-3" />;
            if (line.startsWith("### ") || line.startsWith("## "))
              return <h3 key={i} className="font-head text-lg tracking-wide text-bright mt-6 mb-2">{line.replace(/^##+ /, "")}</h3>;
            if (line.startsWith("- ") || line.startsWith("• "))
              return <p key={i} className="flex gap-2 text-[13px] text-mid leading-relaxed"><span className="text-violet mt-1 flex-shrink-0">·</span><span>{line.replace(/^[-•] /, "")}</span></p>;
            return <p key={i} className="text-[13px] leading-relaxed text-mid mb-2">{line}</p>;
          })}
        </div>
      ) : (
        <p className="text-[13px] text-mid italic">Section content not available.</p>
      )}
    </section>
  );
}

function FallbackSummary({
  parcel,
  siteScore,
}: {
  parcel: Parcel;
  siteScore: SiteScore | null;
}) {
  return (
    <section className="mb-12">
      <h1 className="font-head text-3xl tracking-wide text-bright mb-4">
        Executive <span className="text-violet">Summary</span>
      </h1>
      <p className="text-[13px] leading-relaxed text-mid mb-8">
        {parcel.site_address} is a {parcel.acres}-acre {parcel.zoning} parcel in {parcel.county} County,
        owned by {parcel.owner_name ?? "unknown"}.
        The site scores {siteScore?.composite ?? "—"}/100 on the Atlas CRE Site Intelligence model.
      </p>
      <div className="grid grid-cols-3 gap-3">
        <KVCard label="Site Score" value={`${siteScore?.composite ?? "—"} / 100`} color="text-violet" />
        <KVCard label="Lot Size" value={parcel.acres ? `${parcel.acres} ac` : "—"} color="text-teal" />
        <KVCard label="Zoning" value={parcel.zoning ?? "N/A"} color="text-teal" />
        <KVCard label="Assessed" value={formatCurrency(parcel.assessed_total ?? 0)} color="text-amber" />
        <KVCard label="Tier" value={siteScore?.tier ?? "—"} color="text-violet" />
        <KVCard label="Owner" value={(parcel.owner_name ? (parcel.owner_name.length > 18 ? parcel.owner_name.slice(0, 16) + "…" : parcel.owner_name) : "N/A")} />
      </div>
      <div className="mt-8 rounded border border-red/20 bg-ink3 p-4">
        <p className="font-mono text-[9px] text-red/80">
          AI brief generation failed. Ensure ANTHROPIC_API_KEY is set in .env.local.
        </p>
      </div>
    </section>
  );
}

function KVCard({ label, value, color = "text-bright" }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-line2 bg-ink3 p-4">
      <div className="mb-1 font-mono text-[8px] uppercase tracking-wider text-pd-muted">{label}</div>
      <div className={`font-mono text-sm font-medium ${color}`}>{value}</div>
    </div>
  );
}
