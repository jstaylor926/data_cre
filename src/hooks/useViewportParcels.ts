"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";

// Minimum zoom level to fetch parcels (below this there are too many)
const MIN_PARCEL_ZOOM = 13;
// Debounce time for viewport changes (ms)
const DEBOUNCE_MS = 400;

interface BBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

/**
 * Fetches parcel GeoJSON from our proxy API based on the current map viewport.
 * Only fetches when zoom >= 13 to keep requests manageable.
 * Debounces requests to avoid hammering the API on every pan frame.
 */
export function useViewportParcels() {
  const zoom = useAppStore((s) => s.viewportZoom);
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBBoxRef = useRef<string>("");

  const fetchParcels = useCallback(async (bbox: BBox) => {
    const key = `${bbox.west.toFixed(4)},${bbox.south.toFixed(4)},${bbox.east.toFixed(4)},${bbox.north.toFixed(4)}`;
    // Skip if same bbox as last fetch
    if (key === lastBBoxRef.current) return;
    lastBBoxRef.current = key;

    // Cancel previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const url = `/api/parcels/bbox?west=${bbox.west}&south=${bbox.south}&east=${bbox.east}&north=${bbox.north}`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setGeojson(data);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Failed to fetch viewport parcels:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const requestFetch = useCallback(
    (bbox: BBox) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => fetchParcels(bbox), DEBOUNCE_MS);
    },
    [fetchParcels]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const isZoomedIn = zoom >= MIN_PARCEL_ZOOM;

  return { geojson, loading, isZoomedIn, requestFetch };
}
