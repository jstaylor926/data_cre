"use client";

import { useState, useEffect } from "react";
import type { SavedParcel, DueDiligenceTask } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  MapPin,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSavedParcels } from "@/hooks/useSavedParcels";
import { getParcelByAPN } from "@/lib/mock-data";
import { formatAcres, formatCurrency } from "@/lib/formatters";

interface SavedPropertyRowProps {
  savedParcel: SavedParcel;
}

export default function SavedPropertyRow({ savedParcel }: SavedPropertyRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [tasks, setTasks] = useState<DueDiligenceTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const { unsave } = useSavedParcels();

  const parcel = savedParcel.parcel ?? getParcelByAPN(savedParcel.apn);

  // Fetch DD tasks when expanded
  useEffect(() => {
    if (!expanded) return;
    setTasksLoading(true);
    fetch(`/api/due-diligence?saved_parcel_id=${savedParcel.id}`)
      .then((r) => r.json())
      .then((data) => setTasks(data.tasks ?? []))
      .catch(() => setTasks([]))
      .finally(() => setTasksLoading(false));
  }, [expanded, savedParcel.id]);

  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const fatalFlawCount = tasks.filter((t) => t.status === "FATAL_FLAW").length;
  const progressPct = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const handleToggleTask = async (taskId: string, newStatus: string) => {
    await fetch("/api/due-diligence", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status: newStatus }),
    });
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: newStatus as DueDiligenceTask["status"] } : t
      )
    );
  };

  return (
    <Card
      className={`border transition-colors ${
        fatalFlawCount > 0
          ? "bg-red-500/5 border-red-500/20"
          : "bg-zinc-900 border-zinc-800"
      }`}
    >
      {/* Collapsed Row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center gap-3 text-left"
      >
        <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-200 truncate">
              {parcel?.site_address ?? savedParcel.apn}
            </span>
            {fatalFlawCount > 0 && (
              <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                Fatal Flaw
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
            <span>{savedParcel.apn}</span>
            {parcel && (
              <>
                <span>&middot;</span>
                <span>{formatAcres(parcel.acres)}</span>
                <span>&middot;</span>
                <span>{parcel.zoning}</span>
              </>
            )}
          </div>
          {tasks.length > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <Progress value={progressPct} className="h-1 flex-1" />
              <span className="text-[10px] text-zinc-500">
                {completedCount}/{tasks.length}
              </span>
            </div>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-zinc-500 shrink-0 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expanded: Due Diligence Checklist */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-zinc-800/50">
          {tasksLoading ? (
            <div className="py-4 text-center text-xs text-zinc-500">
              Loading checklist...
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-4 text-center text-xs text-zinc-500">
              No due diligence tasks. Save will auto-seed the checklist.
            </div>
          ) : (
            <div className="mt-2 space-y-3">
              {/* Group by category */}
              {Array.from(new Set(tasks.map((t) => t.category))).map(
                (category) => (
                  <div key={category}>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">
                      {category}
                    </p>
                    <div className="space-y-1">
                      {tasks
                        .filter((t) => t.category === category)
                        .map((task) => (
                          <div
                            key={task.id}
                            className={`flex items-center gap-2 py-1 px-1.5 rounded text-xs ${
                              task.status === "FATAL_FLAW"
                                ? "bg-red-500/10"
                                : task.status === "COMPLETED"
                                ? "opacity-60"
                                : ""
                            }`}
                          >
                            <Checkbox
                              checked={task.status === "COMPLETED"}
                              onCheckedChange={(checked) =>
                                handleToggleTask(
                                  task.id,
                                  checked ? "COMPLETED" : "PENDING"
                                )
                              }
                            />
                            <span
                              className={`flex-1 ${
                                task.status === "COMPLETED"
                                  ? "line-through text-zinc-600"
                                  : task.status === "FATAL_FLAW"
                                  ? "text-red-400"
                                  : "text-zinc-300"
                              }`}
                            >
                              {task.task_name}
                            </span>
                            {task.status === "FATAL_FLAW" && (
                              <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                            )}
                            {task.status !== "FATAL_FLAW" &&
                              task.status !== "COMPLETED" && (
                                <button
                                  onClick={() =>
                                    handleToggleTask(task.id, "FATAL_FLAW")
                                  }
                                  className="text-zinc-600 hover:text-red-400 transition-colors"
                                  title="Mark as Fatal Flaw"
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                </button>
                              )}
                          </div>
                        ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          <div className="flex justify-end mt-3">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-zinc-500 hover:text-red-400"
              onClick={() => unsave(savedParcel.apn)}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
