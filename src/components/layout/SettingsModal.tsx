"use client";

import { useState } from "react";
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
  UserPlus,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCapabilities } from "@/components/capabilities/CapabilityProvider";
import { CAPABILITY_KEYS, type CapabilityKey } from "@/lib/capability-constants";

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
  
  // Admin State
  const [adminUserId, setAdminUserId] = useState("");
  const [adminCapability, setAdminCapability] = useState<CapabilityKey>(CAPABILITY_KEYS[0]);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  if (!isOpen || typeof document === "undefined") return null;

  const handleUpdateCapability = async (enabled: boolean) => {
    if (!adminUserId) return;
    setUpdating(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/capabilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: adminUserId,
          capability: adminCapability,
          enabled,
          reason: `Admin manual ${enabled ? "grant" : "revoke"} via UI`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");

      setMessage({ text: `Successfully ${enabled ? "granted" : "revoked"} ${adminCapability}`, type: "success" });
    } catch (err) {
      const error = err as Error;
      setMessage({ text: error.message, type: "error" });
    } finally {
      setUpdating(false);
    }
  };

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
              Admin Scope
            </p>
            <p className="mt-2 text-xs text-text flex items-center gap-2">
              Capability Management:{" "}
              <span className={hasCapability("admin.capabilities.manage") ? "text-pd-teal" : "text-pd-muted"}>
                {hasCapability("admin.capabilities.manage") ? "Enabled" : "Disabled"}
              </span>
              {hasCapability("admin.capabilities.manage") && <ShieldAlert size={12} className="text-pd-teal" />}
            </p>
          </div>

          {hasCapability("admin.capabilities.manage") && (
            <div className="rounded-xl border border-line2 bg-ink3 p-4 space-y-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-pd-teal flex items-center gap-2">
                <UserPlus size={12} />
                Override Management
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-pd-muted mb-1 uppercase tracking-wider">Target User ID</label>
                  <input 
                    type="text" 
                    placeholder="User UUID..." 
                    className="w-full bg-ink4 border border-line2 rounded px-3 py-2 text-xs text-bright focus:outline-none focus:border-pd-teal font-mono"
                    value={adminUserId}
                    onChange={(e) => setAdminUserId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-pd-muted mb-1 uppercase tracking-wider">Capability</label>
                  <select 
                    className="w-full bg-ink4 border border-line2 rounded px-3 py-2 text-xs text-bright focus:outline-none focus:border-pd-teal"
                    value={adminCapability}
                    onChange={(e) => setAdminCapability(e.target.value as CapabilityKey)}
                  >
                    {CAPABILITY_KEYS.map(key => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <Button 
                    onClick={() => handleUpdateCapability(true)}
                    disabled={!adminUserId || updating}
                    className="h-8 bg-pd-teal text-ink text-[11px] font-bold px-4"
                  >
                    GRANT
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleUpdateCapability(false)}
                    disabled={!adminUserId || updating}
                    className="h-8 border-line2 text-pd-muted hover:text-bright text-[11px] px-4"
                  >
                    REVOKE
                  </Button>
                </div>
                {message && (
                  <p className={`text-[10px] font-medium ${message.type === 'error' ? 'text-rose-400' : 'text-pd-teal'}`}>
                    {message.text}
                  </p>
                )}
              </div>
            </div>
          )}
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
