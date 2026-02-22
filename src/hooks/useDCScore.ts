"use client";
/**
 * Fetches DCInfrastructure for the selected parcel once.
 * Computes DCScore client-side whenever dcMwTarget changes (no re-fetch).
 */

import { useEffect, useCallback, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { computeDCScore } from "@/lib/dc-scoring";

export function useDCScore(apn: string | null) {
  const appMode = useAppStore((s) => s.appMode);
  const dcMwTarget = useAppStore((s) => s.dcMwTarget);
  const dcInfrastructure = useAppStore((s) => s.dcInfrastructure);
  const setDCInfrastructure = useAppStore((s) => s.setDCInfrastructure);
  const setDCScore = useAppStore((s) => s.setDCScore);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch infrastructure when APN changes and we're in DC mode
  const fetchInfra = useCallback(
    async (pin: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setDCInfrastructure(null);
      setDCScore(null);

      try {
        const res = await fetch(
          `/api/parcel/${encodeURIComponent(pin)}/dc-score`,
          { signal: controller.signal, cache: "no-store" }
        );
        if (!res.ok) return;
        const infra = await res.json();
        setDCInfrastructure(infra);
      } catch {
        // Aborted or failed — silently ignore
      }
    },
    [setDCInfrastructure, setDCScore]
  );

  useEffect(() => {
    if (!apn || appMode !== "datacenter") {
      setDCScore(null);
      return;
    }
    fetchInfra(apn);

    return () => abortRef.current?.abort();
  }, [apn, appMode, fetchInfra, setDCScore]);

  // Re-compute score client-side whenever MW target or infrastructure changes
  useEffect(() => {
    if (!dcInfrastructure) return;
    const score = computeDCScore(dcInfrastructure, dcMwTarget);
    setDCScore(score);
  }, [dcInfrastructure, dcMwTarget, setDCScore]);
}
