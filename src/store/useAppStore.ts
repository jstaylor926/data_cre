import { create } from "zustand";
import type { Parcel, BaseMapStyle, PanelTab } from "@/lib/types";

interface AppState {
  // Map
  selectedAPN: string | null;
  selectedParcel: Parcel | null;
  parcelLoading: boolean;
  panelOpen: boolean;
  activeTab: PanelTab;

  // Layers
  baseMapStyle: BaseMapStyle;
  showParcels: boolean;
  showParcelFill: boolean;
  showZoning: boolean;
  showSavedPins: boolean;
  showRoadLabels: boolean;

  // Entity lookup
  entityLoading: boolean;

  // Actions
  selectParcel: (apn: string) => void;
  setSelectedParcel: (parcel: Parcel | null) => void;
  setParcelLoading: (loading: boolean) => void;
  clearSelection: () => void;
  setActiveTab: (tab: PanelTab) => void;
  setBaseMapStyle: (style: BaseMapStyle) => void;
  toggleParcels: () => void;
  toggleParcelFill: () => void;
  toggleZoning: () => void;
  toggleSavedPins: () => void;
  toggleRoadLabels: () => void;
  setEntityLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  selectedAPN: null,
  selectedParcel: null,
  parcelLoading: false,
  panelOpen: false,
  activeTab: "data",

  baseMapStyle: "streets",
  showParcels: true,
  showParcelFill: false,
  showZoning: false,
  showSavedPins: true,
  showRoadLabels: true,

  entityLoading: false,

  // Actions
  selectParcel: (apn) =>
    set({
      selectedAPN: apn,
      panelOpen: true,
      parcelLoading: true,
      activeTab: "data",
    }),

  setSelectedParcel: (parcel) =>
    set({ selectedParcel: parcel, parcelLoading: false }),

  setParcelLoading: (loading) => set({ parcelLoading: loading }),

  clearSelection: () =>
    set({
      selectedAPN: null,
      selectedParcel: null,
      panelOpen: false,
      parcelLoading: false,
    }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setBaseMapStyle: (style) => set({ baseMapStyle: style }),

  toggleParcels: () => set((s) => ({ showParcels: !s.showParcels })),

  toggleParcelFill: () => set((s) => ({ showParcelFill: !s.showParcelFill })),

  toggleZoning: () => set((s) => ({ showZoning: !s.showZoning })),

  toggleSavedPins: () => set((s) => ({ showSavedPins: !s.showSavedPins })),

  toggleRoadLabels: () => set((s) => ({ showRoadLabels: !s.showRoadLabels })),

  setEntityLoading: (loading) => set({ entityLoading: loading }),
}));
