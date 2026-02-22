"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Map as MapIcon, 
  LayoutDashboard, 
  Briefcase, 
  Bookmark, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  Users,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { id: "map", label: "Map Intelligence", icon: MapIcon, href: "/map" },
  { id: "pipeline", label: "Deal Pipeline", icon: Briefcase, href: "/pipeline" },
  { id: "saved", label: "Saved Properties", icon: Bookmark, href: "/saved" },
];

const ADMIN_ITEMS = [
  { id: "team", label: "Team", icon: Users, href: "/admin/team" },
  { id: "organization", label: "Organization", icon: Building2, href: "/admin/org" },
  { id: "settings", label: "Settings", icon: Settings, href: "/admin/settings" },
];

export default function EnterpriseSidebar() {
  const pathname = usePathname();
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const setCollapsed = useAppStore((s) => s.setSidebarCollapsed);
  const currentOrg = useAppStore((s) => s.currentOrg);

  return (
    <aside 
      className={cn(
        "flex flex-col border-r border-line bg-ink2 transition-all duration-300 ease-in-out",
        collapsed ? "w-[64px]" : "w-[240px]"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center px-4 border-b border-line">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-8 w-8 min-w-[32px] items-center justify-center rounded-lg bg-teal text-ink font-bold">
            PD
          </div>
          {!collapsed && (
            <span className="font-head text-lg tracking-wider text-text truncate">
              {currentOrg?.name || "Pocket Developer"}
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-8">
        {/* Main Nav */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive 
                    ? "bg-teal/10 text-teal font-medium" 
                    : "text-pd-muted hover:bg-ink3 hover:text-text"
                )}
              >
                <item.icon size={20} className={cn("min-w-[20px]", isActive ? "text-teal" : "text-pd-muted")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {isActive && !collapsed && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-teal" />}
              </Link>
            );
          })}
        </nav>

        {/* Admin Section */}
        <div className="space-y-2">
          {!collapsed && (
            <p className="px-3 text-[10px] font-mono uppercase tracking-widest text-pd-muted opacity-50">
              Admin
            </p>
          )}
          <nav className="space-y-1">
            {ADMIN_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive 
                      ? "bg-teal/10 text-teal font-medium" 
                      : "text-pd-muted hover:bg-ink3 hover:text-text"
                  )}
                >
                  <item.icon size={20} className={cn("min-w-[20px]", isActive ? "text-teal" : "text-pd-muted")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-line">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-pd-muted hover:bg-ink3 hover:text-text transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!collapsed && <span className="text-xs font-mono uppercase tracking-wider">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
