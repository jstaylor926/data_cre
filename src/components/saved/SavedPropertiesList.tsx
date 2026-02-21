"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Bookmark, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useSavedParcels } from "@/hooks/useSavedParcels";
import { useCollections } from "@/hooks/useCollections";
import type { Parcel, Collection } from "@/lib/types";
import SavedPropertyRow from "./SavedPropertyRow";

interface SavedPropertiesListProps {
  onSelectParcel?: (apn: string, centroid?: [number, number]) => void;
}

export default function SavedPropertiesList({
  onSelectParcel,
}: SavedPropertiesListProps) {
  const { savedParcels, loading: savedLoading, updateNotes, moveToCollection } = useSavedParcels();
  const { collections, loading: colLoading, create, rename, remove } = useCollections();
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState("");

  // Collection management state
  const [menuCollId, setMenuCollId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Batch-fetched parcel data from county
  const [parcelData, setParcelData] = useState<Record<string, Parcel & { centroid?: [number, number] }>>({});

  const loading = savedLoading || colLoading;

  // Fetch real parcel data for all saved APNs
  useEffect(() => {
    if (savedParcels.length === 0) return;

    const pins = savedParcels.map((sp) => sp.apn).join(",");
    fetch(`/api/parcel/batch?pins=${encodeURIComponent(pins)}`)
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => setParcelData(data))
      .catch(() => {});
  }, [savedParcels]);

  // Close collection menu on outside click
  useEffect(() => {
    if (!menuCollId) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuCollId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuCollId]);

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

  const handleRename = async (col: Collection) => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === col.name) {
      setRenamingId(null);
      return;
    }
    await rename(col.id, trimmed);
    setRenamingId(null);
  };

  const handleDelete = async (col: Collection) => {
    const count = collectionCounts[col.id] || 0;
    const msg = count > 0
      ? `Delete "${col.name}"? ${count} parcel(s) will be moved to unsorted.`
      : `Delete "${col.name}"?`;
    if (confirm(msg)) {
      if (activeCollection === col.id) setActiveCollection(null);
      await remove(col.id);
    }
    setMenuCollId(null);
  };

  const handleSelect = useCallback(
    (apn: string) => {
      const centroid = parcelData[apn]?.centroid;
      onSelectParcel?.(apn, centroid);
    },
    [parcelData, onSelectParcel]
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-ink3" />
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
            <div key={col.id} className="relative shrink-0 flex items-center">
              {renamingId === col.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename(col);
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  onBlur={() => handleRename(col)}
                  className="h-6 w-28 rounded border border-teal bg-ink3 px-2 font-mono text-[9px] text-bright placeholder:text-pd-muted focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => setActiveCollection(col.id)}
                  className={`rounded px-2.5 py-1 font-mono text-[8px] uppercase tracking-wider transition-colors ${
                    activeCollection === col.id
                      ? "border border-teal bg-teal-dim text-teal"
                      : "border border-line2 text-pd-muted hover:text-mid"
                  }`}
                >
                  {col.name} ({collectionCounts[col.id] || 0})
                </button>
              )}

              {/* Collection menu trigger — show on active tab */}
              {activeCollection === col.id && renamingId !== col.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuCollId(menuCollId === col.id ? null : col.id);
                  }}
                  className="ml-0.5 rounded p-0.5 text-pd-muted hover:text-mid"
                >
                  <MoreHorizontal size={10} />
                </button>
              )}

              {/* Collection context menu */}
              {menuCollId === col.id && (
                <div
                  ref={menuRef}
                  className="absolute top-full left-0 z-50 mt-1 w-32 rounded-lg border border-line2 bg-ink2 p-1 shadow-xl"
                >
                  <button
                    onClick={() => {
                      setRenameValue(col.name);
                      setRenamingId(col.id);
                      setMenuCollId(null);
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left font-mono text-[9px] text-text transition-colors hover:bg-ink3"
                  >
                    <Pencil size={9} />
                    Rename
                  </button>
                  <button
                    onClick={() => handleDelete(col)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left font-mono text-[9px] text-red transition-colors hover:bg-ink3"
                  >
                    <Trash2 size={9} />
                    Delete
                  </button>
                </div>
              )}
            </div>
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
              const parcel = parcelData[sp.apn] ?? undefined;
              return (
                <SavedPropertyRow
                  key={sp.id}
                  savedParcel={sp}
                  parcel={parcel}
                  collections={collections}
                  onSelect={() => handleSelect(sp.apn)}
                  onUpdateNotes={(notes) => updateNotes(sp.apn, notes)}
                  onMoveToCollection={(colId) => moveToCollection(sp.apn, colId)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
