import { NextResponse } from "next/server";
import type { DueDiligenceTask } from "@/lib/types";
import { DEFAULT_DD_TASKS } from "@/lib/constants";

// Shared in-memory store — in production use Supabase
// Import is re-created per cold start; for dev we use module-level state
const ddTaskStore: DueDiligenceTask[] = [];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const savedParcelId = searchParams.get("saved_parcel_id");

  if (!savedParcelId) {
    return NextResponse.json(
      { error: "Missing saved_parcel_id" },
      { status: 400 }
    );
  }

  const tasks = ddTaskStore.filter((t) => t.saved_parcel_id === savedParcelId);

  // If no tasks exist, auto-seed them
  if (tasks.length === 0) {
    const newTasks: DueDiligenceTask[] = DEFAULT_DD_TASKS.map((template) => ({
      id: crypto.randomUUID(),
      saved_parcel_id: savedParcelId,
      category: template.category as DueDiligenceTask["category"],
      task_name: template.task_name,
      status: "PENDING" as const,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    ddTaskStore.push(...newTasks);
    return NextResponse.json({ tasks: newTasks });
  }

  return NextResponse.json({ tasks });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, status, notes } = body;

  const task = ddTaskStore.find((t) => t.id === id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (status) task.status = status;
  if (notes !== undefined) task.notes = notes;
  task.updated_at = new Date().toISOString();

  return NextResponse.json(task);
}
