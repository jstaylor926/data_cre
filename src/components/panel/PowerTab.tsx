"use client";

import { useAppStore } from "@/store/useAppStore";
import { getInfraForParcel } from "@/lib/mock-data";
import { formatDistance, formatCurrency, formatMW } from "@/lib/formatters";
import { COST_PER_MILE_TRENCHING } from "@/lib/constants";
import { Zap, AlertTriangle } from "lucide-react";

export default function PowerTab() {
  const selectedParcel = useAppStore((s) => s.selectedParcel);
  if (!selectedParcel) return null;

  const infra = getInfraForParcel(selectedParcel.apn);

  const costToConnect =
    infra.distToSubstationMiles != null
      ? infra.distToSubstationMiles * COST_PER_MILE_TRENCHING
      : null;

  const estimatedMW = selectedParcel.acres
    ? Math.round(selectedParcel.acres * 6)
    : null;

  return (
    <div className="space-y-4 mt-3">
      <div className="flex items-center gap-2 text-amber-400">
        <Zap className="h-4 w-4" />
        <span className="text-sm font-semibold">Power Infrastructure</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-zinc-900 rounded p-3 border border-zinc-800">
          <p className="text-[10px] text-zinc-500">Nearest Substation</p>
          <p className="text-sm font-semibold text-zinc-100">
            {formatDistance(infra.distToSubstationMiles)}
          </p>
        </div>
        <div className="bg-zinc-900 rounded p-3 border border-zinc-800">
          <p className="text-[10px] text-zinc-500">Substation Capacity</p>
          <p className="text-sm font-semibold text-zinc-100">
            {formatMW(infra.substationCapacityMW)}
          </p>
        </div>
        <div className="bg-zinc-900 rounded p-3 border border-zinc-800">
          <p className="text-[10px] text-zinc-500">Nearest TX Line</p>
          <p className="text-sm font-semibold text-zinc-100">
            {formatDistance(infra.distToTransmissionMiles)}
          </p>
        </div>
        <div className="bg-zinc-900 rounded p-3 border border-zinc-800">
          <p className="text-[10px] text-zinc-500">Est. Cost to Connect</p>
          <p className="text-sm font-semibold text-zinc-100">
            {formatCurrency(costToConnect)}
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 rounded p-3 border border-zinc-800">
        <p className="text-[10px] text-zinc-500">Estimated Site MW Capacity</p>
        <p className="text-lg font-bold text-teal-400">{formatMW(estimatedMW)}</p>
        <p className="text-[10px] text-zinc-600 mt-1">
          Based on ~6 MW/acre density at {selectedParcel.acres?.toFixed(1)} acres
        </p>
      </div>

      {infra.distToSubstationMiles != null && infra.distToSubstationMiles > 3 && (
        <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 rounded p-2 border border-amber-500/20">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          Substation distance exceeds 3 miles. Consider on-site microgrid or
          alternative power source to reduce connection timeline.
        </div>
      )}
    </div>
  );
}
