"use client";

import { useCallback, type MutableRefObject } from "react";
import { useResponsive } from "@/hooks/useResponsive";
import { useAppStore } from "@/store/useAppStore";
import { useGeolocation } from "@/hooks/useGeolocation";
import ParcelMap from "@/components/map/ParcelMap";
import type { MapHandle } from "@/components/map/ParcelMap";
import MapControls from "@/components/map/MapControls";
import MapHUD from "@/components/map/MapHUD";
import ParcelPanel from "@/components/panel/ParcelPanel";
import ParcelDrawer from "@/components/panel/ParcelDrawer";

interface AppShellProps {
  mapRef?: MutableRefObject<MapHandle | null>;
}

export default function AppShell({ mapRef }: AppShellProps) {
  const { isMobile } = useResponsive();
  const panelOpen = useAppStore((s) => s.panelOpen);
  const { locate } = useGeolocation();

  const handleZoomIn = useCallback(() => {
    mapRef?.current?.zoomIn();
  }, [mapRef]);

  const handleZoomOut = useCallback(() => {
    mapRef?.current?.zoomOut();
  }, [mapRef]);

  const handleGPS = useCallback(() => {
    locate();
    // For now, GPS just requests permission. Full flyTo on GPS
    // requires the position callback — wire up if needed.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          mapRef?.current?.flyTo(pos.coords.longitude, pos.coords.latitude);
        },
        () => {
          // silently handle error
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [locate, mapRef]);

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Map */}
      <ParcelMap mapRef={mapRef} />

      {/* Map overlays */}
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onGPS={handleGPS}
      />
      <MapHUD />

      {/* Parcel detail — desktop panel or mobile drawer */}
      {!isMobile && panelOpen && <ParcelPanel />}
      {isMobile && <ParcelDrawer />}
    </div>
  );
}
