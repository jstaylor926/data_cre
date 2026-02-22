"use client";

import React from "react";
import { Bell, Search, User, LogOut, Settings, HelpCircle, ChevronDown } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import SearchBar from "@/components/search/SearchBar";
import { cn } from "@/lib/utils";

interface EnterpriseTopBarProps {
  onFlyTo?: (lng: number, lat: number) => void;
  title?: string;
}

export default function EnterpriseTopBar({ onFlyTo, title }: EnterpriseTopBarProps) {
  const currentUser = useAppStore((s) => s.currentUser);
  const currentOrg = useAppStore((s) => s.currentOrg);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-ink px-6">
      {/* Page Title / Context */}
      <div className="flex items-center gap-4">
        {title && (
          <h2 className="text-lg font-medium text-text">{title}</h2>
        )}
      </div>

      {/* Global Search */}
      <div className="flex-1 max-w-2xl px-8">
        <SearchBar onFlyTo={onFlyTo} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line text-pd-muted hover:bg-ink2 hover:text-text transition-colors">
          <Bell size={18} />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red border-2 border-ink" />
        </button>

        <button className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-pd-muted hover:bg-ink2 hover:text-text transition-colors">
          <HelpCircle size={18} />
        </button>

        <div className="h-8 w-px bg-line mx-2" />

        {/* User Profile Dropdown */}
        <button className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full border border-line hover:bg-ink2 transition-colors">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink3 border border-line overflow-hidden">
            {currentUser?.avatar_url ? (
              <img src={currentUser.avatar_url} alt={currentUser.full_name || ""} className="h-full w-full object-cover" />
            ) : (
              <User size={16} className="text-pd-muted" />
            )}
          </div>
          <div className="flex flex-col items-start text-left max-w-[120px]">
            <span className="text-xs font-medium text-text truncate w-full">
              {currentUser?.full_name || "Guest User"}
            </span>
            <span className="text-[10px] text-pd-muted uppercase tracking-wider">
              {currentUser?.role || "Member"}
            </span>
          </div>
          <ChevronDown size={14} className="text-pd-muted ml-1 mr-2" />
        </button>
      </div>
    </header>
  );
}
