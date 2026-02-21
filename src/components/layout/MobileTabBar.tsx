"use client";

import { Map, Bookmark, Bell, Settings } from "lucide-react";

interface MobileTabBarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const TABS = [
  { id: "map", label: "Map", icon: Map },
  { id: "saved", label: "Saved", icon: Bookmark },
  { id: "alerts", label: "Alerts", icon: Bell, dot: true },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function MobileTabBar({
  activeTab = "map",
  onTabChange,
}: MobileTabBarProps) {
  return (
    <nav className="flex h-[52px] shrink-0 items-center justify-around border-t border-line bg-ink">
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange?.(tab.id)}
            className={`relative flex flex-col items-center gap-0.5 px-4 py-1 transition-colors ${
              active ? "text-teal" : "text-pd-muted"
            }`}
          >
            <Icon size={18} strokeWidth={active ? 2 : 1.5} />
            <span className="font-mono text-[8px] uppercase tracking-wider">
              {tab.label}
            </span>
            {tab.dot && (
              <span className="absolute right-2.5 top-0.5 h-1.5 w-1.5 rounded-full bg-red" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
