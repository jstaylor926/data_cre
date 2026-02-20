"use client";

import { useAppStore } from "@/store/useAppStore";
import { useEffect, useState } from "react";
import { X, Download, Share2, Check } from "lucide-react";
import { BriefSection } from "@/lib/types";
import { formatCurrency } from "@/lib/formatters";

const SECTIONS: BriefSection[] = [
  { id: "summary", label: "Executive Summary", status: "pending", description: "APN data · Owner record · Parcel attributes", time: "0.2s" },
  { id: "score", label: "Development Score", status: "pending", description: "5-dimension composite score + sub-scores", time: "1.1s" },
  { id: "zoning", label: "Zoning Analysis + Comps", status: "pending", description: "Ordinance summary · 4 comparable sales", time: "2.4s" },
  { id: "history", label: "Firm Historical Context", status: "pending", description: "Searching 847 deal documents… 3 matches found", time: "3.1s" },
  { id: "risks", label: "Risk Analysis + Recommendations", status: "pending", description: "Environmental flags · Next steps", time: "1.8s" },
];

export default function BriefOverlay() {
  const isOpen = useAppStore((s) => s.isBriefOverlayOpen);
  const setOpen = useAppStore((s) => s.setBriefOverlayOpen);
  const briefStatus = useAppStore((s) => s.briefStatus);
  const setBriefStatus = useAppStore((s) => s.setBriefStatus);
  const parcel = useAppStore((s) => s.selectedParcel);
  const siteScore = useAppStore((s) => s.siteScore);

  const [sections, setSections] = useState<BriefSection[]>(SECTIONS);
  const [activeNav, setActiveNav] = useState("summary");

  useEffect(() => {
    if (briefStatus === "generating") {
      let currentIdx = 0;
      const interval = setInterval(() => {
        setSections((prev) => {
          const next = [...prev];
          if (currentIdx > 0) next[currentIdx - 1].status = "done";
          if (currentIdx < next.length) {
            next[currentIdx].status = "current";
            currentIdx++;
            return next;
          } else {
            clearInterval(interval);
            setBriefStatus("generated");
            return next;
          }
        });
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [briefStatus, setBriefStatus]);

  if (!isOpen || !parcel) return null;

  const isGenerating = briefStatus === "generating";
  const progress = (sections.filter(s => s.status === "done").length / sections.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/95 backdrop-blur-xl animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="flex h-[52px] items-center gap-4 border-b border-line px-6">
        <div className="font-head text-sm tracking-widest text-bright">
          Pocket<span className="text-violet">Dev</span>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-violet flex-1">
          {isGenerating ? "Generating Site Brief…" : "Site Feasibility Brief"} &middot; {parcel.site_address}
        </div>
        <div className="flex gap-2">
          {!isGenerating && (
            <>
              <button className="flex items-center gap-2 rounded bg-violet px-3 py-1.5 font-mono text-[9px] font-semibold uppercase text-ink">
                <Download size={10} />
                PDF
              </button>
              <button className="flex items-center gap-2 rounded border border-line2 px-3 py-1.5 font-mono text-[9px] uppercase text-mid">
                <Share2 size={10} />
                Share
              </button>
            </>
          )}
          <button 
            onClick={() => setOpen(false)}
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
                      s.status === 'done' ? 'bg-ink3 border-green/20' :
                      s.status === 'current' ? 'bg-ink3 border-violet/30 animate-pulse' :
                      'bg-ink3 border-line opacity-40'
                    }`}
                  >
                    <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] ${
                      s.status === 'done' ? 'bg-green text-ink' :
                      s.status === 'current' ? 'bg-violet-dim border border-violet text-violet' :
                      'bg-ink4 border border-line2 text-mid'
                    }`}>
                      {s.status === 'done' ? <Check size={12} /> : i + 1}
                    </div>
                    <div className="flex-1">
                      <div className={`font-mono text-[9px] ${
                        s.status === 'done' ? 'text-green' :
                        s.status === 'current' ? 'text-violet' :
                        'text-mid'
                      }`}>
                        {s.label}
                      </div>
                      <div className="mt-0.5 font-mono text-[8px] text-pd-muted">
                        {s.description}
                      </div>
                    </div>
                    {s.status === 'done' && (
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
                Step {sections.filter(s => s.status === 'done').length} of {sections.length} &middot; Estimated {Math.max(0, (sections.length - sections.filter(s => s.status === 'done').length) * 2)}s remaining
              </div>
            </div>
          </div>
        ) : (
          /* Generated State */
          <>
            {/* Left Nav */}
            <div className="w-[240px] border-r border-line py-6">
              {sections.map((s, i) => (
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
                <section className="mb-12">
                  <h1 className="font-head text-3xl tracking-wide text-bright mb-4">
                    Executive <span className="text-violet">Summary</span>
                  </h1>
                  <p className="text-[13px] leading-relaxed text-mid mb-8">
                    {parcel.site_address} is a {parcel.acres}-acre {parcel.zoning} general commercial parcel in {parcel.county} County, currently owned by {parcel.owner_name}. 
                    Last traded at {formatCurrency(parcel.last_sale_price ?? 0)} ({parcel.last_sale_price && parcel.acres ? formatCurrency(parcel.last_sale_price / (parcel.acres * 43560)) : '$13.30'}/SF) in August 2021. 
                    The site scores {siteScore?.composite}/100 on the PocketDev Site Intelligence model — a strong candidate for immediate outreach.
                  </p>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <KVCard label="Site Score" value={`${siteScore?.composite} / 100`} color="text-violet" />
                    <KVCard label="Lot Size" value={`${parcel.acres} ac`} color="text-teal" />
                    <KVCard label="Zoning" value={parcel.zoning ?? "N/A"} color="text-teal" />
                    <KVCard label="Last Sale" value={formatCurrency(parcel.last_sale_price ?? 0)} color="text-amber" />
                    <KVCard label="Price / SF" value="$13.30" color="text-amber" />
                    <KVCard label="Owner" value={parcel.owner_name?.split(' ')[0] ?? "N/A"} />
                  </div>
                </section>
                
                <section className="border-l-2 border-violet pl-8 mb-12">
                   <h2 className="font-head text-2xl tracking-wide text-bright mb-4">
                    Development <span className="text-violet">Score</span>
                  </h2>
                  <div className="flex items-center gap-12 bg-ink3 border border-line2 rounded-lg p-6">
                    <div className="font-head text-6xl text-violet leading-none">{siteScore?.composite}</div>
                    <div className="flex-1 space-y-2">
                      <SmallScoreRow label="Zoning" val={siteScore?.zoning ?? 0} max={20} color="bg-green" />
                      <SmallScoreRow label="Access" val={siteScore?.access ?? 0} max={20} />
                      <SmallScoreRow label="Demographics" val={siteScore?.demographics ?? 0} max={20} />
                      <SmallScoreRow label="Market" val={siteScore?.market ?? 0} max={20} color="bg-amber" />
                      <SmallScoreRow label="Infrastructure" val={siteScore?.infrastructure ?? 0} max={20} />
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
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

function SmallScoreRow({ label, val, max, color = "bg-violet" }: { label: string; val: number; max: number; color?: string }) {
  const pct = (val / max) * 100;
  return (
    <div className="flex items-center gap-4">
      <span className="w-20 font-mono text-[8px] uppercase tracking-wider text-pd-muted">{label}</span>
      <div className="h-1.5 flex-1 rounded-full bg-ink4 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`w-6 text-right font-mono text-[8px] ${color.replace('bg-', 'text-')}`}>{val}</span>
    </div>
  );
}
