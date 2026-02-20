"use client";

import { useState, useCallback, useRef } from "react";
import type { SearchResult } from "@/lib/types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export function useMapboxSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback((query: string) => {
    // Clear previous debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.length < 3) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      // Abort previous request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);

      try {
        const encoded = encodeURIComponent(query);
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?` +
            `access_token=${MAPBOX_TOKEN}&` +
            `country=US&` +
            `bbox=-85.5,-83.0,33.0,35.5&` + // Georgia bounding box (approximate)
            `types=address,poi,place&` +
            `limit=5`,
          { signal: controller.signal }
        );

        if (!res.ok) throw new Error("Geocoding failed");

        const data = await res.json();

        const mapped: SearchResult[] = data.features.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (f: any) => ({
            id: f.id,
            place_name: f.place_name,
            address: f.place_name,
            coordinates: f.center as [number, number],
            type: f.place_type?.[0] ?? "unknown",
          })
        );

        setResults(mapped);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
  }, []);

  return { results, loading, search, clear };
}
