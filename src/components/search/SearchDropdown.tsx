"use client";

import { useRef, useEffect } from "react";
import { MapPin } from "lucide-react";
import type { SearchResult } from "@/lib/types";

interface SearchDropdownProps {
  results: SearchResult[];
  focusedIndex: number;
  onSelect: (lng: number, lat: number, placeName: string) => void;
}

export default function SearchDropdown({
  results,
  focusedIndex,
  onSelect,
}: SearchDropdownProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-search-item]");
    items[focusedIndex]?.scrollIntoView({ block: "nearest" });
  }, [focusedIndex]);

  return (
    <div
      ref={listRef}
      className="absolute top-full left-0 right-0 z-50 mt-px overflow-hidden rounded-b-lg border border-t-0 border-line2 bg-ink2 shadow-xl"
    >
      {results.map((result, i) => (
        <button
          key={result.id}
          data-search-item
          onClick={() =>
            onSelect(result.coordinates[0], result.coordinates[1], result.place_name)
          }
          className={`flex w-full items-start gap-2.5 border-b border-line px-3 py-2.5 text-left transition-colors last:border-b-0 ${
            i === focusedIndex ? "bg-ink3" : "hover:bg-ink3"
          }`}
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
      <div className="border-t border-line px-3 py-1.5">
        <p className="font-mono text-[8px] uppercase tracking-wider text-pd-muted">
          Powered by Mapbox Search Box v2
        </p>
      </div>
    </div>
  );
}
