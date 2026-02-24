"use client";

import { useAppStore } from "@/store/useAppStore";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PanelTabs from "./PanelTabs";
import ParcelDataTab from "./ParcelDataTab";
import DCScoreTab from "./DCScoreTab";
import ZoningTab from "./ZoningTab";
import CompsTab from "./CompsTab";
import PowerTab from "./PowerTab";
import FiberTab from "./FiberTab";
import WaterTab from "./WaterTab";
import EnvironTab from "./EnvironTab";
import PanelActionBar from "./PanelActionBar";

export default function PanelContent() {
  const selectedParcel = useAppStore((s) => s.selectedParcel);
  const parcelLoading = useAppStore((s) => s.parcelLoading);
  const activeTab = useAppStore((s) => s.activeTab);
  const clearSelection = useAppStore((s) => s.clearSelection);

  if (parcelLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-5 w-5 text-teal-500 animate-spin" />
      </div>
    );
  }

  if (!selectedParcel) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
        Select a parcel on the map
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            {selectedParcel.county} County
          </p>
          <h2 className="text-sm font-semibold text-zinc-100 mt-0.5">
            {selectedParcel.site_address ?? selectedParcel.apn}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            APN: {selectedParcel.apn} &middot; {selectedParcel.zoning ?? "N/A"}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-zinc-500 hover:text-zinc-300"
          onClick={clearSelection}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Action Bar */}
      <PanelActionBar />

      {/* Tabs */}
      <PanelTabs />

      {/* Tab Content */}
      <div className="px-4 pb-4">
        {activeTab === "data" && <ParcelDataTab />}
        {activeTab === "score" && <DCScoreTab />}
        {activeTab === "zoning" && <ZoningTab />}
        {activeTab === "comps" && <CompsTab />}
        {activeTab === "power" && <PowerTab />}
        {activeTab === "fiber" && <FiberTab />}
        {activeTab === "water" && <WaterTab />}
        {activeTab === "environ" && <EnvironTab />}
      </div>
    </div>
  );
}
