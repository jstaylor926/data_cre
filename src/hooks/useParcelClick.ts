"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getParcelByAPN } from "@/lib/mock-data";

export function useParcelClick() {
  const selectedAPN = useAppStore((s) => s.selectedAPN);
  const setSelectedParcel = useAppStore((s) => s.setSelectedParcel);
  const setParcelLoading = useAppStore((s) => s.setParcelLoading);

  useEffect(() => {
    if (!selectedAPN) return;

    setParcelLoading(true);

    // Simulate API delay — replace with Supabase query
    const timer = setTimeout(() => {
      const parcel = getParcelByAPN(selectedAPN);
      setSelectedParcel(parcel ?? null);
    }, 150);

    return () => clearTimeout(timer);
  }, [selectedAPN, setSelectedParcel, setParcelLoading]);
}
