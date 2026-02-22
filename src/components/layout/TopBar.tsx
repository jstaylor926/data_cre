"use client";

import { useResponsive } from "@/hooks/useResponsive";
import { useAppStore } from "@/store/useAppStore";
import { usePathname } from "next/navigation";
import SearchBar from "@/components/search/SearchBar";

interface TopBarProps {
  onFlyTo?: (lng: number, lat: number) => void;
  activeNav?: string;
  onNavChange?: (nav: string) => void;
}

const NAV_ITEMS = [
  { id: "map", label: "Map" },
  { id: "saved", label: "Saved" },
  { id: "alerts", label: "Alerts", dot: true },
];

export default function TopBar({ onFlyTo, activeNav = "map", onNavChange }: TopBarProps) {
  const { isMobile } = useResponsive();
  const appMode = useAppStore((s) => s.appMode);
  const setAppMode = useAppStore((s) => s.setAppMode);
  const setDCScore = useAppStore((s) => s.setDCScore);
  const setDCInfrastructure = useAppStore((s) => s.setDCInfrastructure);
  const pathname = usePathname();
  const isPhase3 = pathname?.includes("phase-3");

  const isDC = appMode === "datacenter";

  const handleModeToggle = (mode: "dev" | "datacenter") => {
    setAppMode(mode);
    setDCScore(null);
    setDCInfrastructure(null);
  };

  const accentClass = isDC ? "text-orange-400" : "text-teal";

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line bg-ink/95 px-4 backdrop-blur-sm">
      {/* Logo */}
      <h1 className="shrink-0 font-head text-base tracking-[0.06em] text-bright">
        {isMobile ? (
          <>P<span className={accentClass}>{isDC ? "DC" : "D"}</span></>
        ) : (
          <>POCKET<span className={accentClass}>{isDC ? "DC" : "DEV"}</span></>
        )}
      </h1>

      {/* Search */}
      <SearchBar onFlyTo={onFlyTo} />

      {/* Mode toggle — only visible on phase-3 */}
      {isPhase3 && (
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
          {NAV_ITEMS.map((item) => (
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

      {/* Avatar */}
      <div className={`ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line2 bg-ink4 font-mono text-[9px] lg:ml-0 ${isDC ? "text-orange-400" : "text-teal"}`}>
        JT
      </div>
    </header>
  );
}
