"use client";

import { useState, useEffect, useCallback } from "react";
import type { Collection } from "@/lib/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCapabilities } from "@/components/capabilities/CapabilityProvider";

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const { status, openAuthModal } = useAuth();
  const { status: capabilityStatus, hasCapability } = useCapabilities();
  const isAuthenticated = status === "authenticated";
  const authRequired = status === "unauthenticated";
  const canManage = hasCapability("collections.manage");
  const accessDenied =
    status === "authenticated" && capabilityStatus === "ready" && !canManage;

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !canManage) {
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
      } else if (res.status === 403) {
        setCollections([]);
      }
    } catch {
      // Ignore fetch errors during dev
    } finally {
      setLoading(false);
    }
  }, [canManage, isAuthenticated]);

  useEffect(() => {
    if (status === "loading" || capabilityStatus === "loading") {
      setLoading(true);
      return;
    }
    void refresh();
  }, [capabilityStatus, refresh, status]);

  const create = useCallback(
    async (name: string) => {
      if (!isAuthenticated) {
        openAuthModal();
        return null;
      }
      if (!canManage) return null;
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
    [canManage, isAuthenticated, openAuthModal, refresh]
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      if (!isAuthenticated) {
        openAuthModal();
        return;
      }
      if (!canManage) return;
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
    [canManage, isAuthenticated, openAuthModal, refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      if (!isAuthenticated) {
        openAuthModal();
        return;
      }
      if (!canManage) return;
      await fetch(`/api/collections?id=${id}`, { method: "DELETE" });
      await refresh();
    },
    [canManage, isAuthenticated, openAuthModal, refresh]
  );

  return {
    collections,
    loading,
    authRequired,
    accessDenied,
    create,
    rename,
    remove,
    refresh,
  };
}
