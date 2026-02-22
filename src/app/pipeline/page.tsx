"use client";

import React, { useState } from "react";
import EnterpriseShell from "@/components/layout/EnterpriseShell";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  Filter, 
  Search, 
  MoreVertical, 
  Calendar, 
  User, 
  ArrowUpRight,
  GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DealStage } from "@/lib/types";

const STAGES: { id: DealStage; label: string }[] = [
  { id: "evaluating", label: "Evaluating" },
  { id: "loi", label: "LOI" },
  { id: "due_diligence", label: "Due Diligence" },
  { id: "under_contract", label: "Under Contract" },
];

export default function PipelinePage() {
  const deals = useAppStore((s) => s.deals);
  const [view, setView] = useState<"kanban" | "list">("kanban");

  return (
    <EnterpriseShell title="Deal Pipeline">
      <div className="flex flex-col h-full bg-ink">
        
        {/* Pipeline Toolbar */}
        <div className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-line bg-ink2/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="flex rounded-md border border-line p-1 bg-ink3">
              <button 
                onClick={() => setView("kanban")}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-sm transition-colors",
                  view === "kanban" ? "bg-teal text-ink" : "text-pd-muted hover:text-text"
                )}
              >
                Board
              </button>
              <button 
                onClick={() => setView("list")}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-sm transition-colors",
                  view === "list" ? "bg-teal text-ink" : "text-pd-muted hover:text-text"
                )}
              >
                List
              </button>
            </div>
            
            <div className="h-6 w-px bg-line" />
            
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-pd-muted" />
              <input 
                type="text" 
                placeholder="Search deals..." 
                className="pl-9 pr-4 py-1.5 bg-ink3 border border-line rounded-md text-xs text-text focus:outline-none focus:border-teal/50 transition-colors w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-1.5 border border-line rounded-md text-xs font-medium text-text hover:bg-ink2 transition-colors">
              <Filter size={14} />
              Filter
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-teal text-ink rounded-md text-xs font-bold hover:bg-teal/90 transition-colors">
              <Plus size={14} />
              New Deal
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <div className="flex h-full gap-6 min-w-max">
            {STAGES.map((stage) => (
              <div key={stage.id} className="flex flex-col w-[300px] gap-4">
                {/* Column Header */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text">{stage.label}</h3>
                    <span className="px-1.5 py-0.5 rounded-full bg-ink3 border border-line text-[10px] text-pd-muted font-mono">
                      {deals.filter(d => d.stage === stage.id).length}
                    </span>
                  </div>
                  <button className="text-pd-muted hover:text-text">
                    <MoreVertical size={14} />
                  </button>
                </div>

                {/* Column Cards */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
                  {deals.filter(d => d.stage === stage.id).map((deal) => (
                    <Card key={deal.id} className="bg-ink2 border-line hover:border-teal/50 transition-all cursor-pointer group shadow-sm">
                      <CardContent className="p-4 space-y-4">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-text group-hover:text-teal transition-colors leading-tight">
                              {deal.deal_name}
                            </h4>
                            <ArrowUpRight size={14} className="text-pd-muted group-hover:text-teal transition-colors" />
                          </div>
                          <p className="text-[11px] text-pd-muted truncate">{deal.property_address}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-ink3 border border-line text-[9px] font-mono text-pd-muted">
                            {deal.target_product_type}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-ink3 border border-line text-[9px] font-mono text-pd-muted">
                            {deal.target_sf?.toLocaleString()} SF
                          </span>
                        </div>

                        <div className="pt-2 border-t border-line flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-ink3 border border-line flex items-center justify-center overflow-hidden">
                              <User size={10} className="text-pd-muted" />
                            </div>
                            <span className="text-[10px] text-pd-muted">Josh T.</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-pd-muted">
                            <Calendar size={12} />
                            <span className="text-[10px]">Feb 20</span>
                          </div>
                        </div>

                        {deal.priority === "high" && (
                          <div className="absolute top-0 right-0 h-1 w-12 bg-red rounded-bl-sm" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Empty state / Add card */}
                  <button className="w-full py-3 border border-dashed border-line rounded-lg text-pd-muted hover:border-teal/30 hover:text-teal hover:bg-teal/5 transition-all flex items-center justify-center gap-2 text-xs font-medium">
                    <Plus size={14} />
                    Add Deal
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </EnterpriseShell>
  );
}
