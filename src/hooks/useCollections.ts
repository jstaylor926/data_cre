"use client";

import { useState, useEffect, useCallback } from "react";
import type { Collection } from "@/lib/types";
import { useAuth } from "@/components/auth/AuthProvider";

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const { status, openAuthModal } = useAuth();
  const isAuthenticated = status === "authenticated";
  const authRequired = status === "unauthenticated";

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setCollections([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/collections");
      if (res.ok) {
        const data = await res.json();
        setCollections(data);
      } else if (res.status === 401) {
        setCollections([]);
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

  const create = useCallback(
    async (name: string) => {
      if (!isAuthenticated) {
        openAuthModal();
        return null;
      }
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const data = await res.json();
        await refresh();
        return data as Collection;
      }
      if (res.status === 401) openAuthModal();
      return null;
    },
    [isAuthenticated, openAuthModal, refresh]
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      if (!isAuthenticated) {
        openAuthModal();
        return;
      }
      const res = await fetch("/api/collections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name }),
      });
      if (res.ok) {
        await refresh();
      } else if (res.status === 401) {
        openAuthModal();
      }
    },
    [isAuthenticated, openAuthModal, refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      if (!isAuthenticated) {
        openAuthModal();
        return;
      }
      await fetch(`/api/collections?id=${id}`, { method: "DELETE" });
      await refresh();
    },
    [isAuthenticated, openAuthModal, refresh]
  );

  return { collections, loading, authRequired, create, rename, remove, refresh };
}
