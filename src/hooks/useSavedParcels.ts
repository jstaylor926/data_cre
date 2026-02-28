"use client";

import { useState, useEffect, useCallback } from "react";
import type { SavedParcel } from "@/lib/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCapabilities } from "@/components/capabilities/CapabilityProvider";

export function useSavedParcels() {
  const [savedParcels, setSavedParcels] = useState<SavedParcel[]>([]);
  const [loading, setLoading] = useState(false);
  const { status, openAuthModal } = useAuth();
  const { status: capabilityStatus, hasCapability } = useCapabilities();
  const isAuthenticated = status === "authenticated";
  const authRequired = status === "unauthenticated";
  const canRead = hasCapability("saved.read");
  const canWrite = hasCapability("saved.write");
  const accessDenied =
    status === "authenticated" && capabilityStatus === "ready" && !canRead;

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !canRead) {
      setSavedParcels([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/saved");
      if (res.ok) {
        const data = await res.json();
        setSavedParcels(data);
      } else if (res.status === 401) {
        setSavedParcels([]);
      } else if (res.status === 403) {
        setSavedParcels([]);
      }
    } catch {
      // Ignore fetch errors during dev
    } finally {
      setLoading(false);
    }
  }, [canRead, isAuthenticated]);

  useEffect(() => {
    if (status === "loading" || capabilityStatus === "loading") {
      setLoading(true);
      return;
    }
    void refresh();
  }, [capabilityStatus, refresh, status]);

  const isSaved = useCallback(
    (apn: string) => savedParcels.some((p) => p.apn === apn),
    [savedParcels]
  );

  const save = useCallback(
    async (apn: string, notes?: string, collectionId?: string) => {
      if (!isAuthenticated) {
        openAuthModal();
        return;
      }
      if (!canWrite) return;
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apn,
          notes,
          collection_id: collectionId,
        }),
      });
      if (res.ok) {
        await refresh();
      } else if (res.status === 401) {
        openAuthModal();
      }
    },
    [canWrite, isAuthenticated, openAuthModal, refresh]
  );

  const updateNotes = useCallback(
    async (apn: string, notes: string) => {
      if (!isAuthenticated) {
        openAuthModal();
        return;
      }
      if (!canWrite) return;
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apn, notes }),
      });
      if (res.ok) {
        await refresh();
      } else if (res.status === 401) {
        openAuthModal();
      }
    },
    [canWrite, isAuthenticated, openAuthModal, refresh]
  );

  const moveToCollection = useCallback(
    async (apn: string, collectionId: string | null) => {
      if (!isAuthenticated) {
        openAuthModal();
        return;
      }
      if (!canWrite) return;
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apn, collection_id: collectionId }),
      });
      if (res.ok) {
        await refresh();
      } else if (res.status === 401) {
        openAuthModal();
      }
    },
    [canWrite, isAuthenticated, openAuthModal, refresh]
  );

  const unsave = useCallback(
    async (apn: string) => {
      if (!isAuthenticated) {
        openAuthModal();
        return;
      }
      if (!canWrite) return;
      await fetch(`/api/saved?apn=${apn}`, { method: "DELETE" });
      await refresh();
    },
    [canWrite, isAuthenticated, openAuthModal, refresh]
  );

  return {
    savedParcels,
    loading,
    authRequired,
    accessDenied,
    isSaved,
    save,
    updateNotes,
    moveToCollection,
    unsave,
    refresh,
  };
}
