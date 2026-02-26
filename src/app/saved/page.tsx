"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import SavedPropertiesList from "@/components/saved/SavedPropertiesList";

export default function SavedPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line bg-ink/95 px-4">
        <button
          onClick={() => router.push("/")}
          className="flex h-7 w-7 items-center justify-center rounded text-mid hover:text-bright"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="font-head text-base tracking-widest text-bright">
          SAVED
        </h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <SavedPropertiesList
          onSelectParcel={(apn) => {
            // Navigate to unified map with the parcel selected
            router.push(`/map?apn=${apn}`);
          }}
        />
      </div>
    </div>
  );
}
