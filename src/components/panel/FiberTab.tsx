"use client";

import { useAppStore } from "@/store/useAppStore";
import { getInfraForParcel } from "@/lib/mock-data";
import { formatDistance } from "@/lib/formatters";
import { Wifi, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function FiberTab() {
  const selectedParcel = useAppStore((s) => s.selectedParcel);
  if (!selectedParcel) return null;

  const infra = getInfraForParcel(selectedParcel.apn);

  return (
    <div className="space-y-4 mt-3">
      <div className="flex items-center gap-2 text-blue-400">
        <Wifi className="h-4 w-4" />
        <span className="text-sm font-semibold">Fiber & Connectivity</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-zinc-900 rounded p-3 border border-zinc-800">
          <p className="text-[10px] text-zinc-500">Nearest Fiber</p>
          <p className="text-sm font-semibold text-zinc-100">
            {formatDistance(infra.distToFiberMiles)}
          </p>
        </div>
        <div className="bg-zinc-900 rounded p-3 border border-zinc-800">
          <p className="text-[10px] text-zinc-500">Nearest IXP</p>
          <p className="text-sm font-semibold text-zinc-100">
            {formatDistance(infra.distToIXPMiles)}
          </p>
        </div>
      </div>

      {/* Redundancy Status */}
      <div className="bg-zinc-900 rounded p-3 border border-zinc-800">
        <p className="text-[10px] text-zinc-500 mb-2">Fiber Redundancy</p>
        <div className="flex items-center gap-2">
          {infra.fiberRedundantPaths >= 2 ? (
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          )}
          <span className="text-sm font-semibold text-zinc-100">
            {infra.fiberRedundantPaths}x redundant path
            {infra.fiberRedundantPaths !== 1 ? "s" : ""}
          </span>
        </div>
        <p className="text-[10px] text-zinc-500 mt-1">
          {infra.fiberRedundantPaths >= 2
            ? "Carrier-neutral diverse pathways available"
            : "Single fiber path — high risk of backhoe severance"}
        </p>
      </div>

      {infra.fiberRedundantPaths < 2 && (
        <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 rounded p-2 border border-amber-500/20">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          Single fiber path detected. Data centers require carrier-neutral
          diverse fiber pathways to meet uptime SLAs.
        </div>
      )}
    </div>
  );
}
