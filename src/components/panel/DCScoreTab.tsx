"use client";

import { useAppStore } from "@/store/useAppStore";
import { useDCScore } from "@/hooks/useDCScore";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  Zap,
  Wifi,
  Ruler,
  Shield,
  Droplets,
} from "lucide-react";
import { formatCurrency, formatMW, formatDistance } from "@/lib/formatters";
import { getInfraForParcel } from "@/lib/mock-data";
import type { DCPersona } from "@/lib/types";
import { PERSONA_WEIGHTS } from "@/lib/dc-scoring";

const PERSONA_OPTIONS: { key: DCPersona; label: string; desc: string }[] = [
  { key: "HYPERSCALE", label: "Hyperscale", desc: "100MW+ campuses (AWS, Azure, GCP)" },
  { key: "EDGE_COMPUTE", label: "Edge", desc: "Low-latency urban deployments" },
  { key: "ENTERPRISE", label: "Enterprise", desc: "Balanced corporate DC" },
];

const BREAKDOWN_META = [
  { key: "power" as const, label: "Power", icon: Zap, color: "text-amber-400" },
  { key: "fiber" as const, label: "Fiber", icon: Wifi, color: "text-blue-400" },
  { key: "acreage" as const, label: "Acreage", icon: Ruler, color: "text-green-400" },
  { key: "hazard" as const, label: "Hazard", icon: Shield, color: "text-red-400" },
  { key: "water" as const, label: "Water", icon: Droplets, color: "text-cyan-400" },
];

function scoreGrade(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "A", color: "bg-green-600" };
  if (score >= 65) return { label: "B", color: "bg-teal-600" };
  if (score >= 50) return { label: "C", color: "bg-amber-600" };
  if (score >= 35) return { label: "D", color: "bg-orange-600" };
  return { label: "F", color: "bg-red-600" };
}

export default function DCScoreTab() {
  const selectedParcel = useAppStore((s) => s.selectedParcel);
  const activePersona = useAppStore((s) => s.activePersona);
  const setActivePersona = useAppStore((s) => s.setActivePersona);
  const score = useDCScore();

  if (!selectedParcel || !score) {
    return (
      <div className="text-zinc-500 text-xs py-8 text-center">
        Select a parcel to view DC scoring
      </div>
    );
  }

  const infra = getInfraForParcel(selectedParcel.apn);
  const grade = scoreGrade(score.totalScore);
  const weights = PERSONA_WEIGHTS[activePersona];

  return (
    <div className="space-y-4 mt-3">
      {/* Persona Toggle */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
          Development Persona
        </p>
        <div className="flex gap-1.5">
          {PERSONA_OPTIONS.map((p) => (
            <button
              key={p.key}
              onClick={() => setActivePersona(p.key)}
              className={`flex-1 py-2 px-2 rounded text-center transition-all ${
                activePersona === p.key
                  ? "bg-teal-600/20 border border-teal-500 text-teal-400"
                  : "border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500"
              }`}
            >
              <div className="text-xs font-medium">{p.label}</div>
              <div className="text-[9px] mt-0.5 opacity-70">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Overall Score */}
      <div className="flex items-center gap-4 bg-zinc-900 rounded-lg p-4 border border-zinc-800">
        <div
          className={`h-14 w-14 rounded-full flex items-center justify-center text-xl font-bold text-white ${grade.color}`}
        >
          {grade.label}
        </div>
        <div className="flex-1">
          <div className="text-2xl font-bold text-zinc-100">
            {score.totalScore.toFixed(1)}
            <span className="text-sm text-zinc-500 font-normal ml-1">/ 100</span>
          </div>
          <p className="text-xs text-zinc-400">{activePersona} Score</p>
        </div>
      </div>

      {/* Breakdown */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
          Score Breakdown
        </p>
        <div className="space-y-2.5">
          {BREAKDOWN_META.map((b) => {
            const Icon = b.icon;
            const value = score.breakdown[b.key];
            const weight = weights[
              b.key === "power"
                ? "powerProximity"
                : b.key === "fiber"
                ? "fiberLatency"
                : b.key === "hazard"
                ? "hazardRisk"
                : b.key === "water"
                ? "waterAccess"
                : "acreage"
            ];
            return (
              <div key={b.key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-3 w-3 ${b.color}`} />
                    <span className="text-xs text-zinc-300">{b.label}</span>
                    <span className="text-[10px] text-zinc-600">
                      ({(weight * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <span className="text-xs font-medium text-zinc-200">{value}</span>
                </div>
                <Progress value={value} className="h-1.5" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Metrics */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
          Key Metrics
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-zinc-900 rounded p-2.5 border border-zinc-800">
            <p className="text-[10px] text-zinc-500">Est. MW Capacity</p>
            <p className="text-sm font-semibold text-zinc-100">
              {formatMW(score.estimatedMWCapacity)}
            </p>
          </div>
          <div className="bg-zinc-900 rounded p-2.5 border border-zinc-800">
            <p className="text-[10px] text-zinc-500">Cost to Connect</p>
            <p className="text-sm font-semibold text-zinc-100">
              {formatCurrency(score.costToConnectPower)}
            </p>
          </div>
          <div className="bg-zinc-900 rounded p-2.5 border border-zinc-800">
            <p className="text-[10px] text-zinc-500">Dist. to Substation</p>
            <p className="text-sm font-semibold text-zinc-100">
              {formatDistance(infra.distToSubstationMiles)}
            </p>
          </div>
          <div className="bg-zinc-900 rounded p-2.5 border border-zinc-800">
            <p className="text-[10px] text-zinc-500">Fiber Paths</p>
            <p className="text-sm font-semibold text-zinc-100">
              {infra.fiberRedundantPaths}x redundant
            </p>
          </div>
        </div>
      </div>

      {/* Risk Flags */}
      {score.riskFlags.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
            Risk Flags
          </p>
          <div className="space-y-1.5">
            {score.riskFlags.map((flag, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 rounded p-2 border border-amber-500/20"
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {flag}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
