"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export function useSiteScore(apn: string | null) {
  const siteScore = useAppStore((s) => s.siteScore);
  const setSiteScore = useAppStore((s) => s.setSiteScore);

  useEffect(() => {
    if (!apn) return;

    // Clear stale score immediately when APN changes
    setSiteScore(null);

    let cancelled = false;

    fetch(`/api/parcel/${encodeURIComponent(apn)}/score`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setSiteScore(data);
      })
      .catch(() => {
        // Silently fail — score tab will stay empty
      });

    return () => {
      cancelled = true;
    };
  }, [apn, setSiteScore]);

  return siteScore;
}
