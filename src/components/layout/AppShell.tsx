"use client";

import { useResponsive } from "@/hooks/useResponsive";
import { useAppStore } from "@/store/useAppStore";
import { useParcelClick } from "@/hooks/useParcelClick";
import TopBar from "./TopBar";
import MobileTabBar from "./MobileTabBar";
import dynamic from "next/dynamic";
import ParcelPanel from "@/components/panel/ParcelPanel";
import ParcelDrawer from "@/components/panel/ParcelDrawer";
import MapControls from "@/components/map/MapControls";
import MapHUD from "@/components/map/MapHUD";
import { SiteScoutPanel } from "@/components/scout/SiteScoutPanel";

const ParcelMap = dynamic(() => import("@/components/map/ParcelMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-zinc-950 flex items-center justify-center">
      <div className="text-zinc-600 text-sm">Loading map...</div>
    </div>
  ),
});

export default function AppShell() {
  const { isMobile } = useResponsive();
  const panelOpen = useAppStore((s) => s.panelOpen);
  const scoutMode = useAppStore((s) => s.scoutMode);

  // Wire up parcel click → fetch
  useParcelClick();

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      <TopBar />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Scout Panel (left side) */}
        {scoutMode && !isMobile && <SiteScoutPanel />}

        {/* Map */}
        <div className="flex-1 relative">
          <ParcelMap />
          <MapControls />
          <MapHUD />
        </div>

        {/* Detail Panel (right side) - desktop */}
        {!isMobile && panelOpen && <ParcelPanel />}

        {/* Detail Drawer - mobile */}
        {isMobile && panelOpen && <ParcelDrawer />}
      </div>
      {isMobile && <MobileTabBar />}
    </div>
  );
}
