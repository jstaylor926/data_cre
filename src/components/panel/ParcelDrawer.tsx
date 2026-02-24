"use client";

import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useAppStore } from "@/store/useAppStore";
import PanelContent from "./PanelContent";

export default function ParcelDrawer() {
  const panelOpen = useAppStore((s) => s.panelOpen);
  const clearSelection = useAppStore((s) => s.clearSelection);

  return (
    <Drawer open={panelOpen} onOpenChange={(open) => !open && clearSelection()}>
      <DrawerContent className="bg-zinc-950 border-zinc-800 max-h-[85vh]">
        <div className="overflow-y-auto px-4 pb-6">
          <PanelContent />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
