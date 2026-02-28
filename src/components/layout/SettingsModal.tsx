"use client";

import { createPortal } from "react-dom";
import {
  X,
  Shield,
  Zap,
  Brain,
  Briefcase,
  Building2,
  Layers,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCapabilities } from "@/components/capabilities/CapabilityProvider";
import type { CapabilityKey } from "@/lib/capability-constants";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FEATURE_ROWS: Array<{
  capability: CapabilityKey;
  label: string;
  description: string;
  icon: typeof Brain;
}> = [
  {
    capability: "feature.ai_zoning",
    label: "AI Zoning & Scoring",
    description: "Claude analysis for parcel scoring, zoning, and brief generation.",
    icon: Brain,
  },
  {
    capability: "feature.auto_comps",
    label: "Auto Comps",
    description: "Comparable parcel analysis and supporting score workflows.",
    icon: Zap,
  },
  {
    capability: "feature.dc_scoring",
    label: "Data Center Scoring",
    description: "Power/fiber/water/environment scoring and Site Scout tooling.",
    icon: Layers,
  },
  {
    capability: "crm.view",
    label: "Firm Intel (CRM)",
    description: "Organization-scoped CRM workspace visibility.",
    icon: Briefcase,
  },
  {
    capability: "feature.entity_lookup",
    label: "LLC Entity Lookup",
    description: "Ownership/entity lookup workflows and related parcel context.",
    icon: Building2,
  },
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { status: authStatus, user } = useAuth();
  const { status: capabilityStatus, hasCapability } = useCapabilities();
  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm sm:p-6">
      <div
        role="dialog"
        aria-labelledby="settings-title"
        aria-describedby="settings-desc"
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line2 bg-ink2 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-4">
          <h2
            id="settings-title"
            className="flex items-center gap-2 font-head text-xl tracking-wider text-bright"
          >
            <Shield className="text-pd-teal" size={18} />
            ACCESS SETTINGS
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-pd-muted transition-colors hover:text-bright"
          >
            <X size={20} />
          </button>
        </div>

        <div id="settings-desc" className="sr-only">
          Review account authentication state and capability-managed feature access.
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto p-6">
          <div className="rounded-xl border border-line2 bg-ink3 p-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-pd-muted">
              Account Context
            </p>
            <p className="text-xs text-text">
              {authStatus === "authenticated"
                ? `Signed in as ${user?.email ?? "authenticated user"}`
                : authStatus === "loading"
                ? "Resolving authentication..."
                : "Not signed in"}
            </p>
            <p className="mt-1 font-mono text-[10px] text-pd-muted">
              Access is account-managed. Feature toggles are synchronized from capability policies.
            </p>
          </div>

          <div>
            <label className="mb-4 block font-mono text-[10px] uppercase tracking-widest text-pd-muted">
              Effective Feature Access
            </label>
            <div className="space-y-3">
              {FEATURE_ROWS.map((feature) => (
                <FeatureRow
                  key={feature.capability}
                  icon={feature.icon}
                  label={feature.label}
                  description={feature.description}
                  active={hasCapability(feature.capability)}
                />
              ))}
            </div>
            {capabilityStatus === "loading" && (
              <p className="mt-3 font-mono text-[10px] text-pd-muted">
                Refreshing capability context...
              </p>
            )}
          </div>

          <div className="rounded-xl border border-line2 bg-ink3 p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-pd-muted">
              Admin Capability
            </p>
            <p className="mt-2 text-xs text-text">
              Capability Management:{" "}
              <span className={hasCapability("admin.capabilities.manage") ? "text-teal" : "text-pd-muted"}>
                {hasCapability("admin.capabilities.manage") ? "Enabled" : "Disabled"}
              </span>
            </p>
          </div>
        </div>

        <div className="shrink-0 border-t border-line bg-ink3/50 px-6 py-4">
          <Button
            onClick={onClose}
            className="w-full bg-pd-teal font-bold text-ink hover:bg-pd-teal/90"
          >
            CLOSE
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function FeatureRow({
  icon: Icon,
  label,
  description,
  active,
}: {
  icon: typeof Brain;
  label: string;
  description: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-line2 bg-ink3 p-3">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            active ? "bg-pd-teal/10 text-pd-teal" : "bg-ink4 text-pd-muted"
          }`}
        >
          <Icon size={16} />
        </div>
        <div>
          <p className={`text-xs font-semibold ${active ? "text-bright" : "text-pd-muted"}`}>
            {label}
          </p>
          <p className="font-barlow text-[10px] text-pd-muted">{description}</p>
        </div>
      </div>
      <span
        className={`inline-flex items-center gap-1 rounded border px-2 py-1 font-mono text-[9px] uppercase tracking-wider ${
          active
            ? "border-pd-teal bg-pd-teal/10 text-pd-teal"
            : "border-line2 bg-ink4 text-pd-muted"
        }`}
      >
        {active && <Check size={10} />}
        {active ? "On" : "Off"}
      </span>
    </div>
  );
}
