"use client";

import { useAppStore } from "@/store/useAppStore";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import PanelContent from "./PanelContent";

export default function ParcelDrawer() {
  const panelOpen = useAppStore((s) => s.panelOpen);
  const parcel = useAppStore((s) => s.selectedParcel);
  const clearSelection = useAppStore((s) => s.clearSelection);

  return (
    <Drawer
      open={panelOpen}
      onOpenChange={(open) => {
        if (!open) clearSelection();
      }}
      modal={false}
    >
      <DrawerContent className="border-line bg-ink">
        <DrawerHeader className="sr-only">
          <DrawerTitle>
            {parcel?.site_address ?? "Parcel Details"}
          </DrawerTitle>
          <DrawerDescription>
            Detailed information for property {parcel?.apn}
          </DrawerDescription>
        </DrawerHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <PanelContent />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
