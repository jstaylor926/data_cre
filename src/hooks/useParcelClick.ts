"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getCounty } from "@/lib/county-registry";

/**
 * Watches selectedAPN + panelOpen in the store and fetches parcel data from the API.
 * Only fetches when the full panel is open (not for quick card preview).
 * Queries the active county's ArcGIS via our proxy, falls back to mock data.
 */
export function useParcelClick() {
  const selectedAPN = useAppStore((s) => s.selectedAPN);
  const panelOpen = useAppStore((s) => s.panelOpen);
  const activeCountyId = useAppStore((s) => s.activeCountyId);
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

    fetch(`/api/parcel/${encodeURIComponent(selectedAPN)}?county=${activeCountyId}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) {
            // Handle 404 gracefully — the parcel exists on the map but full tax data is missing.
            // We'll fall back to the basic data we have from the map click.
            const state = useAppStore.getState();
            const quickCardData = state.quickCardData;
            const county = getCounty(state.activeCountyId);
            if (quickCardData && quickCardData.pin === selectedAPN) {
              return {
                apn: quickCardData.pin,
                site_address: quickCardData.address,
                acres: quickCardData.acres,
                county: county.name,
                is_partial: true, // Flag to indicate limited data
              };
            }
          }
          throw new Error(`${res.status}`);
        }
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
  }, [selectedAPN, panelOpen, activeCountyId, setSelectedParcel, setParcelLoading]);
}
