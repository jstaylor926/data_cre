"use client";

import { useAppStore } from "@/store/useAppStore";
import { MOCK_COMPS } from "@/lib/mock-data";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/formatters";

export default function CompsTab() {
  const comps = useAppStore((s) => s.comps);
  const setComps = useAppStore((s) => s.setComps);
  const [activeRadius, setActiveRadius] = useState("1 mi");

  useEffect(() => {
    if (comps.length === 0) setComps(MOCK_COMPS);
  }, [comps, setComps]);

  if (comps.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-1.5">
        {["1 mi", "24 months", "±50% ac", "C-2 only"].map((filter) => (
          <button
            key={filter}
            onClick={() => filter.includes("mi") && setActiveRadius(filter)}
            className={`rounded border px-2 py-1 font-mono text-[8px] tracking-wide transition-colors ${
              (filter === activeRadius || filter === "24 months") 
                ? "bg-accent-dim text-accent border-accent/25" 
                : "bg-ink4 text-mid border-line2 hover:text-bright"
            }`}
          >
            {filter}
          </button>
        ))}
        <div className="ml-auto self-center font-mono text-[8px] text-pd-muted">
          {comps.length} results
        </div>
      </div>

      {/* Comps Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-[9px]">
          <thead>
            <tr className="border-b border-line text-left font-mono text-[8px] uppercase tracking-wider text-pd-muted">
              <th className="py-2 pr-2 font-normal">Address</th>
              <th className="py-2 px-2 font-normal">Dist</th>
              <th className="py-2 px-2 font-normal">Acres</th>
              <th className="py-2 px-2 font-normal">Date</th>
              <th className="py-2 px-2 font-normal">Price</th>
              <th className="py-2 pl-2 font-normal">$/SF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {comps.map((comp) => (
              <tr key={comp.id} className="group hover:bg-ink3 cursor-pointer">
                <td className="py-2 pr-2 text-text">{comp.address}</td>
                <td className="py-2 px-2 text-mid">{comp.distance}mi</td>
                <td className="py-2 px-2 text-text">{comp.acres}</td>
                <td className="py-2 px-2 text-mid">{comp.date}</td>
                <td className="py-2 px-2 text-amber">{formatCurrency(comp.price)}</td>
                <td className="py-2 pl-2 text-mid">${comp.psf}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Value Summary */}
      <div className="rounded-lg border-l-2 border-l-violet border-line2 bg-ink3 p-3 mt-2">
        <div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-violet">
          AI Value Summary
        </div>
        <p className="font-mono text-[9px] leading-relaxed text-text">
          Based on 4 comparable C-2 sales within 1 mile (10–24 months), similar parcels traded between $10.40–$14.90/SF. At 2.14 acres, the implied range for this site is <span className="text-amber">$1.06M – $1.51M</span>. The subject's $13.30/SF last sale price sits at the median of this comp set.
        </p>
      </div>
    </div>
  );
}
