"use client";

import { useAppStore } from "@/store/useAppStore";
import { getInfraForParcel } from "@/lib/mock-data";
import { FLOOD_ZONE_HIGH_RISK } from "@/lib/constants";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

function RiskIndicator({
  label,
  isRisk,
  detail,
}: {
  label: string;
  isRisk: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-800/50">
      <span className="text-xs text-zinc-400">{label}</span>
      <div className="flex items-center gap-1.5">
        {isRisk ? (
          <XCircle className="h-3.5 w-3.5 text-red-400" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
        )}
        <span
          className={`text-xs ${isRisk ? "text-red-400" : "text-green-400"}`}
        >
          {detail}
        </span>
      </div>
    </div>
  );
}

export default function EnvironTab() {
  const selectedParcel = useAppStore((s) => s.selectedParcel);
  if (!selectedParcel) return null;

  const infra = getInfraForParcel(selectedParcel.apn);

  const isFloodRisk =
    !!infra.femaFloodZone && FLOOD_ZONE_HIGH_RISK.includes(infra.femaFloodZone);
  const isSteepGrade =
    infra.maxElevationChangePct != null && infra.maxElevationChangePct > 4;

  return (
    <div className="space-y-4 mt-3">
      <div className="flex items-center gap-2 text-emerald-400">
        <Shield className="h-4 w-4" />
        <span className="text-sm font-semibold">
          Environmental & Hazards
        </span>
      </div>

      <div className="bg-zinc-900 rounded border border-zinc-800 divide-y divide-zinc-800/50">
        <div className="px-3">
          <RiskIndicator
            label="FEMA Flood Zone"
            isRisk={isFloodRisk}
            detail={
              infra.femaFloodZone
                ? `Zone ${infra.femaFloodZone}${isFloodRisk ? " (High Risk)" : ""}`
                : "Not mapped"
            }
          />
          <RiskIndicator
            label="Wetlands (NWI)"
            isRisk={infra.nearWetlands}
            detail={infra.nearWetlands ? "Overlap detected" : "Clear"}
          />
          <RiskIndicator
            label="Seismic Fault"
            isRisk={infra.nearFaultLine}
            detail={infra.nearFaultLine ? "Proximity risk" : "Clear"}
          />
          <RiskIndicator
            label="Site Grade"
            isRisk={isSteepGrade}
            detail={
              infra.maxElevationChangePct != null
                ? `${infra.maxElevationChangePct.toFixed(1)}% change${
                    isSteepGrade ? " (High grading cost)" : ""
                  }`
                : "Not assessed"
            }
          />
        </div>
      </div>

      {(isFloodRisk || infra.nearWetlands || isSteepGrade) && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
            Due Diligence Required
          </p>
          <div className="space-y-1.5">
            {isFloodRisk && (
              <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 rounded p-2 border border-red-500/20">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                FEMA high-risk flood zone. Data centers require strict uptime
                SLAs — flood zone sites are typically disqualified.
              </div>
            )}
            {infra.nearWetlands && (
              <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 rounded p-2 border border-amber-500/20">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                National Wetlands Inventory overlap. May trigger Army Corps of
                Engineers Section 404 permit and wetland mitigation requirements.
              </div>
            )}
            {isSteepGrade && (
              <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 rounded p-2 border border-amber-500/20">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                Grade exceeds 4%. Significant cut-and-fill earthwork required,
                adding substantial site preparation costs.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
