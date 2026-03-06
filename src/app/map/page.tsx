"use client";

import { useCallback, useRef, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import MobileTabBar from "@/components/layout/MobileTabBar";
import AppShell from "@/components/layout/AppShell";
import { CRMDashboard } from "@/components/crm/CRMDashboard";
import SavedPropertiesList from "@/components/saved/SavedPropertiesList";
import { useParcelClick } from "@/hooks/useParcelClick";
import { useResponsive } from "@/hooks/useResponsive";
import { useAppStore } from "@/store/useAppStore";
import type { MapHandle } from "@/components/map/ParcelMap";
import { Bell } from "lucide-react";
import ResearchPanel from "@/components/research/ResearchPanel";

export default function AppDashboard() {
  useParcelClick();
  const { isMobile } = useResponsive();
  const [activeNav, setActiveNav] = useState("map");
  const mapRef = useRef<MapHandle>(null);
  const selectParcel = useAppStore((s) => s.selectParcel);
  const enableFirmIntel = useAppStore((s) => s.features.enableFirmIntel);
  const setResearchActive = useAppStore((s) => s.setResearchActive);
  const researchActive = useAppStore((s) => s.researchSession.active);
  const resolvedNav = activeNav === "crm" && !enableFirmIntel ? "map" : activeNav;

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
    if (nav === "research") {
      // Research mode: keep map visible but toggle research panel
      setResearchActive(true);
      setActiveNav("map");
      return;
    }
    // Close research panel when navigating away
    if (researchActive && nav !== "map") {
      setResearchActive(false);
    }
    setActiveNav(nav);
  }, [setResearchActive, researchActive]);

  return (
    <div className="flex h-screen w-screen flex-col bg-ink">
      <TopBar
        onFlyTo={handleFlyTo}
        activeNav={resolvedNav}
        onNavChange={handleNavChange}
      />

      {resolvedNav === "map" && (
        <AppShell mapRef={mapRef} />
      )}

      {resolvedNav === "crm" && enableFirmIntel && (
        <div className="flex-1 overflow-hidden">
          <CRMDashboard />
        </div>
      )}

      {resolvedNav === "saved" && (
        <div className="flex-1 overflow-y-auto">
          <SavedPropertiesList onSelectParcel={handleSelectSavedParcel} />
        </div>
      )}

      {resolvedNav === "map" && isMobile && researchActive && (
        <div className="absolute inset-0 z-40 bg-ink">
          <ResearchPanel
            onFlyTo={(lng, lat, zoom) => {
              setResearchActive(false);
              setActiveNav("map");
              setTimeout(() => mapRef.current?.flyTo(lng, lat, zoom), 100);
            }}
          />
        </div>
      )}

      {resolvedNav === "alerts" && (
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

      {isMobile && (
        <MobileTabBar activeTab={resolvedNav} onTabChange={handleNavChange} />
      )}
    </div>
  );
}
