"use client";

import { useState, useMemo } from "react";
import { Bookmark, Plus } from "lucide-react";
import { useSavedParcels } from "@/hooks/useSavedParcels";
import { useCollections } from "@/hooks/useCollections";
import { getParcelByAPN } from "@/lib/mock-data";
import SavedPropertyRow from "./SavedPropertyRow";

interface SavedPropertiesListProps {
  onSelectParcel?: (apn: string) => void;
}

export default function SavedPropertiesList({
  onSelectParcel,
}: SavedPropertiesListProps) {
  const { savedParcels, loading: savedLoading } = useSavedParcels();
  const { collections, loading: colLoading, create } = useCollections();
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState("");

  const loading = savedLoading || colLoading;

  // Filter parcels by active collection
  const filteredParcels = useMemo(() => {
    if (activeCollection === null) return savedParcels;
    return savedParcels.filter((sp) => sp.collection_id === activeCollection);
  }, [savedParcels, activeCollection]);

  // Count parcels per collection
  const collectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sp of savedParcels) {
      if (sp.collection_id) {
        counts[sp.collection_id] = (counts[sp.collection_id] || 0) + 1;
      }
    }
    return counts;
  }, [savedParcels]);

  const handleCreateCollection = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await create(trimmed);
    setNewName("");
    setCreatingNew(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded bg-ink3" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header with collection tabs */}
      <div className="border-b border-line bg-ink px-4 pb-2 pt-3">
        <h2 className="mb-2 font-head text-lg tracking-wider text-bright">
          Saved
        </h2>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {/* All tab */}
          <button
            onClick={() => setActiveCollection(null)}
            className={`shrink-0 rounded px-2.5 py-1 font-mono text-[8px] uppercase tracking-wider transition-colors ${
              activeCollection === null
                ? "border border-teal bg-teal-dim text-teal"
                : "border border-line2 text-pd-muted hover:text-mid"
            }`}
          >
            All ({savedParcels.length})
          </button>

          {/* Collection tabs */}
          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() => setActiveCollection(col.id)}
              className={`shrink-0 rounded px-2.5 py-1 font-mono text-[8px] uppercase tracking-wider transition-colors ${
                activeCollection === col.id
                  ? "border border-teal bg-teal-dim text-teal"
                  : "border border-line2 text-pd-muted hover:text-mid"
              }`}
            >
              {col.name} ({collectionCounts[col.id] || 0})
            </button>
          ))}

          {/* + New tab */}
          {creatingNew ? (
            <div className="flex shrink-0 items-center gap-1">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateCollection();
                  if (e.key === "Escape") {
                    setCreatingNew(false);
                    setNewName("");
                  }
                }}
                onBlur={() => {
                  if (!newName.trim()) {
                    setCreatingNew(false);
                    setNewName("");
                  }
                }}
                placeholder="Name…"
                className="h-6 w-24 rounded border border-teal bg-ink3 px-2 font-mono text-[9px] text-bright placeholder:text-pd-muted focus:outline-none"
              />
            </div>
          ) : (
            <button
              onClick={() => setCreatingNew(true)}
              className="flex shrink-0 items-center gap-1 rounded border border-dashed border-line2 px-2.5 py-1 font-mono text-[8px] uppercase tracking-wider text-pd-muted transition-colors hover:border-mid hover:text-mid"
            >
              <Plus size={8} />
              New
            </button>
          )}
        </div>
      </div>

      {/* Property list */}
      <div className="flex-1 overflow-y-auto bg-ink2">
        {filteredParcels.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 p-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-line2 text-pd-muted">
              <Bookmark size={18} />
            </div>
            <div className="text-center">
              <p className="text-[13px] text-text">No saved properties</p>
              <p className="mt-1 font-mono text-[10px] text-pd-muted">
                {activeCollection
                  ? "No properties in this collection"
                  : "Click the save button on any parcel to bookmark it"}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-4">
            {filteredParcels.map((sp) => {
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
        )}
      </div>
    </div>
  );
}
