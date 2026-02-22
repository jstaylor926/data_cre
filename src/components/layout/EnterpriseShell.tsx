"use client";

import React, { useEffect, type MutableRefObject } from "react";
import EnterpriseSidebar from "./EnterpriseSidebar";
import EnterpriseTopBar from "./EnterpriseTopBar";
import MobileTabBar from "./MobileTabBar";
import { useResponsive } from "@/hooks/useResponsive";
import { useAppStore } from "@/store/useAppStore";
import { MOCK_ORG, MOCK_USER, MOCK_DEALS, MOCK_ACTIVITIES } from "@/lib/mock-enterprise";
import type { MapHandle } from "@/components/map/ParcelMap";

interface EnterpriseShellProps {
  children: React.ReactNode;
  mapRef?: MutableRefObject<MapHandle | null>;
  title?: string;
}

export default function EnterpriseShell({ children, mapRef, title }: EnterpriseShellProps) {
  const { isMobile } = useResponsive();
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const setCurrentOrg = useAppStore((s) => s.setCurrentOrg);
  const setDeals = useAppStore((s) => s.setDeals);

  // Initialize mock data on mount
  useEffect(() => {
    setCurrentUser(MOCK_USER);
    setCurrentOrg(MOCK_ORG);
    setDeals(MOCK_DEALS);
  }, [setCurrentUser, setCurrentOrg, setDeals]);

  const handleFlyTo = (lng: number, lat: number) => {
    mapRef?.current?.flyTo(lng, lat);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ink text-text">
      {/* Desktop Sidebar */}
      {!isMobile && <EnterpriseSidebar />}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Global Top Bar */}
        {!isMobile && <EnterpriseTopBar onFlyTo={handleFlyTo} title={title} />}

        {/* Main Viewport */}
        <main className="relative flex-1 overflow-hidden">
          {children}
        </main>

        {/* Mobile Navigation */}
        {isMobile && <MobileTabBar />}
      </div>
    </div>
  );
}
