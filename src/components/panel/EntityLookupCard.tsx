"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Building2, Loader2, ExternalLink } from "lucide-react";
import type { EntityResult } from "@/lib/types";

interface EntityLookupCardProps {
  ownerName: string;
}

export function EntityLookupCard({ ownerName }: EntityLookupCardProps) {
  const [loading, setLoading] = useState(false);
  const [entity, setEntity] = useState<EntityResult | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleLookup = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/entity/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ llc_name: ownerName }),
      });
      if (res.ok) {
        const data = await res.json();
        setEntity(data);
        setExpanded(true);
      }
    } catch {
      console.error("Entity lookup failed");
    } finally {
      setLoading(false);
    }
  };

  if (!expanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        onClick={handleLookup}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
        ) : (
          <Building2 className="h-3 w-3 mr-1.5" />
        )}
        Pierce Corporate Veil
      </Button>
    );
  }

  if (!entity) return null;

  return (
    <Card className="bg-zinc-900 border-zinc-700 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Building2 className="h-3.5 w-3.5 text-teal-400" />
        <span className="text-xs font-medium text-zinc-200">Entity Details</span>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-zinc-500">LLC Name</span>
          <span className="text-zinc-200">{entity.llc_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">State</span>
          <span className="text-zinc-200">{entity.state}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Principal</span>
          <span className="text-teal-400">{entity.principal_name ?? "Unknown"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Registered Agent</span>
          <span className="text-zinc-200">{entity.agent_name ?? "N/A"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Status</span>
          <span
            className={
              entity.status === "Active" ? "text-green-400" : "text-red-400"
            }
          >
            {entity.status}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Formed</span>
          <span className="text-zinc-200">{entity.formed_date ?? "N/A"}</span>
        </div>
      </div>
      {entity.related_parcels.length > 0 && (
        <div className="pt-2 border-t border-zinc-800">
          <p className="text-[10px] text-zinc-500 mb-1">
            Related Properties ({entity.related_parcels.length})
          </p>
          {entity.related_parcels.map((rp) => (
            <div key={rp.apn} className="text-[11px] text-zinc-300 py-0.5">
              {rp.apn} &middot; {rp.site_address ?? "No address"}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
