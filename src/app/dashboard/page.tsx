"use client";

import React from "react";
import EnterpriseShell from "@/components/layout/EnterpriseShell";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  TrendingUp, 
  Target, 
  MapPin, 
  Clock, 
  BarChart3, 
  Activity,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const deals = useAppStore((s) => s.deals);
  const currentOrg = useAppStore((s) => s.currentOrg);

  const stats = [
    { label: "Active Pipeline", value: deals.length, icon: Target, color: "text-teal" },
    { label: "Total Target SF", value: "495k", icon: BarChart3, color: "text-amber" },
    { label: "High Priority", value: deals.filter(d => d.priority === "high").length, icon: Activity, color: "text-red" },
    { label: "Sites Scanned", value: "1,248", icon: MapPin, color: "text-violet" },
  ];

  return (
    <EnterpriseShell title="Executive Overview">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Welcome Header */}
          <div>
            <h1 className="text-2xl font-bold text-text">Welcome back, {currentOrg?.name}</h1>
            <p className="text-pd-muted">Here's what's happening across your portfolios today.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <Card key={i} className="bg-ink2 border-line">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-ink3 border border-line ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider text-pd-muted">{stat.label}</p>
                    <p className="text-2xl font-bold text-text">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Recent Deals */}
            <Card className="lg:col-span-2 bg-ink2 border-line">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Active Pipeline</CardTitle>
                  <CardDescription className="text-xs">Most recent deal activity</CardDescription>
                </div>
                <Link href="/pipeline" className="text-xs text-teal hover:underline flex items-center gap-1">
                  View Full Pipeline <ChevronRight size={14} />
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deals.map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between p-4 rounded-lg bg-ink3 border border-line hover:border-teal/30 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded bg-ink2 border border-line flex items-center justify-center font-head text-teal">
                          {deal.deal_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text group-hover:text-teal transition-colors">{deal.deal_name}</p>
                          <p className="text-xs text-pd-muted">{deal.property_address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[10px] font-mono uppercase tracking-wider text-pd-muted">Stage</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-teal" />
                            <span className="text-xs text-text capitalize">{deal.stage}</span>
                          </div>
                        </div>
                        <div className="text-right min-w-[80px]">
                          <p className="text-[10px] font-mono uppercase tracking-wider text-pd-muted">Priority</p>
                          <span className={cn(
                            "text-xs mt-0.5 inline-block",
                            deal.priority === "high" ? "text-red" : "text-amber"
                          )}>
                            {deal.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Insights Sidebar */}
            <Card className="bg-ink2 border-line border-teal/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-teal" />
                  <CardTitle className="text-lg">AI Market Insights</CardTitle>
                </div>
                <CardDescription className="text-xs">Based on current watch areas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text">Norcross Hotspot</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal/10 text-teal border border-teal/20">HIGH ACTIVITY</span>
                  </div>
                  <p className="text-xs text-pd-muted leading-relaxed">
                    We've detected 3 new commercial parcel transfers in your Gwinnett watch area that match the "Data Center" profile.
                  </p>
                  <button className="text-xs text-teal font-medium hover:underline">Review Matches</button>
                </div>

                <div className="h-px bg-line" />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text">Zoning Shift</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber/10 text-amber border border-amber/20">REGULATORY</span>
                  </div>
                  <p className="text-xs text-pd-muted leading-relaxed">
                    Proposed amendment in Lawrenceville (U-2026-04) could affect infrastructure setback requirements for industrial developments.
                  </p>
                  <button className="text-xs text-teal font-medium hover:underline">Read Brief</button>
                </div>

                <div className="h-px bg-line" />

                <div className="p-4 rounded-lg bg-teal/5 border border-teal/10">
                  <p className="text-xs font-medium text-teal mb-1">Weekly Digest</p>
                  <p className="text-[11px] text-pd-muted mb-3">Your summary of market movements and team progress is ready.</p>
                  <button className="w-full py-2 bg-teal text-ink text-xs font-bold rounded hover:bg-teal/90 transition-colors">
                    DOWNLOAD PDF
                  </button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </EnterpriseShell>
  );
}
