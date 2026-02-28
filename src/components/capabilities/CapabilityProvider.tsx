"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAppStore } from "@/store/useAppStore";
import {
  GUEST_CAPABILITIES,
  LEGACY_AUTHENTICATED_CAPABILITIES,
  capabilitiesToFeatureFlags,
  normalizeCapabilityMap,
  type CapabilityKey,
  type CapabilityMap,
} from "@/lib/capability-constants";

type CapabilityStatus = "loading" | "ready";

interface MeContextPayload {
  authenticated?: boolean;
  capabilities?: Partial<Record<string, boolean>> | null;
}

interface CapabilityContextValue {
  status: CapabilityStatus;
  capabilities: CapabilityMap;
  hasCapability: (capability: CapabilityKey) => boolean;
  refresh: () => Promise<void>;
}

const CapabilityContext = createContext<CapabilityContextValue | null>(null);

export function CapabilityProvider({ children }: { children: ReactNode }) {
  const { status: authStatus } = useAuth();
  const setFeatures = useAppStore((s) => s.setFeatures);
  const [status, setStatus] = useState<CapabilityStatus>("loading");
  const [capabilities, setCapabilities] = useState<CapabilityMap>({
    ...GUEST_CAPABILITIES,
  });

  const applyCapabilities = useCallback(
    (next: CapabilityMap) => {
      setCapabilities(next);
      setFeatures(capabilitiesToFeatureFlags(next));
    },
    [setFeatures]
  );

  const loadCapabilities = useCallback(async () => {
    const fallback =
      authStatus === "authenticated"
        ? LEGACY_AUTHENTICATED_CAPABILITIES
        : GUEST_CAPABILITIES;

    try {
      const res = await fetch("/api/me/context", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Capability context request failed: ${res.status}`);
      }
      const payload = (await res.json()) as MeContextPayload;
      const nextFallback = payload.authenticated
        ? LEGACY_AUTHENTICATED_CAPABILITIES
        : GUEST_CAPABILITIES;
      const next = normalizeCapabilityMap(payload.capabilities, nextFallback);
      applyCapabilities(next);
    } catch {
      applyCapabilities({ ...fallback });
    } finally {
      setStatus("ready");
    }
  }, [applyCapabilities, authStatus]);

  useEffect(() => {
    if (authStatus === "loading") {
      setStatus("loading");
      return;
    }

    setStatus("loading");
    void loadCapabilities();
  }, [authStatus, loadCapabilities]);

  const refresh = useCallback(async () => {
    setStatus("loading");
    await loadCapabilities();
  }, [loadCapabilities]);

  const value = useMemo<CapabilityContextValue>(
    () => ({
      status,
      capabilities,
      hasCapability: (capability) => capabilities[capability],
      refresh,
    }),
    [capabilities, refresh, status]
  );

  return (
    <CapabilityContext.Provider value={value}>
      {children}
    </CapabilityContext.Provider>
  );
}

export function useCapabilities() {
  const ctx = useContext(CapabilityContext);
  if (!ctx) {
    throw new Error("useCapabilities must be used within CapabilityProvider");
  }
  return ctx;
}
