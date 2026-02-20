"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useMapboxSearch } from "@/hooks/useMapboxSearch";
import SearchDropdown from "./SearchDropdown";

interface SearchBarProps {
  onFlyTo?: (lng: number, lat: number) => void;
}

export default function SearchBar({ onFlyTo }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { results, loading, search, clear } = useMapboxSearch();

  useEffect(() => {
    search(query);
  }, [query, search]);

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

  const handleSelect = (lng: number, lat: number) => {
    setOpen(false);
    setQuery("");
    clear();
    onFlyTo?.(lng, lat);
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-[360px]">
      <div className="flex h-8 items-center gap-1.5 rounded border border-line2 bg-ink3 px-2.5">
        <Search size={11} className="shrink-0 text-pd-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search address, APN, owner..."
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
        <SearchDropdown results={results} onSelect={handleSelect} />
      )}
    </div>
  );
}
