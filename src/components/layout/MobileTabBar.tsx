"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Bookmark, Bell, Settings } from "lucide-react";

const tabs = [
  { href: "/", label: "Map", icon: Map },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "#", label: "Alerts", icon: Bell, disabled: true },
  { href: "#", label: "Settings", icon: Settings, disabled: true },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="h-13 bg-zinc-950 border-t border-zinc-800 flex items-center justify-around px-2 shrink-0 lg:hidden">
      {tabs.map((t) => {
        const active = pathname === t.href;
        const Icon = t.icon;
        return (
          <Link
            key={t.label}
            href={t.disabled ? "#" : t.href}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded transition-colors ${
              t.disabled
                ? "text-zinc-600 cursor-not-allowed"
                : active
                ? "text-teal-400"
                : "text-zinc-400"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="text-[10px]">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
