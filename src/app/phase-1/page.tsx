"use client";

import { useCallback, useRef, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import MobileTabBar from "@/components/layout/MobileTabBar";
import AppShell from "@/components/layout/AppShell";
import { useParcelClick } from "@/hooks/useParcelClick";
import { useResponsive } from "@/hooks/useResponsive";
import type { MapHandle } from "@/components/map/ParcelMap";

export default function Phase1Dashboard() {
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

      {isMobile && (
        <MobileTabBar activeTab={activeNav} onTabChange={setActiveNav} />
      )}
    </div>
  );
}
