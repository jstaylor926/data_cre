"use client";

import { useResponsive } from "@/hooks/useResponsive";
import { useAppStore } from "@/store/useAppStore";
import SearchBar from "@/components/search/SearchBar";
import Link from "next/link";
import { SettingsModal } from "./SettingsModal";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export interface TopBarProps {
  onFlyTo?: (lng: number, lat: number) => void;
  activeNav?: string;
  onNavChange?: (nav: string) => void;
}

const NAV_ITEMS = [
  { id: "map", label: "Map" },
  { id: "saved", label: "Saved" },
  { id: "crm", label: "CRM" },
  { id: "alerts", label: "Alerts", dot: true },
];

export function TopBar({ onFlyTo, activeNav = "map", onNavChange }: TopBarProps) {
  const { isMobile } = useResponsive();
  const appMode = useAppStore((s) => s.appMode);
  const setAppMode = useAppStore((s) => s.setAppMode);
  const setDCScore = useAppStore((s) => s.setDCScore);
  const setDCInfrastructure = useAppStore((s) => s.setDCInfrastructure);
  const features = useAppStore((s) => s.features);
  const { status: authStatus, user, openAuthModal, signOut } = useAuth();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (item.id === 'crm' && !features.enableFirmIntel) return false;
    return true;
  });

  const isDC = appMode === "datacenter";

  const handleModeToggle = (mode: "dev" | "datacenter") => {
    setAppMode(mode);
    setDCScore(null);
    setDCInfrastructure(null);
  };

  const accentClass = isDC ? "text-orange-400" : "text-teal";

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line bg-ink/95 px-4 backdrop-blur-sm">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      
      {/* Logo */}
      <Link href="/" className="shrink-0 font-head text-base tracking-[0.06em] text-bright hover:opacity-80 transition-opacity">
        {isMobile ? (
          <>A<span className={accentClass}>{isDC ? "DC" : "CRE"}</span></>
        ) : (
          <>ATLAS <span className={accentClass}>{isDC ? "DC" : "CRE"}</span></>
        )}
      </Link>

      {/* Search */}
      <SearchBar onFlyTo={onFlyTo} />

      {/* Mode toggle — visible if DC feature enabled */}
      {features.enableDCScoring && (
        <div className="flex shrink-0 overflow-hidden rounded border border-line2 bg-ink3">
          <button
            onClick={() => handleModeToggle("dev")}
            className={`px-3 py-1 font-mono text-[9px] uppercase tracking-wider transition-colors ${
              !isDC ? "bg-teal-dim text-teal" : "text-mid hover:text-text"
            }`}
          >
            Dev
          </button>
          <button
            onClick={() => handleModeToggle("datacenter")}
            className={`px-3 py-1 font-mono text-[9px] uppercase tracking-wider transition-colors ${
              isDC ? "bg-orange-500/10 text-orange-400" : "text-mid hover:text-text"
            }`}
          >
            {isMobile ? "DC" : "Data Center"}
          </button>
        </div>
      )}

      {/* Desktop nav pills */}
      {!isMobile && (
        <div className="ml-auto flex gap-1">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavChange?.(item.id)}
              className={`relative rounded px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider transition-colors ${
                activeNav === item.id
                  ? isDC
                    ? "border border-orange-400/50 bg-orange-500/10 text-orange-400"
                    : "border border-teal bg-teal-dim text-teal"
                  : "border border-line text-mid hover:text-text"
              }`}
            >
              {item.label}
              {item.dot && (
                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-red" />
              )}
            </button>
          ))}
        </div>
      )}

      {authStatus === "authenticated" ? (
        <button
          onClick={() => void signOut()}
          title={user?.email ?? "Signed in"}
          className="flex h-7 items-center rounded border border-line2 bg-ink4 px-2.5 font-mono text-[9px] uppercase tracking-wider text-mid transition-colors hover:border-teal hover:text-teal"
        >
          {isMobile ? "Out" : "Sign Out"}
        </button>
      ) : (
        <button
          onClick={openAuthModal}
          disabled={authStatus === "loading"}
          className="flex h-7 items-center rounded border border-line2 bg-ink4 px-2.5 font-mono text-[9px] uppercase tracking-wider text-mid transition-colors hover:border-teal hover:text-teal disabled:cursor-not-allowed disabled:opacity-50"
        >
          {authStatus === "loading" ? "Auth..." : "Sign In"}
        </button>
      )}

      {/* Avatar */}
      <button 
        onClick={() => setIsSettingsOpen(true)}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line2 bg-ink4 font-mono text-[9px] transition-colors hover:border-pd-teal ${isDC ? "text-orange-400" : "text-teal"}`}>
        JT
      </button>
    </header>
  );
}
