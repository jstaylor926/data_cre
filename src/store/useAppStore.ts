import { create } from "zustand";
import { persist } from "zustand/middleware";
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

export interface QuickCardData {
  pin: string;
  address: string;
  acres: number;
  lngLat: [number, number];
}

interface AppState {
  // Map
  selectedAPN: string | null;
  selectedParcel: Parcel | null;
  parcelLoading: boolean;
  panelOpen: boolean;
  activeTab: PanelTab;

  // Quick-info card (tap preview before full panel)
  quickCardData: QuickCardData | null;

  // Viewport
  viewportLat: number;
  viewportLng: number;
  viewportZoom: number;

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
  entityLookupOpen: boolean;

  // Actions
  showQuickCard: (data: QuickCardData) => void;
  dismissQuickCard: () => void;
  openFullPanel: () => void;
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
  setEntityLookupOpen: (open: boolean) => void;
  setViewport: (lat: number, lng: number, zoom: number) => void;

  // Phase 2 Actions
  setSiteScore: (score: SiteScore | null) => void;
  setZoningSummary: (summary: ZoningSummary | null) => void;
  setComps: (comps: Comp[]) => void;
  setFirmHistory: (matches: FirmHistoryMatch[]) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setBriefStatus: (status: BriefStatus) => void;
  setBriefOverlayOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      selectedAPN: null,
      selectedParcel: null,
      parcelLoading: false,
      panelOpen: false,
      activeTab: "data",
      quickCardData: null,

      viewportLat: 33.9450,
      viewportLng: -84.1950,
      viewportZoom: 14,

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
      entityLookupOpen: false,

      // Actions

      // Quick card: show preview without opening panel or fetching API
      showQuickCard: (data) =>
        set({
          quickCardData: data,
          selectedAPN: data.pin,
          // Don't open panel or trigger loading — just preview
          panelOpen: false,
          parcelLoading: false,
        }),

      dismissQuickCard: () =>
        set({
          quickCardData: null,
          selectedAPN: null,
          selectedParcel: null,
        }),

      // Open full panel from quick card — triggers API fetch via useParcelClick
      openFullPanel: () =>
        set({
          quickCardData: null,
          panelOpen: true,
          parcelLoading: true,
          activeTab: "data",
        }),

      // Direct select (used by saved pins, search, etc. — skips quick card)
      selectParcel: (apn) =>
        set({
          selectedAPN: apn,
          quickCardData: null,
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
          quickCardData: null,
          panelOpen: false,
          parcelLoading: false,
          entityLookupOpen: false,
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
      setEntityLookupOpen: (open) => set({ entityLookupOpen: open }),
      setViewport: (lat, lng, zoom) => set({ viewportLat: lat, viewportLng: lng, viewportZoom: zoom }),

      // Phase 2 Actions
      setSiteScore: (score) => set({ siteScore: score }),
      setZoningSummary: (summary) => set({ zoningSummary: summary }),
      setComps: (comps) => set({ comps }),
      setFirmHistory: (firmHistory) => set({ firmHistory }),
      addChatMessage: (msg) => set((s) => ({ chatHistory: [...s.chatHistory, msg] })),
      setBriefStatus: (briefStatus) => set({ briefStatus }),
      setBriefOverlayOpen: (isBriefOverlayOpen) => set({ isBriefOverlayOpen }),
    }),
    {
      name: "pd-map-prefs",
      // Only persist layer toggles and base map style — not transient UI state
      partialize: (state) => ({
        baseMapStyle: state.baseMapStyle,
        showParcels: state.showParcels,
        showParcelFill: state.showParcelFill,
        showZoning: state.showZoning,
        showSavedPins: state.showSavedPins,
        showRoadLabels: state.showRoadLabels,
      }),
    }
  )
);
