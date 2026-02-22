"use client";

import { Map, Bookmark, LayoutDashboard, Briefcase, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard, href: "/dashboard" },
  { id: "map", label: "Map", icon: Map, href: "/map" },
  { id: "pipeline", label: "Deals", icon: Briefcase, href: "/pipeline" },
  { id: "saved", label: "Saved", icon: Bookmark, href: "/saved" },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="flex h-[60px] shrink-0 items-center justify-around border-t border-line bg-ink2 pb-safe">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "relative flex flex-col items-center gap-1 px-4 py-2 transition-colors",
              active ? "text-teal" : "text-pd-muted"
            )}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span className="text-[9px] font-medium tracking-tight">
              {tab.label}
            </span>
            {active && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-teal rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
