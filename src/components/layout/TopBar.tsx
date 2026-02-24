"use client";

import { useAppStore } from "@/store/useAppStore";
import { SearchBar } from "@/components/search/SearchBar";
import { Bookmark, Bell, Settings, Database } from "lucide-react";
import Link from "next/link";

export default function TopBar() {
  const scoutMode = useAppStore((s) => s.scoutMode);
  const setScoutMode = useAppStore((s) => s.setScoutMode);

  return (
    <header className="h-12 bg-zinc-950 border-b border-zinc-800 flex items-center px-4 gap-4 shrink-0 z-50">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-1 shrink-0">
        <span className="text-sm font-bold tracking-tight text-zinc-200">POCKET</span>
        <span className="text-sm font-bold tracking-tight text-teal-400">DEV</span>
      </Link>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <SearchBar />
      </div>

      {/* Nav */}
      <nav className="flex items-center gap-1 ml-auto">
        <button
          onClick={() => setScoutMode(!scoutMode)}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            scoutMode
              ? "bg-teal-600 text-white"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          }`}
        >
          <Database className="h-3.5 w-3.5 inline mr-1" />
          Scout
        </button>
        <Link
          href="/saved"
          className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <Bookmark className="h-4 w-4" />
        </Link>
        <button className="p-2 text-zinc-500 cursor-not-allowed" title="Alerts (coming soon)">
          <Bell className="h-4 w-4" />
        </button>
        <button className="p-2 text-zinc-500 cursor-not-allowed" title="Settings (coming soon)">
          <Settings className="h-4 w-4" />
        </button>
      </nav>
    </header>
  );
}
