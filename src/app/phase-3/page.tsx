"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import MobileTabBar from "@/components/layout/MobileTabBar";
import AppShell from "@/components/layout/AppShell";
import SavedPropertiesList from "@/components/saved/SavedPropertiesList";
import SiteScoutPanel from "@/components/scout/SiteScoutPanel";
import { useParcelClick } from "@/hooks/useParcelClick";
import { useDCScore } from "@/hooks/useDCScore";
import { useResponsive } from "@/hooks/useResponsive";
import { useAppStore } from "@/store/useAppStore";
import type { MapHandle } from "@/components/map/ParcelMap";
import { Bell, Settings, Crosshair } from "lucide-react";

export default function Phase3Dashboard() {
  useParcelClick();
  const { isMobile } = useResponsive();
  const [activeNav, setActiveNav] = useState("map");
  const mapRef = useRef<MapHandle>(null);

  const selectParcel = useAppStore((s) => s.selectParcel);
  const selectedAPN = useAppStore((s) => s.selectedAPN);
  const scoutPanelOpen = useAppStore((s) => s.scoutPanelOpen);
  const setScoutPanelOpen = useAppStore((s) => s.setScoutPanelOpen);
  const appMode = useAppStore((s) => s.appMode);
  const viewportLat = useAppStore((s) => s.viewportLat);
  const viewportLng = useAppStore((s) => s.viewportLng);
  const viewportZoom = useAppStore((s) => s.viewportZoom);

  // DC scoring — fires whenever selectedAPN changes in datacenter mode
  useDCScore(selectedAPN);

  // Compute approximate viewport bbox for Tier 2 area search.
  // useMemo so the array reference is stable between renders — passing a new
  // array literal every render can feed back into useCallback dependency cycles.
  const viewportBbox = useMemo<[number, number, number, number]>(() => {
    const tilesX = Math.pow(2, viewportZoom);
    const degPerTile = 360 / tilesX;
    const span = degPerTile * 3;
    return [
      viewportLng - span,
      viewportLat - span * 0.6,
      viewportLng + span,
      viewportLat + span * 0.6,
    ];
  }, [viewportLat, viewportLng, viewportZoom]);

  const handleFlyTo = useCallback((lng: number, lat: number, zoom?: number) => {
    mapRef.current?.flyTo(lng, lat, zoom);
  }, []);

  const handleSelectSavedParcel = useCallback(
    (apn: string, centroid?: [number, number]) => {
      setActiveNav("map");
      if (centroid) {
        mapRef.current?.flyTo(centroid[0], centroid[1]);
      }
      // Small delay so map view activates and flyTo starts first
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

      {/* View switching based on active nav */}
      {activeNav === "map" && (
        <div className="relative flex flex-col flex-1">
          <AppShell mapRef={mapRef} />

          {/* Site Scout trigger button — only in DC mode */}
          {appMode === "datacenter" && !scoutPanelOpen && (
            <button
              onClick={() => setScoutPanelOpen(true)}
              className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-orange-500/40 bg-ink2/95 px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-orange-400 shadow-lg backdrop-blur-sm transition-all hover:border-orange-500/70 hover:bg-ink3 hover:text-orange-300"
            >
              <Crosshair size={14} />
              Site Scout — AI Site Discovery
            </button>
          )}

          {/* Site Scout Panel — slides in from left */}
          {appMode === "datacenter" && scoutPanelOpen && (
            <div className="absolute inset-y-0 left-0 z-30 w-[380px] overflow-hidden">
              <SiteScoutPanel
                onFlyTo={handleFlyTo}
                viewportBbox={viewportBbox}
              />
            </div>
          )}
        </div>
      )}

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
