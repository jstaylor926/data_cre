"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export function useZoningSummary(apn: string | null) {
  const zoningSummary = useAppStore((s) => s.zoningSummary);
  const setZoningSummary = useAppStore((s) => s.setZoningSummary);
  const activeCountyId = useAppStore((s) => s.activeCountyId);

  useEffect(() => {
    if (!apn) return;

    setZoningSummary(null);

    let cancelled = false;

    fetch(`/api/parcel/${encodeURIComponent(apn)}/zoning?county=${activeCountyId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setZoningSummary(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [apn, activeCountyId, setZoningSummary]);

  return zoningSummary;
}
