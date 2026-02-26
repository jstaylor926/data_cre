"use client";

import { useCallback, useRef, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import MobileTabBar from "@/components/layout/MobileTabBar";
import AppShell from "@/components/layout/AppShell";
import { CRMDashboard } from "@/components/crm/CRMDashboard";
import SavedPropertiesList from "@/components/saved/SavedPropertiesList";
import { useParcelClick } from "@/hooks/useParcelClick";
import { useResponsive } from "@/hooks/useResponsive";
import { useAppStore } from "@/store/useAppStore";
import type { MapHandle } from "@/components/map/ParcelMap";
import { Bell, Settings, Briefcase } from "lucide-react";

export default function Phase4Dashboard() {
  useParcelClick();
  const { isMobile } = useResponsive();
  const [activeNav, setActiveNav] = useState("crm");
  const mapRef = useRef<MapHandle>(null);
  const selectParcel = useAppStore((s) => s.selectParcel);

  const handleFlyTo = useCallback((lng: number, lat: number) => {
    mapRef.current?.flyTo(lng, lat);
  }, []);

  const handleSelectSavedParcel = useCallback(
    (apn: string, centroid?: [number, number]) => {
      setActiveNav("map");
      if (centroid) {
        mapRef.current?.flyTo(centroid[0], centroid[1]);
      }
      setTimeout(() => selectParcel(apn), 300);
    },
    [selectParcel]
  );

  const handleNavChange = useCallback((nav: string) => {
    setActiveNav(nav);
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col bg-ink">
      <TopBar
        onFlyTo={handleFlyTo}
        activeNav={activeNav}
        onNavChange={handleNavChange}
      />

      {activeNav === "map" && (
        <AppShell mapRef={mapRef} />
      )}

      {activeNav === "crm" && (
        <div className="flex-1 overflow-hidden">
          <CRMDashboard />
        </div>
      )}

      {activeNav === "saved" && (
        <div className="flex-1 overflow-y-auto">
          <SavedPropertiesList onSelectParcel={handleSelectSavedParcel} />
        </div>
      )}

      {isMobile && (
        <MobileTabBar activeTab={activeNav} onTabChange={handleNavChange} />
      )}
    </div>
  );
}
