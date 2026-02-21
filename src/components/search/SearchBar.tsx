"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { useMapboxSearch } from "@/hooks/useMapboxSearch";
import { useAppStore } from "@/store/useAppStore";
import SearchDropdown from "./SearchDropdown";

export interface CountySearchResult {
  pin: string;
  owner: string | null;
  address: string;
  zoning: string | null;
  acres: number | null;
  coordinates: [number, number] | null;
}

interface SearchBarProps {
  onFlyTo?: (lng: number, lat: number) => void;
}

export default function SearchBar({ onFlyTo }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [countyResults, setCountyResults] = useState<CountySearchResult[]>([]);
  const [countyLoading, setCountyLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const countyAbortRef = useRef<AbortController | null>(null);
  const { results: mapboxResults, loading: mapboxLoading, search: mapboxSearch, clear: mapboxClear } = useMapboxSearch();
  const selectParcel = useAppStore((s) => s.selectParcel);

  // Run both searches when query changes
  useEffect(() => {
    mapboxSearch(query);

    // County search (debounced via AbortController)
    countyAbortRef.current?.abort();

    if (!query || query.length < 2) {
      setCountyResults([]);
      setCountyLoading(false);
      return;
    }

    const controller = new AbortController();
    countyAbortRef.current = controller;
    setCountyLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (!controller.signal.aborted) {
            setCountyResults(Array.isArray(data) ? data : []);
          }
        }
      } catch {
        // aborted or network error — ignore
      } finally {
        if (!controller.signal.aborted) {
          setCountyLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, mapboxSearch]);

  // Total results for keyboard navigation
  const totalResults = countyResults.length + mapboxResults.length;

  // Reset focused index when results change
  useEffect(() => {
    setFocusedIndex(0);
  }, [countyResults, mapboxResults]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelectMapbox = useCallback(
    (lng: number, lat: number, placeName: string) => {
      setOpen(false);
      setQuery("");
      mapboxClear();
      setCountyResults([]);
      onFlyTo?.(lng, lat);

      // Try matching by address prefix in the county results
      const addressPart = placeName.split(",")[0]?.trim();
      if (addressPart) {
        // The flyTo is enough — county data will load via viewport
      }
    },
    [onFlyTo, mapboxClear]
  );

  const handleSelectCounty = useCallback(
    (result: CountySearchResult) => {
      setOpen(false);
      setQuery("");
      mapboxClear();
      setCountyResults([]);

      if (result.coordinates) {
        onFlyTo?.(result.coordinates[0], result.coordinates[1]);
        // Auto-select the parcel after fly-to
        setTimeout(() => selectParcel(result.pin), 400);
      } else {
        // No coordinates — just select and let panel load
        selectParcel(result.pin);
      }
    },
    [onFlyTo, mapboxClear, selectParcel]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || totalResults === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < totalResults - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev > 0 ? prev - 1 : totalResults - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < totalResults) {
          if (focusedIndex < countyResults.length) {
            handleSelectCounty(countyResults[focusedIndex]);
          } else {
            const r = mapboxResults[focusedIndex - countyResults.length];
            handleSelectMapbox(r.coordinates[0], r.coordinates[1], r.place_name);
          }
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const isLoading = mapboxLoading || countyLoading;
  const hasResults = totalResults > 0;

  return (
    <div ref={containerRef} className="relative flex-1 max-w-[360px]">
      <div
        className={`flex h-8 items-center gap-1.5 rounded border bg-ink3 px-2.5 transition-colors ${
          open && hasResults
            ? "border-teal bg-ink"
            : "border-line2"
        }`}
      >
        <Search
          size={11}
          className={`shrink-0 ${
            open && hasResults ? "text-teal" : "text-pd-muted"
          }`}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => hasResults && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search address, owner, or PIN…"
          className="h-full flex-1 bg-transparent font-mono text-[10px] text-text placeholder:text-pd-muted focus:outline-none"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              mapboxClear();
              setCountyResults([]);
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="text-pd-muted hover:text-mid"
          >
            <X size={10} />
          </button>
        )}
        {isLoading && query.length >= 2 && (
          <div className="h-2.5 w-2.5 shrink-0 animate-spin rounded-full border border-teal/30 border-t-teal" />
        )}
      </div>

      {open && hasResults && (
        <SearchDropdown
          countyResults={countyResults}
          mapboxResults={mapboxResults}
          focusedIndex={focusedIndex}
          onSelectCounty={handleSelectCounty}
          onSelectMapbox={handleSelectMapbox}
        />
      )}
    </div>
  );
}
