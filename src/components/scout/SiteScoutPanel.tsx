"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, X, Loader2, Database } from "lucide-react";
import type { ScoutQuery } from "@/lib/types";

const ZONING_OPTIONS = ["I-1", "I-2", "C-2", "C-3", "A", "MU-1"];

export function SiteScoutPanel() {
  const setScoutMode = useAppStore((s) => s.setScoutMode);
  const scoutResults = useAppStore((s) => s.scoutResults);
  const scoutLoading = useAppStore((s) => s.scoutLoading);
  const setScoutLoading = useAppStore((s) => s.setScoutLoading);
  const setScoutResults = useAppStore((s) => s.setScoutResults);

  const [minAcres, setMinAcres] = useState(50);
  const [maxSubDist, setMaxSubDist] = useState(3);
  const [selectedZoning, setSelectedZoning] = useState<string[]>(["I-1", "I-2"]);
  const [excludeFlood, setExcludeFlood] = useState(true);

  const handleSearch = async () => {
    setScoutLoading(true);
    try {
      const query: ScoutQuery = {
        minAcres,
        maxSubstationDistMiles: maxSubDist,
        targetZoning: selectedZoning,
        excludeFloodplain: excludeFlood,
      };
      const res = await fetch("/api/dc-scout/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
      });
      if (res.ok) {
        const data = await res.json();
        setScoutResults(data.results ?? []);
      }
    } catch {
      console.error("Scout search failed");
    } finally {
      setScoutLoading(false);
    }
  };

  const toggleZoning = (z: string) => {
    setSelectedZoning((prev) =>
      prev.includes(z) ? prev.filter((x) => x !== z) : [...prev, z]
    );
  };

  return (
    <aside className="w-80 bg-zinc-950 border-r border-zinc-800 overflow-y-auto shrink-0">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-teal-400" />
            <h2 className="text-sm font-semibold text-zinc-200">Site Scout</h2>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setScoutMode(false)}
          >
            <X className="h-3.5 w-3.5 text-zinc-400" />
          </Button>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          {/* Min Acreage */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500">
              Minimum Acreage: {minAcres} ac
            </label>
            <Slider
              value={[minAcres]}
              onValueChange={([v]) => setMinAcres(v)}
              min={5}
              max={500}
              step={5}
              className="mt-2"
            />
          </div>

          {/* Max Distance to Substation */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500">
              Max Distance to Substation: {maxSubDist} mi
            </label>
            <Slider
              value={[maxSubDist]}
              onValueChange={([v]) => setMaxSubDist(v)}
              min={0.5}
              max={10}
              step={0.5}
              className="mt-2"
            />
          </div>

          {/* Target Zoning */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-2">
              Target Zoning
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ZONING_OPTIONS.map((z) => (
                <button
                  key={z}
                  onClick={() => toggleZoning(z)}
                  className={`px-2 py-1 rounded text-[10px] border transition-colors ${
                    selectedZoning.includes(z)
                      ? "bg-teal-600/20 border-teal-500 text-teal-400"
                      : "border-zinc-700 text-zinc-500 hover:border-zinc-500"
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>

          {/* Exclude Floodplain */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={excludeFlood}
              onCheckedChange={(v) => setExcludeFlood(!!v)}
            />
            <label className="text-xs text-zinc-400">
              Exclude flood zones
            </label>
          </div>

          {/* Search Button */}
          <Button
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            onClick={handleSearch}
            disabled={scoutLoading}
          >
            {scoutLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Discover Sites
          </Button>
        </div>

        {/* Results */}
        {scoutResults.length > 0 && (
          <div className="mt-6">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
              {scoutResults.length} Sites Found
            </p>
            <div className="space-y-2">
              {scoutResults.map((r) => (
                <div
                  key={r.apn}
                  className="bg-zinc-900 rounded p-3 border border-zinc-800 cursor-pointer hover:border-zinc-600 transition-colors"
                >
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-200 font-medium">{r.apn}</span>
                    <Badge
                      variant="outline"
                      className="text-[9px] border-teal-500/30 text-teal-400"
                    >
                      {r.zoning}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                    <span>{r.acres.toFixed(1)} ac</span>
                    <span>{r.distToSubstationMiles.toFixed(1)} mi to sub</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
