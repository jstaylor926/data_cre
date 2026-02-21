"use client";

import { useState, useRef, useEffect } from "react";
import { Heart, Building2, FileText, GitCompare, Check, Plus } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useSavedParcels } from "@/hooks/useSavedParcels";
import { useCollections } from "@/hooks/useCollections";

export default function PanelActionBar() {
  const selectedAPN = useAppStore((s) => s.selectedAPN);
  const setEntityLookupOpen = useAppStore((s) => s.setEntityLookupOpen);
  const { savedParcels, isSaved, save, unsave } = useSavedParcels();
  const { collections, create } = useCollections();

  const [showCollPopup, setShowCollPopup] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const popupRef = useRef<HTMLDivElement>(null);

  const saved = selectedAPN ? isSaved(selectedAPN) : false;

  // Close popup on outside click
  useEffect(() => {
    if (!showCollPopup) return;
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowCollPopup(false);
        setCreatingNew(false);
        setNewName("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showCollPopup]);

  const handleSaveClick = async () => {
    if (!selectedAPN) return;
    if (saved) {
      await unsave(selectedAPN);
      setShowCollPopup(false);
    } else if (collections.length > 0) {
      setShowCollPopup(true);
    } else {
      await save(selectedAPN);
    }
  };

  const handleSaveToCollection = async (collectionId: string | null) => {
    if (!selectedAPN) return;
    await save(selectedAPN, undefined, collectionId ?? undefined);
    setShowCollPopup(false);
  };

  const handleCreateAndSave = async () => {
    const trimmed = newName.trim();
    if (!trimmed || !selectedAPN) return;
    const col = await create(trimmed);
    if (col) {
      await save(selectedAPN, undefined, col.id);
    }
    setNewName("");
    setCreatingNew(false);
    setShowCollPopup(false);
  };

  // Find which collection the current parcel is saved to
  const currentSaved = selectedAPN
    ? savedParcels.find((sp) => sp.apn === selectedAPN)
    : null;

  return (
    <div className="relative flex gap-1.5 border-t border-line px-3.5 py-2.5 flex-shrink-0">
      {/* Save button */}
      <button
        onClick={handleSaveClick}
        className={`flex h-[30px] flex-1 items-center justify-center gap-1.5 rounded font-mono text-[8px] uppercase tracking-wider transition-colors ${
          saved
            ? "bg-amber text-ink font-semibold"
            : "bg-teal text-ink font-semibold"
        }`}
      >
        <Heart size={10} fill={saved ? "currentColor" : "none"} />
        {saved ? "Saved" : "Save"}
      </button>

      {/* LLC button */}
      <button
        onClick={() => setEntityLookupOpen(true)}
        className="flex h-[30px] flex-1 items-center justify-center gap-1 rounded border border-line2 bg-ink4 font-mono text-[8px] uppercase tracking-wider text-mid transition-colors hover:border-teal hover:text-teal"
      >
        <Building2 size={10} />
        LLC &rarr;
      </button>

      {/* Compare (ghost — Phase 1 placeholder) */}
      <button
        disabled
        className="flex h-[30px] flex-[0.8] items-center justify-center gap-1 rounded border border-line bg-transparent font-mono text-[8px] uppercase tracking-wider text-pd-muted/50 cursor-not-allowed"
      >
        <GitCompare size={9} />
        Compare
      </button>

      {/* Brief (ghost — Phase 1 placeholder) */}
      <button
        disabled
        className="flex h-[30px] flex-[0.8] items-center justify-center gap-1 rounded border border-line bg-transparent font-mono text-[8px] uppercase tracking-wider text-pd-muted/50 cursor-not-allowed"
      >
        <FileText size={9} />
        Brief
      </button>

      {/* Collection popup */}
      {showCollPopup && (
        <div
          ref={popupRef}
          className="absolute bottom-full left-3 mb-2 w-[190px] rounded-lg border border-line2 bg-ink2/97 p-2.5 shadow-xl"
        >
          <p className="mb-2 font-mono text-[8px] uppercase tracking-[0.12em] text-pd-muted">
            Save to Collection
          </p>

          <CollectionRow
            name="No collection"
            count={null}
            checked={false}
            onClick={() => handleSaveToCollection(null)}
          />

          {collections.map((col) => (
            <CollectionRow
              key={col.id}
              name={col.name}
              count={null}
              checked={currentSaved?.collection_id === col.id}
              onClick={() => handleSaveToCollection(col.id)}
            />
          ))}

          {creatingNew ? (
            <div className="mt-1.5 flex items-center gap-1 border-t border-line pt-1.5">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateAndSave();
                  if (e.key === "Escape") {
                    setCreatingNew(false);
                    setNewName("");
                  }
                }}
                placeholder="Collection name..."
                className="h-5 flex-1 rounded border border-line2 bg-ink3 px-1.5 font-mono text-[9px] text-bright placeholder:text-pd-muted focus:border-teal focus:outline-none"
              />
            </div>
          ) : (
            <button
              onClick={() => setCreatingNew(true)}
              className="mt-1.5 flex w-full items-center gap-1.5 border-t border-line pt-1.5 font-mono text-[8px] text-pd-muted transition-colors hover:text-mid"
            >
              <Plus size={8} />
              <span>New Collection</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CollectionRow({
  name,
  count,
  checked,
  onClick,
}: {
  name: string;
  count: number | null;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded px-1 py-1.5 transition-colors hover:bg-ink3"
    >
      <div
        className={`flex h-3 w-3 shrink-0 items-center justify-center rounded-sm border text-[7px] ${
          checked
            ? "border-teal bg-teal text-ink"
            : "border-line2 bg-transparent"
        }`}
      >
        {checked && <Check size={8} />}
      </div>
      <span className="flex-1 text-left font-mono text-[9px] text-text">
        {name}
      </span>
      {count !== null && (
        <span className="font-mono text-[8px] text-pd-muted">{count}</span>
      )}
    </button>
  );
}
