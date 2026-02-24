"use client";

import { create } from "zustand";
import type {
  Parcel,
  PanelTab,
  BaseMapStyle,
  DCPersona,
  ScoutQuery,
  ScoutResult,
} from "@/lib/types";

interface AppState {
  // Selection
  selectedAPN: string | null;
  selectedParcel: Parcel | null;
  parcelLoading: boolean;

  // Panel
  panelOpen: boolean;
  activeTab: PanelTab;

  // Map
  baseMapStyle: BaseMapStyle;
  showParcels: boolean;
  showZoning: boolean;
  showSubstations: boolean;
  showTxLines: boolean;
  showFiber: boolean;
  showFloodZones: boolean;

  // Entity
  entityLoading: boolean;

  // Phase 1: DC Persona
  activePersona: DCPersona;

  // Phase 4: Scouting
  scoutMode: boolean;
  scoutQuery: ScoutQuery | null;
  scoutResults: ScoutResult[];
  scoutLoading: boolean;

  // Phase 4: Assemblage (shift+click)
  assemblageModeActive: boolean;
  selectedAPNs: string[]; // multiple parcel selection

  // Actions
  selectParcel: (apn: string) => void;
  setSelectedParcel: (parcel: Parcel | null) => void;
  setParcelLoading: (loading: boolean) => void;
  clearSelection: () => void;
  setActiveTab: (tab: PanelTab) => void;
  setBaseMapStyle: (style: BaseMapStyle) => void;
  toggleParcels: () => void;
  toggleZoning: () => void;
  toggleSubstations: () => void;
  toggleTxLines: () => void;
  toggleFiber: () => void;
  toggleFloodZones: () => void;
  setEntityLoading: (loading: boolean) => void;
  setActivePersona: (persona: DCPersona) => void;
  setScoutMode: (active: boolean) => void;
  setScoutQuery: (query: ScoutQuery | null) => void;
  setScoutResults: (results: ScoutResult[]) => void;
  setScoutLoading: (loading: boolean) => void;
  toggleAssemblageMode: () => void;
  toggleAPNSelection: (apn: string) => void;
  clearAssemblage: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Defaults
  selectedAPN: null,
  selectedParcel: null,
  parcelLoading: false,
  panelOpen: false,
  activeTab: "data",
  baseMapStyle: "streets",
  showParcels: true,
  showZoning: false,
  showSubstations: false,
  showTxLines: false,
  showFiber: false,
  showFloodZones: false,
  entityLoading: false,
  activePersona: "HYPERSCALE",
  scoutMode: false,
  scoutQuery: null,
  scoutResults: [],
  scoutLoading: false,
  assemblageModeActive: false,
  selectedAPNs: [],

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
  toggleZoning: () => set((s) => ({ showZoning: !s.showZoning })),
  toggleSubstations: () => set((s) => ({ showSubstations: !s.showSubstations })),
  toggleTxLines: () => set((s) => ({ showTxLines: !s.showTxLines })),
  toggleFiber: () => set((s) => ({ showFiber: !s.showFiber })),
  toggleFloodZones: () => set((s) => ({ showFloodZones: !s.showFloodZones })),
  setEntityLoading: (loading) => set({ entityLoading: loading }),
  setActivePersona: (persona) => set({ activePersona: persona }),
  setScoutMode: (active) => set({ scoutMode: active }),
  setScoutQuery: (query) => set({ scoutQuery: query }),
  setScoutResults: (results) => set({ scoutResults: results }),
  setScoutLoading: (loading) => set({ scoutLoading: loading }),

  toggleAssemblageMode: () =>
    set((s) => ({
      assemblageModeActive: !s.assemblageModeActive,
      selectedAPNs: s.assemblageModeActive ? [] : s.selectedAPNs,
    })),

  toggleAPNSelection: (apn) =>
    set((s) => ({
      selectedAPNs: s.selectedAPNs.includes(apn)
        ? s.selectedAPNs.filter((a) => a !== apn)
        : [...s.selectedAPNs, apn],
    })),

  clearAssemblage: () =>
    set({ assemblageModeActive: false, selectedAPNs: [] }),
}));
