"use client";

import { useSavedParcels } from "@/hooks/useSavedParcels";
import SavedPropertyRow from "./SavedPropertyRow";
import { Bookmark, Loader2 } from "lucide-react";

export default function SavedPropertiesList() {
  const { savedParcels, loading } = useSavedParcels();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-5 w-5 text-teal-500 animate-spin" />
      </div>
    );
  }

  if (savedParcels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
        <Bookmark className="h-8 w-8 mb-2" />
        <p className="text-sm">No saved properties</p>
        <p className="text-xs">Save parcels from the map to track them here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {savedParcels.map((sp) => (
        <SavedPropertyRow key={sp.id} savedParcel={sp} />
      ))}
    </div>
  );
}
