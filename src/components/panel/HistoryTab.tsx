"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { FileText, ArrowRight, History, Loader2, AlertCircle } from "lucide-react";

interface HistoryMatch {
  id: string;
  project_id: string | null;
  content: string;
  similarity: number;
  metadata: {
    filename: string;
    chunk_index: number;
    total_chunks: number;
  };
}

export default function HistoryTab() {
  const selectedAPN = useAppStore((s) => s.selectedAPN);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<HistoryMatch[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedAPN) return;

    // Use setTimeout to defer setState out of the synchronous render/effect path 
    // to satisfy strict react-hooks/set-state-in-effect rule
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
    }, 0);

    fetch(`/api/parcel/${encodeURIComponent(selectedAPN)}/firm-history`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 403) throw new Error("CRM access required to view history.");
          if (res.status === 401) throw new Error("Please sign in to view firm history.");
          throw new Error("Failed to load firm history.");
        }
        return res.json();
      })
      .then((data) => {
        setMatches(data.matches || []);
      })
      .catch((err) => {
        console.error("History fetch error:", err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => clearTimeout(timer);
  }, [selectedAPN]);

  // Derived matches to handle empty state when APN is cleared without triggering cascading renders
  const displayMatches = selectedAPN ? matches : [];

  if (loading) {
    return (
      <div className="flex h-48 flex-col items-center justify-center space-y-3 text-pd-muted">
        <Loader2 className="animate-spin" size={24} />
        <p className="font-mono text-[10px] uppercase tracking-widest">
          Querying Firm Intelligence...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-48 flex-col items-center justify-center space-y-3 px-6 text-center text-pd-muted">
        <AlertCircle size={24} className="text-rose-500/50" />
        <p className="text-xs">{error}</p>
      </div>
    );
  }

  if (displayMatches.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center space-y-3 px-6 text-center text-pd-muted">
        <History size={24} className="opacity-20" />
        <p className="text-xs italic">
          No matching historical deals or documents found for this site context.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-pd-muted">
          <History size={12} />
          Related Firm History
        </h3>

        <div className="space-y-4">
          {displayMatches.map((match) => (
            <div
              key={match.id}
              className="group rounded-lg border border-line2 bg-ink3 p-3 transition-colors hover:border-pd-teal/30"
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-ink4 text-pd-teal">
                    <FileText size={12} />
                  </div>
                  <span className="text-[11px] font-bold text-bright">
                    {match.metadata.filename}
                  </span>
                </div>
                <div className="rounded bg-pd-teal/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-pd-teal">
                  {Math.round(match.similarity * 100)}% MATCH
                </div>
              </div>

              <p className="line-clamp-3 text-[11px] leading-relaxed text-text">
                &ldquo;{match.content}&rdquo;
              </p>

              <button className="mt-3 flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-pd-teal opacity-0 transition-opacity group-hover:opacity-100">
                View Document <ArrowRight size={10} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-line2 bg-ink2/50 p-3">
        <p className="text-[10px] italic text-pd-muted">
          Matches are based on site address, legal description, and owner similarity search across firm memos and proformas.
        </p>
      </div>
    </div>
  );
}
