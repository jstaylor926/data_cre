"use client";

import { useCallback, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getParcelByAPN } from "@/lib/mock-data";

/**
 * Watches selectedAPN in the store and fetches parcel data.
 * During dev, uses mock data. In production, will fetch from /api/parcel/[apn].
 */
export function useParcelClick() {
  const selectedAPN = useAppStore((s) => s.selectedAPN);
  const setSelectedParcel = useAppStore((s) => s.setSelectedParcel);
  const setParcelLoading = useAppStore((s) => s.setParcelLoading);

  useEffect(() => {
    if (!selectedAPN) {
      setSelectedParcel(null);
      return;
    }

    setParcelLoading(true);

    // Simulate API delay, then resolve from mock data
    const timeout = setTimeout(() => {
      const parcel = getParcelByAPN(selectedAPN);
      setSelectedParcel(parcel ?? null);
    }, 150);

    return () => clearTimeout(timeout);
  }, [selectedAPN, setSelectedParcel, setParcelLoading]);
}
