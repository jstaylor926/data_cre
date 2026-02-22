"use client";

import React from "react";
import EnterpriseShell from "@/components/layout/EnterpriseShell";
import SavedPropertiesList from "@/components/saved/SavedPropertiesList";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";

export default function SavedPage() {
  const router = useRouter();
  const selectParcel = useAppStore((s) => s.selectParcel);

  const handleSelectParcel = (apn: string, centroid?: [number, number]) => {
    // Select the parcel in store
    selectParcel(apn);
    // Navigate to map
    router.push("/map");
  };

  return (
    <EnterpriseShell title="Saved Properties">
      <div className="flex-1 overflow-y-auto">
        <SavedPropertiesList onSelectParcel={handleSelectParcel} />
      </div>
    </EnterpriseShell>
  );
}
