"use client";

import { useAppStore } from "@/store/useAppStore";
import ParcelDataTab from "./ParcelDataTab";
import PanelTabs from "./PanelTabs";
import PanelActionBar from "./PanelActionBar";
import EntityLookupCard from "./EntityLookupCard";

export default function PanelContent() {
  const parcel = useAppStore((s) => s.selectedParcel);
  const loading = useAppStore((s) => s.parcelLoading);
  const activeTab = useAppStore((s) => s.activeTab);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="h-5 w-3/4 animate-pulse rounded bg-ink3" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-ink3" />
        <div className="mt-4 h-px bg-line" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 w-1/4 animate-pulse rounded bg-ink3" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-ink3" />
          </div>
        ))}
      </div>
    );
  }

  if (!parcel) {
    return (
      <div className="flex items-center justify-center p-8 text-mid">
        No parcel selected
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-line px-4 pb-3 pt-4">
        <h2 className="text-[13px] font-semibold leading-tight text-bright">
          {parcel.site_address ?? "Unknown Address"}
        </h2>
        <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-pd-muted">
          {parcel.apn} &middot; {parcel.county} County
        </p>
      </div>

      {/* Tabs */}
      <PanelTabs />

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "data" && (
          <>
            <ParcelDataTab parcel={parcel} />
            {parcel.owner_name && (
              <EntityLookupCard ownerName={parcel.owner_name} />
            )}
          </>
        )}
        {activeTab === "score" && (
          <LockedTab label="AI Score" />
        )}
        {activeTab === "zoning" && (
          <LockedTab label="Zoning AI" />
        )}
        {activeTab === "comps" && (
          <LockedTab label="Auto-Comps" />
        )}
      </div>

      {/* Action bar */}
      <PanelActionBar />
    </div>
  );
}

function LockedTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-8">
      <div className="flex h-8 w-8 items-center justify-center rounded border border-line2 text-pd-muted">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-pd-muted">
        {label} &middot; Phase 2
      </p>
    </div>
  );
}
