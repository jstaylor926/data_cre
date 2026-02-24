"use client";

import { useAppStore } from "@/store/useAppStore";
import { useSavedParcels } from "@/hooks/useSavedParcels";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck, FileText, Download } from "lucide-react";
import { useState } from "react";

export default function PanelActionBar() {
  const selectedParcel = useAppStore((s) => s.selectedParcel);
  const { isSaved, save, unsave } = useSavedParcels();
  const [briefLoading, setBriefLoading] = useState(false);

  if (!selectedParcel) return null;
  const saved = isSaved(selectedParcel.apn);

  const handleSave = async () => {
    if (saved) {
      await unsave(selectedParcel.apn);
    } else {
      await save(selectedParcel.apn);
    }
  };

  const handleExportBrief = async () => {
    setBriefLoading(true);
    try {
      const res = await fetch("/api/dc-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apn: selectedParcel.apn }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `site-brief-${selectedParcel.apn}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch {
      console.error("Brief export failed");
    } finally {
      setBriefLoading(false);
    }
  };

  return (
    <div className="flex gap-2 px-4 pb-3">
      <Button
        size="sm"
        variant={saved ? "default" : "outline"}
        className={`text-xs flex-1 ${
          saved
            ? "bg-amber-600 hover:bg-amber-700 text-white"
            : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        }`}
        onClick={handleSave}
      >
        {saved ? (
          <BookmarkCheck className="h-3 w-3 mr-1" />
        ) : (
          <Bookmark className="h-3 w-3 mr-1" />
        )}
        {saved ? "Saved" : "Save"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-xs flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        onClick={handleExportBrief}
        disabled={briefLoading}
      >
        <FileText className="h-3 w-3 mr-1" />
        {briefLoading ? "Generating..." : "Export Brief"}
      </Button>
    </div>
  );
}
