"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getUsableCounties, getCounty } from "@/lib/county-registry";
import { ChevronDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const counties = getUsableCounties().sort((a, b) => b.population - a.population);

interface CountySelectorProps {
  /** Called after county changes — parent can use this to flyTo new center */
  onCountyChange?: (countyId: string, center: [number, number]) => void;
}

export function CountySelector({ onCountyChange }: CountySelectorProps) {
  const activeCountyId = useAppStore((s) => s.activeCountyId);
  const setActiveCounty = useAppStore((s) => s.setActiveCounty);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeCounty = getCounty(activeCountyId);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleSelect = (countyId: string) => {
    if (countyId === activeCountyId) {
      setOpen(false);
      return;
    }
    const county = getCounty(countyId);
    setActiveCounty(countyId);
    setOpen(false);
    onCountyChange?.(countyId, county.defaultCenter);
  };

  return (
    <div ref={ref} className="relative shrink-0">
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-7 items-center gap-1.5 rounded border px-2 font-mono text-[9px] uppercase tracking-wider transition-colors",
          open
            ? "border-teal bg-teal-dim text-teal"
            : "border-line2 bg-ink4 text-mid hover:border-teal hover:text-teal"
        )}
      >
        <MapPin className="h-3 w-3" />
        <span className="max-w-[80px] truncate">{activeCounty.name}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-64 w-52 overflow-y-auto rounded border border-line2 bg-ink2 shadow-xl">
          {counties.map((county) => {
            const isActive = county.id === activeCountyId;
            const isVerified = county.status === "verified";
            return (
              <button
                key={county.id}
                onClick={() => handleSelect(county.id)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-[10px] tracking-wider transition-colors",
                  isActive
                    ? "bg-teal-dim text-teal"
                    : "text-mid hover:bg-ink3 hover:text-text"
                )}
              >
                <span className="flex-1 truncate uppercase">
                  {county.name}
                </span>
                {isVerified && (
                  <span className="shrink-0 text-[8px] text-teal/60">✓</span>
                )}
                {!isVerified && (
                  <span className="shrink-0 text-[8px] text-amber/60">β</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
