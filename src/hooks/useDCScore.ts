"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { calculateDCScore } from "@/lib/dc-scoring";
import { getInfraForParcel } from "@/lib/mock-data";
import type { DCScoreResult } from "@/lib/types";

export function useDCScore(): DCScoreResult | null {
  const selectedParcel = useAppStore((s) => s.selectedParcel);
  const activePersona = useAppStore((s) => s.activePersona);

  return useMemo(() => {
    if (!selectedParcel) return null;
    const infra = getInfraForParcel(selectedParcel.apn);
    return calculateDCScore(selectedParcel, infra, activePersona);
  }, [selectedParcel, activePersona]);
}
