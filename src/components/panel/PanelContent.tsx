"use client";

import { useAppStore } from "@/store/useAppStore";
import ParcelDataTab from "./ParcelDataTab";
import ScoreTab from "./ScoreTab";
import ZoningTab from "./ZoningTab";
import CompsTab from "./CompsTab";
import PanelTabs from "./PanelTabs";
import PanelActionBar from "./PanelActionBar";
import EntityLookupCard from "./EntityLookupCard";
// DC mode
import DCPanelTabs from "./DCPanelTabs";
import DCScoreTab from "./DCScoreTab";
import PowerTab from "./PowerTab";
import FiberTab from "./FiberTab";
import WaterTab from "./WaterTab";
import EnvironTab from "./EnvironTab";

export default function PanelContent() {
  const parcel = useAppStore((s) => s.selectedParcel);
  const loading = useAppStore((s) => s.parcelLoading);
  const activeTab = useAppStore((s) => s.activeTab);
  const appMode = useAppStore((s) => s.appMode);
  const dcActiveTab = useAppStore((s) => s.dcActiveTab);

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
        {appMode === "datacenter"
          ? "Select a parcel to run DC analysis"
          : "No parcel selected"}
      </div>
    );
  }

  // ── Data Center Mode ──────────────────────────────────────────────────────
  if (appMode === "datacenter") {
    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b border-orange-500/20 bg-orange-500/5 px-4 pb-3 pt-4 flex-shrink-0">
          <h2 className="text-[13px] font-semibold leading-tight text-bright">
            {parcel.site_address ?? "Unknown Address"}
          </h2>
          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-orange-400/70">
            {parcel.apn} &middot; {parcel.county} County &middot; Data Center Analysis
          </p>
        </div>

        {/* DC Tabs */}
        <DCPanelTabs />

        {/* DC Tab content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {dcActiveTab === "dc-score" && <DCScoreTab />}
          {dcActiveTab === "power"    && <PowerTab />}
          {dcActiveTab === "fiber"    && <FiberTab />}
          {dcActiveTab === "water"    && <WaterTab />}
          {dcActiveTab === "environ"  && <EnvironTab />}
        </div>
      </div>
    );
  }

  // ── Dev Mode (standard) ───────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-line px-4 pb-3 pt-4 flex-shrink-0">
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
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {activeTab === "data" && (
          <div className="space-y-6">
            <ParcelDataTab parcel={parcel} />
            {parcel.owner_name && (
              <EntityLookupCard ownerName={parcel.owner_name} />
            )}
          </div>
        )}
        {activeTab === "score" && <ScoreTab />}
        {activeTab === "zoning" && <ZoningTab />}
        {activeTab === "comps" && <CompsTab />}
      </div>

      {/* Action bar */}
      <PanelActionBar />
    </div>
  );
}
