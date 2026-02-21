"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";

/**
 * Watches selectedAPN + panelOpen in the store and fetches parcel data from the API.
 * Only fetches when the full panel is open (not for quick card preview).
 * Queries Gwinnett County ArcGIS via our proxy, falls back to mock data.
 */
export function useParcelClick() {
  const selectedAPN = useAppStore((s) => s.selectedAPN);
  const panelOpen = useAppStore((s) => s.panelOpen);
  const setSelectedParcel = useAppStore((s) => s.setSelectedParcel);
  const setParcelLoading = useAppStore((s) => s.setParcelLoading);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Only fetch when panel is open AND we have a selected parcel
    if (!selectedAPN || !panelOpen) {
      if (!selectedAPN) setSelectedParcel(null);
      return;
    }

    // Cancel any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setParcelLoading(true);

    fetch(`/api/parcel/${encodeURIComponent(selectedAPN)}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((parcel) => {
        setSelectedParcel(parcel);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch parcel:", err);
          setSelectedParcel(null);
        }
      });

    return () => {
      controller.abort();
    };
  }, [selectedAPN, panelOpen, setSelectedParcel, setParcelLoading]);
}
