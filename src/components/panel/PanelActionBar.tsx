"use client";

import { useState, useRef, useEffect } from "react";
import { Heart, Building2, FileText, GitCompare, Check, Plus, Briefcase } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useSavedParcels } from "@/hooks/useSavedParcels";
import { useCollections } from "@/hooks/useCollections";
import { useAuth } from "@/components/auth/AuthProvider";

export default function PanelActionBar() {
  const selectedAPN = useAppStore((s) => s.selectedAPN);
  const setEntityLookupOpen = useAppStore((s) => s.setEntityLookupOpen);
  const setBriefOverlayOpen = useAppStore((s) => s.setBriefOverlayOpen);
  const setBriefStatus = useAppStore((s) => s.setBriefStatus);
  const siteScore = useAppStore((s) => s.siteScore);
  const activeProject = useAppStore((s) => s.activeProject);
  const features = useAppStore((s) => s.features);
  const { openAuthModal } = useAuth();
  
  const {
    savedParcels,
    authRequired: savedAuthRequired,
    accessDenied: savedAccessDenied,
    isSaved,
    save,
    unsave,
  } = useSavedParcels();
  const {
    collections,
    authRequired: collectionsAuthRequired,
    accessDenied: collectionsAccessDenied,
    create,
  } = useCollections();
  const authRequired = savedAuthRequired || collectionsAuthRequired;
  const accessDenied = savedAccessDenied || collectionsAccessDenied;

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
    if (authRequired) {
      openAuthModal();
      return;
    }
    if (accessDenied) return;
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
        disabled={accessDenied}
        className={`flex h-[30px] flex-1 items-center justify-center gap-1.5 rounded font-mono text-[8px] uppercase tracking-wider transition-colors ${
          accessDenied
            ? "cursor-not-allowed bg-ink4 text-mid"
            : authRequired
            ? "border border-teal bg-teal-dim text-teal"
            : saved
            ? "bg-amber text-ink font-semibold"
            : "bg-teal text-ink font-semibold"
        }`}
      >
        <Heart size={10} fill={saved ? "currentColor" : "none"} />
        {accessDenied ? "No Access" : authRequired ? "Sign In" : saved ? "Saved" : "Save"}
      </button>

      {/* LLC button */}
      {features.enableEntityLookup && (
        <button
          onClick={() => setEntityLookupOpen(true)}
          className="flex h-[30px] flex-1 items-center justify-center gap-1 rounded border border-line2 bg-ink4 font-mono text-[8px] uppercase tracking-wider text-mid transition-colors hover:border-teal hover:text-teal"
        >
          <Building2 size={10} />
          LLC &rarr;
        </button>
      )}

      {/* Compare — coming soon tooltip */}
      <div className="group relative flex-[0.8]">
        <button
          className="flex h-[30px] w-full items-center justify-center gap-1 rounded border border-line/40 bg-transparent font-mono text-[8px] uppercase tracking-wider text-pd-muted/30 transition-colors hover:border-line hover:text-pd-muted/50"
        >
          <GitCompare size={9} />
          Compare
        </button>
        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 font-mono text-[8px] text-mid opacity-0 shadow-lg transition-opacity group-hover:opacity-100 border border-line2">
          Coming soon
        </span>
      </div>

      {/* Brief / Link logic */}
      {features.enableAIZoning ? (
        <button
          onClick={() => {
            setBriefStatus("generating");
            setBriefOverlayOpen(true);
          }}
          disabled={!siteScore}
          className="flex h-[30px] flex-[0.8] items-center justify-center gap-1 rounded border border-violet/40 bg-violet-dim font-mono text-[8px] uppercase tracking-wider text-violet transition-colors hover:border-violet disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FileText size={9} />
          Brief
        </button>
      ) : features.enableFirmIntel ? (
        <button
          onClick={() => {
            // Logic to link to active project
            console.log("Linking", selectedAPN, "to project", activeProject?.id);
          }}
          className="flex h-[30px] flex-[0.8] items-center justify-center gap-1 rounded border border-pd-teal/40 bg-pd-teal/10 font-mono text-[8px] uppercase tracking-wider text-pd-teal transition-colors hover:border-pd-teal"
        >
          <Briefcase size={9} />
          Link
        </button>
      ) : (
        <div className="group relative flex-[0.8]">
          <button
            className="flex h-[30px] w-full items-center justify-center gap-1 rounded border border-line/40 bg-transparent font-mono text-[8px] uppercase tracking-wider text-pd-muted/30 transition-colors hover:border-line hover:text-pd-muted/50"
          >
            <FileText size={9} />
            Brief
          </button>
          <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 font-mono text-[8px] text-mid opacity-0 shadow-lg transition-opacity group-hover:opacity-100 border border-line2">
            Coming soon
          </span>
        </div>
      )}

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
