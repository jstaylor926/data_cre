"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronRight, Pencil, FolderOpen, User, Check, X } from "lucide-react";
import type { SavedParcel, Parcel, Collection } from "@/lib/types";
import { formatCurrency, formatAcres, formatDate } from "@/lib/formatters";

interface SavedPropertyRowProps {
  savedParcel: SavedParcel;
  parcel?: Parcel;
  collections: Collection[];
  onSelect: () => void;
  onUpdateNotes: (notes: string) => void;
  onMoveToCollection: (collectionId: string | null) => void;
}

export default function SavedPropertyRow({
  savedParcel,
  parcel,
  collections,
  onSelect,
  onUpdateNotes,
  onMoveToCollection,
}: SavedPropertyRowProps) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [noteValue, setNoteValue] = useState(savedParcel.notes || "");
  const [showCollMenu, setShowCollMenu] = useState(false);
  const collMenuRef = useRef<HTMLDivElement>(null);

  // Close collection menu on outside click
  useEffect(() => {
    if (!showCollMenu) return;
    function handleClick(e: MouseEvent) {
      if (collMenuRef.current && !collMenuRef.current.contains(e.target as Node)) {
        setShowCollMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showCollMenu]);

  const handleSaveNotes = () => {
    onUpdateNotes(noteValue.trim());
    setEditingNotes(false);
  };

  const handleCancelNotes = () => {
    setNoteValue(savedParcel.notes || "");
    setEditingNotes(false);
  };

  const currentCollName = savedParcel.collection_id
    ? collections.find((c) => c.id === savedParcel.collection_id)?.name
    : null;

  return (
    <div className="rounded-lg border border-line bg-ink2 transition-colors hover:border-line2">
      {/* Main row — clickable to open on map */}
      <button
        onClick={onSelect}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <div className="flex-1 overflow-hidden">
          {/* Address */}
          <p className="truncate text-[12px] font-medium text-bright">
            {parcel?.site_address ?? savedParcel.apn}
          </p>

          {/* Owner */}
          {parcel?.owner_name && (
            <div className="mt-0.5 flex items-center gap-1">
              <User size={9} className="text-pd-muted" />
              <span className="truncate text-[10px] text-mid">
                {parcel.owner_name}
              </span>
            </div>
          )}

          {/* Badges: zoning, acres, value */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {parcel?.zoning && (
              <span className="rounded bg-teal-dim px-1.5 py-0.5 font-mono text-[8px] font-medium text-teal">
                {parcel.zoning}
              </span>
            )}
            {parcel?.acres != null && (
              <span className="font-mono text-[9px] text-mid">
                {formatAcres(parcel.acres)}
              </span>
            )}
            {parcel?.assessed_total != null && (
              <span className="font-mono text-[9px] text-amber">
                {formatCurrency(parcel.assessed_total)}
              </span>
            )}
            <span className="font-mono text-[8px] text-pd-muted">
              {formatDate(savedParcel.created_at)}
            </span>
          </div>

          {/* Notes (read-only display) */}
          {savedParcel.notes && !editingNotes && (
            <p className="mt-1 truncate text-[10px] text-mid/70 italic">
              {savedParcel.notes}
            </p>
          )}
        </div>
        <ChevronRight size={14} className="shrink-0 text-pd-muted" />
      </button>

      {/* Action bar */}
      <div className="flex items-center gap-1 border-t border-line px-3 py-1.5">
        {/* Edit notes button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditingNotes(!editingNotes);
            setNoteValue(savedParcel.notes || "");
          }}
          className={`flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[8px] transition-colors ${
            editingNotes
              ? "bg-teal-dim text-teal"
              : "text-pd-muted hover:text-mid"
          }`}
        >
          <Pencil size={8} />
          {savedParcel.notes ? "Edit note" : "Add note"}
        </button>

        {/* Move to collection */}
        <div className="relative" ref={collMenuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCollMenu(!showCollMenu);
            }}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[8px] text-pd-muted transition-colors hover:text-mid"
          >
            <FolderOpen size={8} />
            {currentCollName || "No collection"}
          </button>

          {showCollMenu && (
            <div className="absolute bottom-full left-0 z-50 mb-1 w-[160px] rounded-lg border border-line2 bg-ink2/97 p-1.5 shadow-xl">
              <p className="mb-1 px-1 font-mono text-[7px] uppercase tracking-[0.12em] text-pd-muted">
                Move to
              </p>
              <button
                onClick={() => {
                  onMoveToCollection(null);
                  setShowCollMenu(false);
                }}
                className={`flex w-full items-center gap-2 rounded px-1.5 py-1 text-left font-mono text-[9px] transition-colors hover:bg-ink3 ${
                  !savedParcel.collection_id ? "text-teal" : "text-text"
                }`}
              >
                {!savedParcel.collection_id && <Check size={8} />}
                <span className={!savedParcel.collection_id ? "" : "ml-4"}>
                  No collection
                </span>
              </button>
              {collections.map((col) => (
                <button
                  key={col.id}
                  onClick={() => {
                    onMoveToCollection(col.id);
                    setShowCollMenu(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded px-1.5 py-1 text-left font-mono text-[9px] transition-colors hover:bg-ink3 ${
                    savedParcel.collection_id === col.id ? "text-teal" : "text-text"
                  }`}
                >
                  {savedParcel.collection_id === col.id && <Check size={8} />}
                  <span className={savedParcel.collection_id === col.id ? "" : "ml-4"}>
                    {col.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PIN badge */}
        <span className="ml-auto font-mono text-[8px] text-pd-muted">
          {savedParcel.apn}
        </span>
      </div>

      {/* Notes editor (expanded) */}
      {editingNotes && (
        <div className="border-t border-line px-3 py-2">
          <textarea
            autoFocus
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSaveNotes();
              if (e.key === "Escape") handleCancelNotes();
            }}
            placeholder="Add a note about this property…"
            className="w-full resize-none rounded border border-line2 bg-ink3 p-2 font-mono text-[10px] text-text placeholder:text-pd-muted focus:border-teal focus:outline-none"
            rows={2}
          />
          <div className="mt-1.5 flex items-center gap-1.5">
            <button
              onClick={handleSaveNotes}
              className="flex items-center gap-1 rounded bg-teal px-2 py-0.5 font-mono text-[8px] font-semibold text-ink transition-colors hover:bg-teal/80"
            >
              <Check size={8} />
              Save
            </button>
            <button
              onClick={handleCancelNotes}
              className="flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[8px] text-pd-muted transition-colors hover:text-mid"
            >
              <X size={8} />
              Cancel
            </button>
            <span className="ml-auto font-mono text-[7px] text-pd-muted">
              Cmd+Enter to save
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
