"use client";

import { useState, useRef, useCallback } from "react";

interface SearchResult {
  id: string;
  name: string;
  place_name: string;
  center: [number, number];
}

const GA_BBOX = "-85.6,30.4,-80.8,35.0";

export function useMapboxSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string) => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSearching(true);
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?access_token=${token}&bbox=${GA_BBOX}&limit=5&types=address,poi,place`;

      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json();

      setResults(
        (data.features ?? []).map((f: { id: string; text: string; place_name: string; center: [number, number] }) => ({
          id: f.id,
          name: f.text,
          place_name: f.place_name,
          center: f.center,
        }))
      );
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clear = useCallback(() => setResults([]), []);

  return { results, isSearching, search, clear };
}
