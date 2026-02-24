"use client";

import TopBar from "@/components/layout/TopBar";
import MobileTabBar from "@/components/layout/MobileTabBar";
import SavedPropertiesList from "@/components/saved/SavedPropertiesList";
import { useResponsive } from "@/hooks/useResponsive";
import { Bookmark } from "lucide-react";

export default function SavedPage() {
  const { isMobile } = useResponsive();

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      <TopBar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-6">
            <Bookmark className="h-5 w-5 text-amber-500" />
            <h1 className="text-lg font-semibold text-zinc-100">
              Saved Properties
            </h1>
          </div>
          <SavedPropertiesList />
        </div>
      </main>
      {isMobile && <MobileTabBar />}
    </div>
  );
}
