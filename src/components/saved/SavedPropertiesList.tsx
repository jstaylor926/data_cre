"use client";

import { Bookmark } from "lucide-react";
import { useSavedParcels } from "@/hooks/useSavedParcels";
import SavedPropertyRow from "./SavedPropertyRow";
import { getParcelByAPN } from "@/lib/mock-data";

interface SavedPropertiesListProps {
  onSelectParcel?: (apn: string) => void;
}

export default function SavedPropertiesList({ onSelectParcel }: SavedPropertiesListProps) {
  const { savedParcels, loading } = useSavedParcels();

  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded bg-ink3" />
        ))}
      </div>
    );
  }

  if (savedParcels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-12">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-line2 text-pd-muted">
          <Bookmark size={18} />
        </div>
        <div className="text-center">
          <p className="text-[13px] text-text">No saved properties</p>
          <p className="mt-1 font-mono text-[10px] text-pd-muted">
            Click the save button on any parcel to bookmark it
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4">
      <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-pd-muted">
        Saved Properties ({savedParcels.length})
      </h2>
      <div className="flex flex-col gap-2">
        {savedParcels.map((sp) => {
          const parcel = getParcelByAPN(sp.apn);
          return (
            <SavedPropertyRow
              key={sp.id}
              savedParcel={sp}
              parcel={parcel ?? undefined}
              onSelect={() => onSelectParcel?.(sp.apn)}
            />
          );
        })}
      </div>
    </div>
  );
}
