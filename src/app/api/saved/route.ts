import { NextResponse } from "next/server";
import type { SavedParcel, DueDiligenceTask } from "@/lib/types";
import { getParcelByAPN } from "@/lib/mock-data";
import { DEFAULT_DD_TASKS } from "@/lib/constants";

// In-memory store (replace with Supabase)
const savedParcels: SavedParcel[] = [];
const ddTasks: DueDiligenceTask[] = [];

export async function GET() {
  // Hydrate parcel data
  const hydrated = savedParcels.map((sp) => ({
    ...sp,
    parcel: getParcelByAPN(sp.apn),
  }));
  return NextResponse.json(hydrated);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { apn, notes, collection_id } = body;

  // Check if already saved
  if (savedParcels.some((sp) => sp.apn === apn)) {
    return NextResponse.json({ error: "Already saved" }, { status: 409 });
  }

  const id = crypto.randomUUID();
  const newSaved: SavedParcel = {
    id,
    user_id: "demo-user",
    apn,
    notes: notes ?? null,
    collection_id: collection_id ?? null,
    created_at: new Date().toISOString(),
  };
  savedParcels.push(newSaved);

  // Auto-seed due diligence tasks (Phase 5)
  for (const template of DEFAULT_DD_TASKS) {
    ddTasks.push({
      id: crypto.randomUUID(),
      saved_parcel_id: id,
      category: template.category as DueDiligenceTask["category"],
      task_name: template.task_name,
      status: "PENDING",
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return NextResponse.json(newSaved, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const apn = searchParams.get("apn");

  const idx = savedParcels.findIndex(
    (sp) => sp.id === id || sp.apn === apn
  );
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const removedId = savedParcels[idx].id;
  savedParcels.splice(idx, 1);

  // Remove associated DD tasks
  const taskIdxs: number[] = [];
  ddTasks.forEach((t, i) => {
    if (t.saved_parcel_id === removedId) taskIdxs.push(i);
  });
  for (let i = taskIdxs.length - 1; i >= 0; i--) {
    ddTasks.splice(taskIdxs[i], 1);
  }

  return NextResponse.json({ success: true });
}

// Export for due-diligence route access
export { ddTasks };
