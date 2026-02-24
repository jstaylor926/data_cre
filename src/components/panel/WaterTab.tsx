"use client";

import { useAppStore } from "@/store/useAppStore";
import { getInfraForParcel } from "@/lib/mock-data";
import { formatDistance } from "@/lib/formatters";
import { Droplets, AlertTriangle } from "lucide-react";

export default function WaterTab() {
  const selectedParcel = useAppStore((s) => s.selectedParcel);
  if (!selectedParcel) return null;

  const infra = getInfraForParcel(selectedParcel.apn);

  const droughtLevel =
    infra.droughtRiskScore == null
      ? "Unknown"
      : infra.droughtRiskScore < 30
      ? "Low"
      : infra.droughtRiskScore < 60
      ? "Moderate"
      : "High";

  const droughtColor =
    droughtLevel === "Low"
      ? "text-green-400"
      : droughtLevel === "Moderate"
      ? "text-amber-400"
      : droughtLevel === "High"
      ? "text-red-400"
      : "text-zinc-400";

  return (
    <div className="space-y-4 mt-3">
      <div className="flex items-center gap-2 text-cyan-400">
        <Droplets className="h-4 w-4" />
        <span className="text-sm font-semibold">Water & Cooling</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-zinc-900 rounded p-3 border border-zinc-800">
          <p className="text-[10px] text-zinc-500">Nearest Water Main</p>
          <p className="text-sm font-semibold text-zinc-100">
            {formatDistance(infra.distToWaterMainMiles)}
          </p>
        </div>
        <div className="bg-zinc-900 rounded p-3 border border-zinc-800">
          <p className="text-[10px] text-zinc-500">Drought Risk</p>
          <p className={`text-sm font-semibold ${droughtColor}`}>
            {droughtLevel}
          </p>
          {infra.droughtRiskScore != null && (
            <p className="text-[10px] text-zinc-600">
              Score: {infra.droughtRiskScore}/100
            </p>
          )}
        </div>
      </div>

      <div className="bg-zinc-900 rounded p-3 border border-zinc-800 text-xs text-zinc-400 space-y-1.5">
        <p className="font-medium text-zinc-300">Cooling Considerations</p>
        <p>
          Traditional evaporative cooling requires significant municipal water
          access. Modern AI data centers increasingly use closed-loop liquid
          cooling systems to reduce water dependency.
        </p>
        <p>
          Municipalities in drought zones are actively restricting or banning
          water-cooled data centers.
        </p>
      </div>

      {infra.droughtRiskScore != null && infra.droughtRiskScore > 60 && (
        <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 rounded p-2 border border-red-500/20">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          High drought risk area. Municipal water restrictions may impede
          evaporative cooling permits. Evaluate closed-loop alternatives.
        </div>
      )}
    </div>
  );
}
