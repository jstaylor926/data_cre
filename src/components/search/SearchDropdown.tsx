"use client";

import { useRef, useEffect, useMemo } from "react";
import { MapPin } from "lucide-react";
import type { SearchResult } from "@/lib/types";
import { searchParcels } from "@/lib/mock-data";

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

  // Cross-reference results with local parcels to find matching APNs
  const apnMap = useMemo(() => {
    const map: Record<string, { apn: string; county: string }> = {};
    for (const result of results) {
      const addressPart = result.place_name.split(",")[0]?.trim();
      if (addressPart) {
        const matches = searchParcels(addressPart);
        if (matches.length > 0) {
          map[result.id] = {
            apn: matches[0].apn,
            county: matches[0].county,
          };
        }
      }
    }
    return map;
  }, [results]);

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
      {results.map((result, i) => {
        const match = apnMap[result.id];
        return (
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
                {match
                  ? `${match.county} \u00B7 ${match.apn}`
                  : result.type}
              </p>
            </div>
          </button>
        );
      })}
      <div className="border-t border-line px-3 py-1.5">
        <p className="font-mono text-[8px] uppercase tracking-wider text-pd-muted">
          Powered by Mapbox Search Box v2
        </p>
      </div>
    </div>
  );
}
