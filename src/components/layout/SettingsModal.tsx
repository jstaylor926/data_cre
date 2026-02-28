"use client";

import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, Zap, Brain, Briefcase, Building2, Layers, Check } from 'lucide-react';
import { useAppStore, FeatureFlags } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    features: {
      enableAIZoning: false,
      enableAutoComps: false,
      enableDCScoring: false,
      enableFirmIntel: false,
      enableEntityLookup: true,
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    features: {
      enableAIZoning: true,
      enableAutoComps: true,
      enableDCScoring: true,
      enableFirmIntel: false,
      enableEntityLookup: true,
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    features: {
      enableAIZoning: true,
      enableAutoComps: true,
      enableDCScoring: true,
      enableFirmIntel: true,
      enableEntityLookup: true,
    }
  }
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { features, setFeatures } = useAppStore();
  if (!isOpen || typeof document === "undefined") return null;

  const toggleFeature = (key: keyof FeatureFlags) => {
    setFeatures({ [key]: !features[key] });
  };

  const applyTier = (tierFeatures: FeatureFlags) => {
    setFeatures(tierFeatures);
  };

  const isTierActive = (tierFeatures: FeatureFlags) => {
    return Object.keys(tierFeatures).every(
      (key) => features[key as keyof FeatureFlags] === tierFeatures[key as keyof FeatureFlags]
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4 sm:p-6">
      <div 
        role="dialog"
        aria-labelledby="settings-title"
        aria-describedby="settings-desc"
        className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-line2 bg-ink2 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4 shrink-0">
          <h2 id="settings-title" className="font-head text-xl tracking-wider text-bright flex items-center gap-2">
            <Shield className="text-pd-teal" size={18} />
            SYSTEM SETTINGS
          </h2>
          <button onClick={onClose} className="text-pd-muted hover:text-bright transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <div id="settings-desc" className="sr-only">
          Manage membership tiers and individual feature toggles for the Atlas CRE platform.
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Tiers Section */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-pd-muted mb-4">Membership Tiers (Presets)</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TIERS.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => applyTier(tier.features)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    isTierActive(tier.features)
                      ? 'border-pd-teal bg-pd-teal/10 text-pd-teal shadow-[0_0_15px_-5px_rgba(0,212,200,0.4)]'
                      : 'border-line2 bg-ink3 text-pd-muted hover:border-line'
                  }`}
                >
                  <span className="font-head text-sm tracking-wide mb-1">{tier.name}</span>
                  {isTierActive(tier.features) && <Check size={12} />}
                </button>
              ))}
            </div>
          </div>

          {/* Individual Flags Section */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-pd-muted mb-4">Individual Feature Flags</label>
            <div className="space-y-3">
              <FeatureToggle 
                icon={<Brain size={16} />}
                label="AI Zoning & Scoring"
                description="Claude AI interpretation of zoning ordinances."
                active={features.enableAIZoning}
                onToggle={() => toggleFeature('enableAIZoning')}
              />
              <FeatureToggle 
                icon={<Zap size={16} />}
                label="Auto Comps"
                description="Spatial query for comparable sales."
                active={features.enableAutoComps}
                onToggle={() => toggleFeature('enableAutoComps')}
              />
              <FeatureToggle 
                icon={<Layers size={16} />}
                label="Data Center Scoring"
                description="Infrastructure scoring for mission critical sites."
                active={features.enableDCScoring}
                onToggle={() => toggleFeature('enableDCScoring')}
              />
              <FeatureToggle 
                icon={<Briefcase size={16} />}
                label="Firm Intel (CRM)"
                description="Internal project tracking and proprietary scoring."
                active={features.enableFirmIntel}
                onToggle={() => toggleFeature('enableFirmIntel')}
              />
              <FeatureToggle 
                icon={<Building2 size={16} />}
                label="LLC Entity Lookup"
                description="Pierce LLC owners via corporate record matching."
                active={features.enableEntityLookup}
                onToggle={() => toggleFeature('enableEntityLookup')}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-line px-6 py-4 bg-ink3/50 shrink-0">
          <Button onClick={onClose} className="w-full bg-pd-teal hover:bg-pd-teal/90 text-ink font-bold">
            CLOSE & SAVE PREFERENCES
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function FeatureToggle({ icon, label, description, active, onToggle }: { 
  icon: ReactNode, 
  label: string, 
  description: string, 
  active: boolean, 
  onToggle: () => void 
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-ink3 border border-line2">
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${active ? 'bg-pd-teal/10 text-pd-teal' : 'bg-ink4 text-pd-muted'}`}>
          {icon}
        </div>
        <div>
          <p className={`text-xs font-semibold ${active ? 'text-bright' : 'text-pd-muted'}`}>{label}</p>
          <p className="text-[10px] text-pd-muted font-barlow">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          active ? 'bg-pd-teal' : 'bg-line2'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            active ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
