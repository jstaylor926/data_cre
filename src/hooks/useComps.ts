"use client";

import { useEffect, useState, useCallback } from "react";
import type { Comp } from "@/lib/types";

export function useComps(apn: string | null) {
  const [comps, setComps] = useState<Comp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComps = useCallback(async (pin: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/parcel/${encodeURIComponent(pin)}/comps`);
      const data: Comp[] = res.ok ? await res.json() : [];
      setComps(data);
    } catch {
      setError("Failed to load comparable properties");
      setComps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!apn) {
      setComps([]);
      return;
    }
    fetchComps(apn);
  }, [apn, fetchComps]);

  return { comps, loading, error };
}
