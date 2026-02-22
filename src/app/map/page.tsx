"use client";

import { useRef } from "react";
import EnterpriseShell from "@/components/layout/EnterpriseShell";
import AppShell from "@/components/layout/AppShell";
import { useParcelClick } from "@/hooks/useParcelClick";
import { useDCScore } from "@/hooks/useDCScore";
import { useAppStore } from "@/store/useAppStore";
import type { MapHandle } from "@/components/map/ParcelMap";

export default function MapPage() {
  const mapRef = useRef<MapHandle>(null);
  const selectedAPN = useAppStore((s) => s.selectedAPN);
  const appMode = useAppStore((s) => s.appMode);

  // Initialize hooks
  useParcelClick();
  if (appMode === "datacenter") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useDCScore(selectedAPN);
  }

  return (
    <EnterpriseShell mapRef={mapRef} title="Map Intelligence">
      <AppShell mapRef={mapRef} />
    </EnterpriseShell>
  );
}
