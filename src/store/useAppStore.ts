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
  BriefStatus,
  AppMode,
  DCPanelTab,
  DCScore,
  DCInfrastructure,
  ComparisonSite,
  ScoutSession,
  SubMarketCandidate,
  RankedCandidate,
  User,
  Organization,
  Deal,
  DealActivity,
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

  // Phase 3: Data Center Mode
  appMode: AppMode;
  dcMwTarget: number;
  dcActiveTab: DCPanelTab;
  dcInfrastructure: DCInfrastructure | null;
  dcScore: DCScore | null;
  dcComparisonTray: ComparisonSite[];
  isDCBriefOverlayOpen: boolean;

  // DC Hotspot Markets
  hotspotCardsCollapsed: boolean;

  // Phase 3: Site Scout
  scoutSession: ScoutSession;
  scoutPanelOpen: boolean;

  // Phase 4: Enterprise Intelligence
  currentUser: User | null;
  currentOrg: Organization | null;
  deals: Deal[];
  activities: DealActivity[];
  sidebarCollapsed: boolean;

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

  // Phase 3 Actions
  setAppMode: (mode: AppMode) => void;
  setDcMwTarget: (mw: number) => void;
  setDCActiveTab: (tab: DCPanelTab) => void;
  setDCInfrastructure: (infra: DCInfrastructure | null) => void;
  setDCScore: (score: DCScore | null) => void;
  addToComparison: (site: ComparisonSite) => void;
  removeFromComparison: (apn: string) => void;
  clearComparison: () => void;
  setDCBriefOverlayOpen: (open: boolean) => void;

  // Hotspot Actions
  setHotspotCardsCollapsed: (collapsed: boolean) => void;

  // Scout Actions
  setScoutPanelOpen: (open: boolean) => void;
  setScoutQuery: (query: string) => void;
  setScoutLoading: (loading: boolean) => void;
  setScoutError: (error: string | null) => void;
  setScoutSubMarkets: (markets: SubMarketCandidate[]) => void;
  setScoutCandidates: (candidates: RankedCandidate[]) => void;
  setScoutActiveSubMarket: (market: SubMarketCandidate | null) => void;
  appendScoutSummary: (text: string) => void;
  resetScout: () => void;

  // Phase 2 Actions
  setSiteScore: (score: SiteScore | null) => void;
  setZoningSummary: (summary: ZoningSummary | null) => void;
  setComps: (comps: Comp[]) => void;
  setFirmHistory: (matches: FirmHistoryMatch[]) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setBriefStatus: (status: BriefStatus) => void;
  setBriefOverlayOpen: (open: boolean) => void;

  // Phase 4 Actions
  setCurrentUser: (user: User | null) => void;
  setCurrentOrg: (org: Organization | null) => void;
  setDeals: (deals: Deal[]) => void;
  updateDeal: (deal: Deal) => void;
  addActivity: (activity: DealActivity) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
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

      // Phase 3 Initial state
      appMode: "dev",
      dcMwTarget: 10,
      dcActiveTab: "dc-score",
      dcInfrastructure: null,
      dcScore: null,
      dcComparisonTray: [],
      isDCBriefOverlayOpen: false,

      // DC Hotspot Markets
      hotspotCardsCollapsed: false,

      // Scout initial state
      scoutPanelOpen: false,
      scoutSession: {
        mode: "idle",
        query: "",
        intent: null,
        subMarkets: [],
        candidates: [],
        activeSubMarket: null,
        summary: "",
        loading: false,
        error: null,
      },

      // Phase 4 Initial state
      currentUser: null,
      currentOrg: null,
      deals: [],
      activities: [],
      sidebarCollapsed: false,

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

      // Phase 3 Actions
      setAppMode: (appMode) => set({ appMode }),
      setDcMwTarget: (dcMwTarget) => set({ dcMwTarget }),
      setDCActiveTab: (dcActiveTab) => set({ dcActiveTab }),
      setDCInfrastructure: (dcInfrastructure) => set({ dcInfrastructure }),
      setDCScore: (dcScore) => set({ dcScore }),
      addToComparison: (site) =>
        set((s) => {
          if (s.dcComparisonTray.length >= 4) return s;
          if (s.dcComparisonTray.some((x) => x.apn === site.apn)) return s;
          return { dcComparisonTray: [...s.dcComparisonTray, site] };
        }),
      removeFromComparison: (apn) =>
        set((s) => ({ dcComparisonTray: s.dcComparisonTray.filter((x) => x.apn !== apn) })),
      clearComparison: () => set({ dcComparisonTray: [] }),
      setDCBriefOverlayOpen: (isDCBriefOverlayOpen) => set({ isDCBriefOverlayOpen }),

      // Hotspot Actions
      setHotspotCardsCollapsed: (hotspotCardsCollapsed) => set({ hotspotCardsCollapsed }),

      // Scout Actions
      setScoutPanelOpen: (scoutPanelOpen) => set({ scoutPanelOpen }),
      setScoutQuery: (query) =>
        set((s) => ({ scoutSession: { ...s.scoutSession, query } })),
      setScoutLoading: (loading) =>
        set((s) => ({ scoutSession: { ...s.scoutSession, loading } })),
      setScoutError: (error) =>
        set((s) => ({ scoutSession: { ...s.scoutSession, error, loading: false } })),
      setScoutSubMarkets: (subMarkets) =>
        set((s) => ({
          scoutSession: { ...s.scoutSession, subMarkets, mode: "results", loading: false },
        })),
      setScoutCandidates: (candidates) =>
        set((s) => ({
          scoutSession: { ...s.scoutSession, candidates, mode: "results", loading: false },
        })),
      setScoutActiveSubMarket: (activeSubMarket) =>
        set((s) => ({
          scoutSession: { ...s.scoutSession, activeSubMarket, candidates: [], summary: "" },
        })),
      appendScoutSummary: (text) =>
        set((s) => ({
          scoutSession: { ...s.scoutSession, summary: s.scoutSession.summary + text },
        })),
      resetScout: () =>
        set({
          scoutSession: {
            mode: "idle",
            query: "",
            intent: null,
            subMarkets: [],
            candidates: [],
            activeSubMarket: null,
            summary: "",
            loading: false,
            error: null,
          },
        }),

      // Phase 2 Actions
      setSiteScore: (score) => set({ siteScore: score }),
      setZoningSummary: (summary) => set({ zoningSummary: summary }),
      setComps: (comps) => set({ comps }),
      setFirmHistory: (firmHistory) => set({ firmHistory }),
      addChatMessage: (msg) => set((s) => ({ chatHistory: [...s.chatHistory, msg] })),
      setBriefStatus: (briefStatus) => set({ briefStatus }),
      setBriefOverlayOpen: (isBriefOverlayOpen) => set({ isBriefOverlayOpen }),

      // Phase 4 Actions
      setCurrentUser: (currentUser) => set({ currentUser }),
      setCurrentOrg: (currentOrg) => set({ currentOrg }),
      setDeals: (deals) => set({ deals }),
      updateDeal: (updatedDeal) =>
        set((s) => ({
          deals: s.deals.map((d) => (d.id === updatedDeal.id ? updatedDeal : d)),
        })),
      addActivity: (activity) => set((s) => ({ activities: [activity, ...s.activities] })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
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
        appMode: state.appMode,
        dcMwTarget: state.dcMwTarget,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
