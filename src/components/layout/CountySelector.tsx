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
          "flex h-8 items-center gap-2 rounded border px-3 font-mono text-[10px] uppercase tracking-wider transition-all",
          open
            ? "border-teal bg-teal-dim text-teal shadow-[0_0_10px_rgba(0,212,200,0.2)]"
            : "border-line2 bg-ink4 text-mid hover:border-teal/50 hover:text-text"
        )}
      >
        <MapPin className={cn("h-3.5 w-3.5", open ? "text-teal" : "text-pd-muted")} />
        <span className="w-20 truncate text-left">{activeCounty.name}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            open && "rotate-180 text-teal"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-[100] mt-1.5 max-h-80 w-56 overflow-hidden rounded-md border border-line bg-ink shadow-[0_10px_30px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-100">
          <div className="border-b border-line2 bg-ink4 px-3 py-2">
            <p className="font-mono text-[8px] uppercase tracking-widest text-pd-muted">Select County</p>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {counties.map((county) => {
              const isActive = county.id === activeCountyId;
              const isVerified = county.status === "verified";
              return (
                <button
                  key={county.id}
                  onClick={() => handleSelect(county.id)}
                  className={cn(
                    "group flex w-full items-center gap-2.5 px-3 py-2 text-left font-mono text-[10px] tracking-wider transition-colors",
                    isActive
                      ? "bg-teal-dim text-teal"
                      : "text-mid hover:bg-ink3 hover:text-bright"
                  )}
                >
                  <span className="flex-1 truncate uppercase">
                    {county.name}
                  </span>
                  {isActive && (
                    <div className="h-1 w-1 rounded-full bg-teal" />
                  )}
                  {isVerified ? (
                    <span className="shrink-0 text-[7px] font-bold text-teal/40 group-hover:text-teal/70">VERIFIED</span>
                  ) : (
                    <span className="shrink-0 text-[7px] font-bold text-amber/40 group-hover:text-amber/70">BETA</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
