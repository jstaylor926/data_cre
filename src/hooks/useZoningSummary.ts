"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export function useZoningSummary(apn: string | null) {
  const zoningSummary = useAppStore((s) => s.zoningSummary);
  const setZoningSummary = useAppStore((s) => s.setZoningSummary);

  useEffect(() => {
    if (!apn) return;

    setZoningSummary(null);

    let cancelled = false;

    fetch(`/api/parcel/${encodeURIComponent(apn)}/zoning`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setZoningSummary(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [apn, setZoningSummary]);

  return zoningSummary;
}
