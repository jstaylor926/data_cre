"use client";

import { useCallback, useRef, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import MobileTabBar from "@/components/layout/MobileTabBar";
import AppShell from "@/components/layout/AppShell";
import BriefOverlay from "@/components/panel/BriefOverlay";
import { useParcelClick } from "@/hooks/useParcelClick";
import { useResponsive } from "@/hooks/useResponsive";
import type { MapHandle } from "@/components/map/ParcelMap";
import { useAppStore } from "@/store/useAppStore";
import { useEffect } from "react";

export default function Phase2Dashboard() {
  useParcelClick();
  const { isMobile } = useResponsive();
  const [activeNav, setActiveNav] = useState("map");
  const mapRef = useRef<MapHandle>(null);

  const handleFlyTo = useCallback((lng: number, lat: number) => {
    mapRef.current?.flyTo(lng, lat);
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col bg-ink">
      <TopBar
        onFlyTo={handleFlyTo}
        activeNav={activeNav}
        onNavChange={setActiveNav}
      />

      <AppShell mapRef={mapRef} />
      <BriefOverlay />

      {isMobile && (
        <MobileTabBar activeTab={activeNav} onTabChange={setActiveNav} />
      )}
    </div>
  );
}
