"use client";

import { useAppStore } from "@/store/useAppStore";
import { useComps } from "@/hooks/useComps";
import { formatCurrency } from "@/lib/formatters";

export default function CompsTab() {
  const selectedAPN = useAppStore((s) => s.selectedAPN);
  const { comps, loading, error } = useComps(selectedAPN);

  if (loading) {
    return (
      <div className="flex flex-col gap-3 animate-pulse p-2">
        <div className="flex gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 w-16 rounded bg-ink3" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-ink3" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="font-mono text-[9px] text-mid">{error}</p>
      </div>
    );
  }

  if (comps.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="font-mono text-[10px] text-mid">No comparable properties found within 1 mile.</p>
        <p className="mt-1 font-mono text-[9px] text-pd-muted">
          Try selecting a parcel in a denser area or check that the APN is in Gwinnett County.
        </p>
      </div>
    );
  }

  // Compute value summary stats
  const prices = comps.map((c) => c.price);
  const psfs = comps.map((c) => c.psf).filter((v) => v > 0);
  const minPsf = psfs.length > 0 ? Math.min(...psfs) : null;
  const maxPsf = psfs.length > 0 ? Math.max(...psfs) : null;
  const avgPrice = prices.reduce((s, p) => s + p, 0) / prices.length;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-pd-muted">
          Comparable Properties
        </span>
        <span className="ml-auto font-mono text-[8px] text-pd-muted">
          {comps.length} within 1 mi · Same zoning class
        </span>
      </div>

      {/* Note about data source */}
      <div className="rounded border border-amber/20 bg-amber-dim px-2.5 py-1.5">
        <p className="font-mono text-[8px] text-amber/80">
          ⚠ Values shown are county assessed values, not sale prices. Gwinnett County open data does not include transaction history.
        </p>
      </div>

      {/* Comps Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-[9px]">
          <thead>
            <tr className="border-b border-line text-left font-mono text-[8px] uppercase tracking-wider text-pd-muted">
              <th className="py-2 pr-2 font-normal">Address</th>
              <th className="py-2 px-2 font-normal">Dist</th>
              <th className="py-2 px-2 font-normal">Acres</th>
              <th className="py-2 px-2 font-normal">Assessed</th>
              <th className="py-2 pl-2 font-normal">$/SF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {comps.map((comp) => (
              <tr key={comp.id} className="group hover:bg-ink3 cursor-pointer">
                <td className="py-2 pr-2 text-text max-w-[120px] truncate" title={comp.address}>
                  {comp.address}
                </td>
                <td className="py-2 px-2 text-mid">{comp.distance}mi</td>
                <td className="py-2 px-2 text-text">{comp.acres.toFixed(2)}</td>
                <td className="py-2 px-2 text-amber">{formatCurrency(comp.price)}</td>
                <td className="py-2 pl-2 text-mid">${comp.psf.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Value Summary */}
      {psfs.length > 0 && (
        <div className="rounded-lg border-l-2 border-l-violet border-line2 bg-ink3 p-3 mt-2">
          <div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-violet">
            Market Context
          </div>
          <p className="font-mono text-[9px] leading-relaxed text-text">
            {comps.length} same-zone parcels within 1 mi. Assessed value range:{" "}
            <span className="text-amber">
              ${minPsf?.toFixed(2)}–${maxPsf?.toFixed(2)}/SF
            </span>
            . Average assessed total:{" "}
            <span className="text-amber">{formatCurrency(Math.round(avgPrice))}</span>.
            Note: assessed values typically lag market by 10–30%.
          </p>
        </div>
      )}
    </div>
  );
}
