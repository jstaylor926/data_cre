"use client";

import { useAppStore } from "@/store/useAppStore";
import { MOCK_PARCELS } from "@/lib/mock-data";
import { formatCurrency, formatPricePerAcre, formatAcres } from "@/lib/formatters";

export default function CompsTab() {
  const selectedParcel = useAppStore((s) => s.selectedParcel);
  if (!selectedParcel) return null;

  // Find comparable parcels (same county, similar zoning category)
  const zoningCategory = selectedParcel.zoning?.[0]; // "I", "C", "A", etc.
  const comps = MOCK_PARCELS.filter(
    (p) =>
      p.apn !== selectedParcel.apn &&
      p.county === selectedParcel.county &&
      p.zoning?.[0] === zoningCategory &&
      p.last_sale_price != null
  ).slice(0, 5);

  return (
    <div className="space-y-4 mt-3">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
          Comparable Land Sales
        </p>
        <p className="text-xs text-zinc-500">
          {comps.length} comparables in {selectedParcel.county} County
          {zoningCategory ? ` (${zoningCategory}-zone)` : ""}
        </p>
      </div>

      {/* Subject Property */}
      <div className="bg-teal-600/10 rounded p-3 border border-teal-500/20">
        <p className="text-[10px] text-teal-400 mb-1">Subject Property</p>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-300">{selectedParcel.apn}</span>
          <span className="text-zinc-200 font-medium">
            {formatPricePerAcre(selectedParcel.last_sale_price, selectedParcel.acres)}
          </span>
        </div>
        <div className="flex justify-between text-xs text-zinc-500 mt-0.5">
          <span>{formatAcres(selectedParcel.acres)}</span>
          <span>{formatCurrency(selectedParcel.last_sale_price)}</span>
        </div>
      </div>

      {/* Comps */}
      {comps.length === 0 ? (
        <div className="text-xs text-zinc-500 py-4 text-center">
          No comparable sales found in this sub-market
        </div>
      ) : (
        <div className="space-y-2">
          {comps.map((c) => (
            <div
              key={c.apn}
              className="bg-zinc-900 rounded p-3 border border-zinc-800"
            >
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300">
                  {c.site_address ?? c.apn}
                </span>
                <span className="text-zinc-200 font-medium">
                  {formatPricePerAcre(c.last_sale_price, c.acres)}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-zinc-500 mt-0.5">
                <span>
                  {formatAcres(c.acres)} &middot; {c.zoning}
                </span>
                <span>{formatCurrency(c.last_sale_price)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Price per MW estimate */}
      {selectedParcel.last_sale_price && selectedParcel.acres && (
        <div className="bg-zinc-900 rounded p-3 border border-zinc-800">
          <p className="text-[10px] text-zinc-500 mb-1">
            Theoretical DC Metrics
          </p>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Price per MW (est.)</span>
            <span className="text-zinc-200 font-medium">
              {formatCurrency(
                selectedParcel.last_sale_price /
                  (selectedParcel.acres * 6)
              )}
              /MW
            </span>
          </div>
          <p className="text-[10px] text-zinc-600 mt-1">
            Based on ~6 MW/acre density estimate
          </p>
        </div>
      )}
    </div>
  );
}
