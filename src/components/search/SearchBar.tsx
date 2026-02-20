"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { useMapboxSearch } from "@/hooks/useMapboxSearch";
import { useAppStore } from "@/store/useAppStore";
import { searchParcels } from "@/lib/mock-data";
import SearchDropdown from "./SearchDropdown";

interface SearchBarProps {
  onFlyTo?: (lng: number, lat: number) => void;
}

export default function SearchBar({ onFlyTo }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { results, loading, search, clear } = useMapboxSearch();
  const selectParcel = useAppStore((s) => s.selectParcel);

  useEffect(() => {
    search(query);
  }, [query, search]);

  // Reset focused index when results change
  useEffect(() => {
    setFocusedIndex(0);
  }, [results]);

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

  const handleSelect = useCallback(
    (lng: number, lat: number, placeName: string) => {
      setOpen(false);
      setQuery("");
      clear();
      onFlyTo?.(lng, lat);

      // Try to match a local parcel by address and auto-select it
      const addressPart = placeName.split(",")[0]?.trim();
      if (addressPart) {
        const matches = searchParcels(addressPart);
        if (matches.length > 0) {
          // Small delay so the map flyTo starts first
          setTimeout(() => selectParcel(matches[0].apn), 400);
        }
      }
    },
    [onFlyTo, clear, selectParcel]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < results.length) {
          const r = results[focusedIndex];
          handleSelect(r.coordinates[0], r.coordinates[1], r.place_name);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-[360px]">
      <div
        className={`flex h-8 items-center gap-1.5 rounded border bg-ink3 px-2.5 transition-colors ${
          open && results.length > 0
            ? "border-teal bg-ink"
            : "border-line2"
        }`}
      >
        <Search
          size={11}
          className={`shrink-0 ${
            open && results.length > 0 ? "text-teal" : "text-pd-muted"
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
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search address or APN…"
          className="h-full flex-1 bg-transparent font-mono text-[10px] text-text placeholder:text-pd-muted focus:outline-none"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              clear();
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="text-pd-muted hover:text-mid"
          >
            <X size={10} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <SearchDropdown
          results={results}
          focusedIndex={focusedIndex}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}
