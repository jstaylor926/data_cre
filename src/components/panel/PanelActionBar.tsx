"use client";

import { Heart, Building2, Columns3, FileText } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useSavedParcels } from "@/hooks/useSavedParcels";

export default function PanelActionBar() {
  const selectedAPN = useAppStore((s) => s.selectedAPN);
  const { isSaved, save, unsave } = useSavedParcels();

  const saved = selectedAPN ? isSaved(selectedAPN) : false;

  const handleSaveToggle = async () => {
    if (!selectedAPN) return;
    if (saved) {
      await unsave(selectedAPN);
    } else {
      await save(selectedAPN);
    }
  };

  return (
    <div className="flex items-center justify-around border-t border-line bg-ink2 px-4 py-2.5">
      <ActionButton
        icon={<Heart size={14} fill={saved ? "currentColor" : "none"} />}
        label={saved ? "Saved" : "Save"}
        onClick={handleSaveToggle}
        active={saved}
      />
      <ActionButton icon={<Building2 size={14} />} label="LLC" />
      <ActionButton icon={<Columns3 size={14} />} label="Compare" disabled />
      <ActionButton icon={<FileText size={14} />} label="Brief" disabled />
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1 rounded px-3 py-1.5 transition-colors ${
        disabled
          ? "cursor-not-allowed text-pd-muted opacity-40"
          : active
            ? "text-amber"
            : "text-mid hover:text-bright"
      }`}
    >
      {icon}
      <span className="font-mono text-[8px] uppercase tracking-wider">
        {label}
      </span>
    </button>
  );
}
