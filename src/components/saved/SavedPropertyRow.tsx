"use client";

import { ChevronRight } from "lucide-react";
import type { SavedParcel, Parcel } from "@/lib/types";
import { formatCurrency, formatAcres } from "@/lib/formatters";

interface SavedPropertyRowProps {
  savedParcel: SavedParcel;
  parcel?: Parcel;
  onSelect: () => void;
}

export default function SavedPropertyRow({
  savedParcel,
  parcel,
  onSelect,
}: SavedPropertyRowProps) {
  return (
    <button
      onClick={onSelect}
      className="flex items-center gap-3 rounded-lg border border-line bg-ink2 p-3 text-left transition-colors hover:border-line2 hover:bg-ink3"
    >
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-[12px] font-medium text-bright">
          {parcel?.site_address ?? savedParcel.apn}
        </p>
        <div className="mt-1 flex items-center gap-2">
          {parcel?.zoning && (
            <span className="rounded bg-teal-dim px-1.5 py-0.5 font-mono text-[8px] font-medium text-teal">
              {parcel.zoning}
            </span>
          )}
          <span className="font-mono text-[9px] text-mid">
            {formatAcres(parcel?.acres)}
          </span>
          <span className="font-mono text-[9px] text-mid">
            {formatCurrency(parcel?.assessed_total)}
          </span>
        </div>
        {savedParcel.notes && (
          <p className="mt-1 truncate text-[10px] text-mid italic">
            {savedParcel.notes}
          </p>
        )}
      </div>
      <ChevronRight size={14} className="shrink-0 text-pd-muted" />
    </button>
  );
}
