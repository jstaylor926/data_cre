"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMapboxSearch } from "@/hooks/useMapboxSearch";
import { searchParcels } from "@/lib/mock-data";
import { useAppStore } from "@/store/useAppStore";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const { results: geoResults, search, clear } = useMapboxSearch();
  const selectParcel = useAppStore((s) => s.selectParcel);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 3) {
        search(query);
        setShowDropdown(true);
      } else {
        clear();
        setShowDropdown(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search, clear]);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Local parcel search
  const localResults = query.length >= 2 ? searchParcels(query).slice(0, 3) : [];

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
        <Input
          placeholder="Search address, APN, or owner..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 pl-8 pr-8 text-xs bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              clear();
              setShowDropdown(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2"
          >
            <X className="h-3.5 w-3.5 text-zinc-500" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (localResults.length > 0 || geoResults.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-md shadow-xl z-50 max-h-64 overflow-y-auto">
          {/* Local Parcels */}
          {localResults.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-800/50">
                Parcels
              </p>
              {localResults.map((p) => (
                <button
                  key={p.apn}
                  onClick={() => {
                    selectParcel(p.apn);
                    setShowDropdown(false);
                    setQuery("");
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-zinc-800 transition-colors"
                >
                  <div className="text-xs text-zinc-200">{p.apn}</div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    {p.site_address ?? p.owner_name}
                  </div>
                </button>
              ))}
            </div>
          )}
          {/* Geocoding Results */}
          {geoResults.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-800/50">
                Addresses
              </p>
              {geoResults.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    // For geocoding results, just close for now (map flyTo handled separately)
                    setShowDropdown(false);
                    setQuery("");
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-zinc-800 transition-colors"
                >
                  <div className="text-xs text-zinc-200">{r.name}</div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    {r.place_name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
