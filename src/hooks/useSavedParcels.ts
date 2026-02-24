"use client";

import { useState, useEffect, useCallback } from "react";
import type { SavedParcel } from "@/lib/types";

export function useSavedParcels() {
  const [savedParcels, setSavedParcels] = useState<SavedParcel[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/saved");
      if (res.ok) {
        const data = await res.json();
        setSavedParcels(data);
      }
    } catch {
      console.error("Failed to fetch saved parcels");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const isSaved = useCallback(
    (apn: string) => savedParcels.some((sp) => sp.apn === apn),
    [savedParcels]
  );

  const save = useCallback(
    async (apn: string, notes?: string, collectionId?: string) => {
      await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apn, notes, collection_id: collectionId }),
      });
      await fetchSaved();
    },
    [fetchSaved]
  );

  const unsave = useCallback(
    async (apn: string) => {
      await fetch(`/api/saved?apn=${apn}`, { method: "DELETE" });
      await fetchSaved();
    },
    [fetchSaved]
  );

  return { savedParcels, loading, isSaved, save, unsave, refresh: fetchSaved };
}
