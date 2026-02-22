"use client";

import { useState, useEffect, useRef } from "react";
import { Building2, ChevronRight, FlaskConical, Loader2, Check } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { EntityResult, Parcel } from "@/lib/types";
import { formatAcres } from "@/lib/formatters";

interface EntityLookupCardProps {
  ownerName: string;
}

export default function EntityLookupCard({ ownerName }: EntityLookupCardProps) {
  const [result, setResult] = useState<EntityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const selectParcel = useAppStore((s) => s.selectParcel);
  const entityLookupOpen = useAppStore((s) => s.entityLookupOpen);
  const setEntityLookupOpen = useAppStore((s) => s.setEntityLookupOpen);
  const cardRef = useRef<HTMLDivElement>(null);

  const isLLC =
    ownerName.includes("LLC") ||
    ownerName.includes("Inc") ||
    ownerName.includes("Corp") ||
    ownerName.includes("Partners") ||
    ownerName.includes("Group");

  const doLookup = async () => {
    if (result) {
      setExpanded(!expanded);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/entity/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ llc_name: ownerName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Lookup failed");
      }

      const data: EntityResult = await res.json();
      setResult(data);
      setExpanded(true);
    } catch (err) {
      const msg = (err as Error).message;
      setError(
        msg === "Entity not found"
          ? "Not in demo dataset — GA SOS integration planned for Phase 3"
          : msg
      );
    } finally {
      setLoading(false);
    }
  };

  // Auto-trigger when LLC button in action bar is clicked
  useEffect(() => {
    if (entityLookupOpen && isLLC && !result && !loading) {
      doLookup();
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else if (entityLookupOpen && result && !expanded) {
      setExpanded(true);
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    // Reset store flag after handling
    if (entityLookupOpen) {
      setEntityLookupOpen(false);
    }
  }, [entityLookupOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isLLC) return null;

  return (
    <div ref={cardRef} className="border-t border-line">
      {/* Trigger button */}
      <button
        onClick={doLookup}
        disabled={loading}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-ink3"
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin text-teal" />
        ) : result ? (
          <Check size={14} className="text-teal" />
        ) : (
          <Building2 size={14} className="text-teal" />
        )}
        <span className="flex-1 font-mono text-[10px] uppercase tracking-wider text-mid">
          {result ? "Entity Details" : "Lookup Entity"}
        </span>
        {result && (
          <ChevronRight
            size={12}
            className={`text-pd-muted transition-transform ${
              expanded ? "rotate-90" : ""
            }`}
          />
        )}
      </button>

      {/* Expanded result */}
      {expanded && result && (
        <div className="border-t border-line bg-ink3/50 px-4 py-3">
          {/* Entity info */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-medium text-bright">
                {result.llc_name}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider ${
                  result.status?.includes("Active")
                    ? "border border-green/20 bg-green/10 text-green"
                    : "bg-amber-dim text-amber"
                }`}
              >
                {result.status?.includes("Active") ? "Active" : result.status}
              </span>
              <span className="ml-auto flex items-center gap-1 rounded border border-violet/20 bg-violet/10 px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-wider text-violet/70">
                <FlaskConical size={8} />
                Demo
              </span>
            </div>

            <EntityRow label="Principal" value={result.principal_name} />
            <EntityRow label="Agent" value={result.agent_name} />
            <EntityRow label="Formed" value={result.formed_date} />
            <EntityRow label="State" value={result.state} />
          </div>

          {/* Related properties */}
          {result.related_parcels.length > 1 && (
            <div className="mt-3 border-t border-line pt-3">
              <h4 className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-pd-muted">
                Related Properties ({result.related_parcels.length})
              </h4>
              <div className="flex flex-col gap-1">
                {result.related_parcels.map((p) => (
                  <RelatedParcelRow
                    key={p.apn}
                    parcel={p}
                    onSelect={() => selectParcel(p.apn)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="border-t border-line px-4 py-2 text-[10px] text-red">
          {error}
        </div>
      )}
    </div>
  );
}

function EntityRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="font-mono text-[9px] text-mid">{label}</span>
      <span className="text-right text-[11px] text-text">{value ?? "\u2014"}</span>
    </div>
  );
}

function RelatedParcelRow({
  parcel,
  onSelect,
}: {
  parcel: Parcel;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-ink4"
    >
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-[10px] text-text">
          {parcel.site_address}
        </p>
        <p className="font-mono text-[8px] text-pd-muted">
          {parcel.zoning} &middot; {formatAcres(parcel.acres)}
        </p>
      </div>
      <ChevronRight size={10} className="shrink-0 text-pd-muted" />
    </button>
  );
}
