import { create } from "zustand";
import type { 
  Parcel, 
  BaseMapStyle, 
  PanelTab, 
  SiteScore, 
  ZoningSummary, 
  Comp, 
  FirmHistoryMatch, 
  ChatMessage, 
  BriefStatus 
} from "@/lib/types";

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

  // Phase 2: Site Intelligence
  siteScore: SiteScore | null;
  zoningSummary: ZoningSummary | null;
  comps: Comp[];
  firmHistory: FirmHistoryMatch[];
  chatHistory: ChatMessage[];
  briefStatus: BriefStatus;
  isBriefOverlayOpen: boolean;

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

  // Phase 2 Actions
  setSiteScore: (score: SiteScore | null) => void;
  setZoningSummary: (summary: ZoningSummary | null) => void;
  setComps: (comps: Comp[]) => void;
  setFirmHistory: (matches: FirmHistoryMatch[]) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setBriefStatus: (status: BriefStatus) => void;
  setBriefOverlayOpen: (open: boolean) => void;
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

  // Phase 2 Initial state
  siteScore: null,
  zoningSummary: null,
  comps: [],
  firmHistory: [],
  chatHistory: [],
  briefStatus: "idle",
  isBriefOverlayOpen: false,

  entityLoading: false,

  // Actions
  selectParcel: (apn) =>
    set({
      selectedAPN: apn,
      panelOpen: true,
      parcelLoading: true,
      activeTab: "score", // Phase 2: default to score tab
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
      siteScore: null,
      zoningSummary: null,
      comps: [],
      firmHistory: [],
      chatHistory: [],
    }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setBaseMapStyle: (style) => set({ baseMapStyle: style }),

  toggleParcels: () => set((s) => ({ showParcels: !s.showParcels })),

  toggleParcelFill: () => set((s) => ({ showParcelFill: !s.showParcelFill })),

  toggleZoning: () => set((s) => ({ showZoning: !s.showZoning })),

  toggleSavedPins: () => set((s) => ({ showSavedPins: !s.showSavedPins })),

  toggleRoadLabels: () => set((s) => ({ showRoadLabels: !s.showRoadLabels })),

  setEntityLoading: (loading) => set({ entityLoading: loading }),

  // Phase 2 Actions
  setSiteScore: (score) => set({ siteScore: score }),
  setZoningSummary: (summary) => set({ zoningSummary: summary }),
  setComps: (comps) => set({ comps }),
  setFirmHistory: (firmHistory) => set({ firmHistory }),
  addChatMessage: (msg) => set((s) => ({ chatHistory: [...s.chatHistory, msg] })),
  setBriefStatus: (briefStatus) => set({ briefStatus }),
  setBriefOverlayOpen: (isBriefOverlayOpen) => set({ isBriefOverlayOpen }),
}));
