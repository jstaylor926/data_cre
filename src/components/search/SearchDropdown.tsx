"use client";

import { MapPin } from "lucide-react";
import type { SearchResult } from "@/lib/types";

interface SearchDropdownProps {
  results: SearchResult[];
  onSelect: (lng: number, lat: number) => void;
}

export default function SearchDropdown({
  results,
  onSelect,
}: SearchDropdownProps) {
  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded border border-line2 bg-ink2 shadow-xl">
      {results.map((result) => (
        <button
          key={result.id}
          onClick={() =>
            onSelect(result.coordinates[0], result.coordinates[1])
          }
          className="flex w-full items-start gap-2.5 border-b border-line px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-ink3"
        >
          <MapPin size={12} className="mt-0.5 shrink-0 text-teal" />
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-[11px] text-bright">
              {result.place_name}
            </p>
            <p className="font-mono text-[9px] uppercase tracking-wider text-pd-muted">
              {result.type}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
