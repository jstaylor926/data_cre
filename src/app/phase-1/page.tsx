"use client";

import { useCallback, useRef, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import MobileTabBar from "@/components/layout/MobileTabBar";
import AppShell from "@/components/layout/AppShell";
import SavedPropertiesList from "@/components/saved/SavedPropertiesList";
import { useParcelClick } from "@/hooks/useParcelClick";
import { useResponsive } from "@/hooks/useResponsive";
import { useAppStore } from "@/store/useAppStore";
import type { MapHandle } from "@/components/map/ParcelMap";
import { Bell, Settings } from "lucide-react";

export default function Phase1Dashboard() {
  useParcelClick();
  const { isMobile } = useResponsive();
  const [activeNav, setActiveNav] = useState("map");
  const mapRef = useRef<MapHandle>(null);
  const selectParcel = useAppStore((s) => s.selectParcel);

  const handleFlyTo = useCallback((lng: number, lat: number) => {
    mapRef.current?.flyTo(lng, lat);
  }, []);

  const handleSelectSavedParcel = useCallback(
    (apn: string) => {
      selectParcel(apn);
      setActiveNav("map");
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

      {/* View switching based on active nav */}
      {activeNav === "map" && <AppShell mapRef={mapRef} />}

      {activeNav === "saved" && (
        <div className="flex-1 overflow-y-auto">
          <SavedPropertiesList onSelectParcel={handleSelectSavedParcel} />
        </div>
      )}

      {activeNav === "alerts" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-line2 bg-ink3 text-pd-muted">
            <Bell size={22} />
          </div>
          <p className="text-[13px] text-text">No alerts yet</p>
          <p className="font-mono text-[10px] text-pd-muted">
            Property alerts will appear here
          </p>
        </div>
      )}

      {activeNav === "settings" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-line2 bg-ink3 text-pd-muted">
            <Settings size={22} />
          </div>
          <p className="text-[13px] text-text">Settings</p>
          <p className="font-mono text-[10px] text-pd-muted">
            Coming soon
          </p>
        </div>
      )}

      {isMobile && (
        <MobileTabBar activeTab={activeNav} onTabChange={handleNavChange} />
      )}
    </div>
  );
}
