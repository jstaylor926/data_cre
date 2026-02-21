"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";

const MIN_ZONING_ZOOM = 12;
const DEBOUNCE_MS = 500;

interface BBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

/**
 * Fetches zoning GeoJSON from our proxy API based on the current map viewport.
 */
export function useViewportZoning() {
  const zoom = useAppStore((s) => s.viewportZoom);
  const showZoning = useAppStore((s) => s.showZoning);
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBBoxRef = useRef<string>("");

  const fetchZoning = useCallback(async (bbox: BBox) => {
    const key = `${bbox.west.toFixed(4)},${bbox.south.toFixed(4)},${bbox.east.toFixed(4)},${bbox.north.toFixed(4)}`;
    if (key === lastBBoxRef.current) return;
    lastBBoxRef.current = key;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const url = `/api/zoning/bbox?west=${bbox.west}&south=${bbox.south}&east=${bbox.east}&north=${bbox.north}`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setGeojson(data);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Failed to fetch viewport zoning:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const requestFetch = useCallback(
    (bbox: BBox) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => fetchZoning(bbox), DEBOUNCE_MS);
    },
    [fetchZoning]
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const isZoomedIn = zoom >= MIN_ZONING_ZOOM;
  const shouldFetch = showZoning && isZoomedIn;

  return { geojson, loading, isZoomedIn, shouldFetch, requestFetch };
}
