"use client";

import { MapPin } from "lucide-react";
import type { ResearchParcelResult } from "@/lib/types";

interface ResearchResultCardProps {
  result: ResearchParcelResult;
  onClick: (result: ResearchParcelResult) => void;
}

/**
 * ResearchResultCard — a compact card for a parcel match surfaced
 * inline within the research conversation.
 */
export default function ResearchResultCard({
  result,
  onClick,
}: ResearchResultCardProps) {
  const scoreColor =
    result.matchScore >= 80
      ? "text-green-400"
      : result.matchScore >= 60
        ? "text-teal"
        : "text-amber";

  return (
    <button
      onClick={() => onClick(result)}
      className="flex w-full items-center gap-2.5 rounded-lg border border-line2 bg-ink2 px-3 py-2 text-left transition-all hover:border-teal/30 hover:bg-ink3"
    >
      {/* Pin icon */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-dim">
        <MapPin size={11} className="text-teal" />
      </div>

      {/* Address + meta */}
      <div className="flex-1 min-w-0">
        <div className="truncate font-mono text-[10px] text-bright">
          {result.address.split(",")[0]}
        </div>
        <div className="flex items-center gap-2 font-mono text-[7px] text-mid">
          <span>{result.acres?.toFixed(1) ?? "?"} ac</span>
          <span className="text-muted">·</span>
          <span>{result.zoning ?? "—"}</span>
          {result.assessed_total && (
            <>
              <span className="text-muted">·</span>
              <span className="text-amber">
                ${(result.assessed_total / 1000).toFixed(0)}k
              </span>
            </>
          )}
        </div>
        <div className="mt-0.5 truncate font-mono text-[7px] text-muted italic">
          {result.matchReason}
        </div>
      </div>

      {/* Score */}
      <div className="shrink-0 text-right">
        <div className={`font-head text-lg leading-none ${scoreColor}`}>
          {result.matchScore}
        </div>
        <div className="font-mono text-[6px] text-muted">match</div>
      </div>
    </button>
  );
}
