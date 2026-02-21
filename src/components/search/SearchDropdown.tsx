"use client";

import { useRef, useEffect } from "react";
import { MapPin, User, Hash } from "lucide-react";
import type { SearchResult } from "@/lib/types";
import type { CountySearchResult } from "./SearchBar";

interface SearchDropdownProps {
  countyResults: CountySearchResult[];
  mapboxResults: SearchResult[];
  focusedIndex: number;
  onSelectCounty: (result: CountySearchResult) => void;
  onSelectMapbox: (lng: number, lat: number, placeName: string) => void;
}

export default function SearchDropdown({
  countyResults,
  mapboxResults,
  focusedIndex,
  onSelectCounty,
  onSelectMapbox,
}: SearchDropdownProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-search-item]");
    items[focusedIndex]?.scrollIntoView({ block: "nearest" });
  }, [focusedIndex]);

  let itemIndex = -1;

  return (
    <div
      ref={listRef}
      className="absolute top-full left-0 right-0 z-50 mt-px max-h-[400px] overflow-y-auto overflow-x-hidden rounded-b-lg border border-t-0 border-line2 bg-ink2 shadow-xl"
    >
      {/* County property results */}
      {countyResults.length > 0 && (
        <>
          <div className="border-b border-line bg-ink3/50 px-3 py-1.5">
            <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-pd-muted">
              County Records
            </p>
          </div>
          {countyResults.map((result) => {
            itemIndex++;
            const idx = itemIndex;
            return (
              <button
                key={`county-${result.pin}`}
                data-search-item
                onClick={() => onSelectCounty(result)}
                className={`flex w-full items-start gap-2.5 border-b border-line px-3 py-2.5 text-left transition-colors last:border-b-0 ${
                  idx === focusedIndex ? "bg-ink3" : "hover:bg-ink3"
                }`}
              >
                <Hash size={12} className="mt-0.5 shrink-0 text-teal" />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-[11px] text-bright">
                    {result.address || "No address"}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-pd-muted">
                      {result.pin}
                    </span>
                    {result.zoning && (
                      <span className="rounded bg-teal-dim px-1 py-px font-mono text-[8px] text-teal">
                        {result.zoning}
                      </span>
                    )}
                    {result.acres && (
                      <span className="font-mono text-[9px] text-mid">
                        {Number(result.acres).toFixed(2)} ac
                      </span>
                    )}
                  </div>
                  {result.owner && (
                    <div className="mt-0.5 flex items-center gap-1">
                      <User size={8} className="text-pd-muted" />
                      <span className="truncate text-[9px] text-mid/70">
                        {result.owner}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </>
      )}

      {/* Mapbox geocoding results */}
      {mapboxResults.length > 0 && (
        <>
          {countyResults.length > 0 && (
            <div className="border-b border-line bg-ink3/50 px-3 py-1.5">
              <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-pd-muted">
                Places
              </p>
            </div>
          )}
          {mapboxResults.map((result) => {
            itemIndex++;
            const idx = itemIndex;
            return (
              <button
                key={result.id}
                data-search-item
                onClick={() =>
                  onSelectMapbox(result.coordinates[0], result.coordinates[1], result.place_name)
                }
                className={`flex w-full items-start gap-2.5 border-b border-line px-3 py-2.5 text-left transition-colors last:border-b-0 ${
                  idx === focusedIndex ? "bg-ink3" : "hover:bg-ink3"
                }`}
              >
                <MapPin size={12} className="mt-0.5 shrink-0 text-amber" />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-[11px] text-bright">
                    {result.place_name}
                  </p>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-pd-muted">
                    {result.type}
                  </p>
                </div>
              </button>
            );
          })}
        </>
      )}

      <div className="border-t border-line px-3 py-1.5">
        <p className="font-mono text-[8px] uppercase tracking-wider text-pd-muted">
          Gwinnett County + Mapbox
        </p>
      </div>
    </div>
  );
}
