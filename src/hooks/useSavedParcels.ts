"use client";

import { useState, useEffect, useCallback } from "react";
import type { SavedParcel } from "@/lib/types";

export function useSavedParcels() {
  const [savedParcels, setSavedParcels] = useState<SavedParcel[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/saved");
      if (res.ok) {
        const data = await res.json();
        setSavedParcels(data);
      }
    } catch {
      // Ignore fetch errors during dev
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isSaved = useCallback(
    (apn: string) => savedParcels.some((p) => p.apn === apn),
    [savedParcels]
  );

  const save = useCallback(
    async (apn: string, notes?: string, collectionId?: string) => {
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
      }
    },
    [refresh]
  );

  const updateNotes = useCallback(
    async (apn: string, notes: string) => {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apn, notes }),
      });
      if (res.ok) {
        await refresh();
      }
    },
    [refresh]
  );

  const moveToCollection = useCallback(
    async (apn: string, collectionId: string | null) => {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apn, collection_id: collectionId }),
      });
      if (res.ok) {
        await refresh();
      }
    },
    [refresh]
  );

  const unsave = useCallback(
    async (apn: string) => {
      await fetch(`/api/saved?apn=${apn}`, { method: "DELETE" });
      await refresh();
    },
    [refresh]
  );

  return { savedParcels, loading, isSaved, save, updateNotes, moveToCollection, unsave, refresh };
}
