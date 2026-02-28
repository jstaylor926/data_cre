"use client";

import { useState, useEffect, useCallback } from "react";
import type { SavedParcel } from "@/lib/types";
import { useAuth } from "@/components/auth/AuthProvider";

export function useSavedParcels() {
  const [savedParcels, setSavedParcels] = useState<SavedParcel[]>([]);
  const [loading, setLoading] = useState(false);
  const { status, openAuthModal } = useAuth();
  const isAuthenticated = status === "authenticated";
  const authRequired = status === "unauthenticated";

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
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
      }
    } catch {
      // Ignore fetch errors during dev
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
      return;
    }
    void refresh();
  }, [refresh, status]);

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
    [isAuthenticated, openAuthModal, refresh]
  );

  const updateNotes = useCallback(
    async (apn: string, notes: string) => {
      if (!isAuthenticated) {
        openAuthModal();
        return;
      }
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
    [isAuthenticated, openAuthModal, refresh]
  );

  const moveToCollection = useCallback(
    async (apn: string, collectionId: string | null) => {
      if (!isAuthenticated) {
        openAuthModal();
        return;
      }
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
    [isAuthenticated, openAuthModal, refresh]
  );

  const unsave = useCallback(
    async (apn: string) => {
      if (!isAuthenticated) {
        openAuthModal();
        return;
      }
      await fetch(`/api/saved?apn=${apn}`, { method: "DELETE" });
      await refresh();
    },
    [isAuthenticated, openAuthModal, refresh]
  );

  return {
    savedParcels,
    loading,
    authRequired,
    isSaved,
    save,
    updateNotes,
    moveToCollection,
    unsave,
    refresh,
  };
}
