'use client';

import { useCallback, useRef, useEffect, type MutableRefObject } from 'react';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl/mapbox';
import type { ViewStateChangeEvent } from 'react-map-gl/mapbox';
import type { MapMouseEvent, FillLayerSpecification, LineLayerSpecification, Map as MapboxMap } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAppStore } from '@/store/useAppStore';
import { useSavedParcels } from '@/hooks/useSavedParcels';
import { useViewportParcels } from '@/hooks/useViewportParcels';
import { useViewportZoning } from '@/hooks/useViewportZoning';
import SavedPins from './SavedPins';
import CompMarkers from './CompMarkers';
import ZoningLayer from './ZoningLayer';
import QuickInfoCard from './QuickInfoCard';
import InfrastructureLayers from './InfrastructureLayers';
import ScoutResultPins from '@/components/scout/ScoutResultPins';
import SubMarketOverlay from '@/components/scout/SubMarketOverlay';
import {
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_STYLES,
  PARCEL_FILL_LAYER,
  PARCEL_LINE_LAYER,
  PARCEL_SOURCE,
  PARCEL_BORDER_COLOR,
  PARCEL_BORDER_SELECTED,
  PARCEL_FILL_SELECTED,
  PANEL_WIDTH,
} from '@/lib/constants';
import { useResponsive } from '@/hooks/useResponsive';
import { Marker } from 'react-map-gl/mapbox';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// Empty GeoJSON as placeholder before data loads
const EMPTY_GEOJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

export interface MapHandle {
  flyTo: (lng: number, lat: number, zoom?: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

interface ParcelMapProps {
  mapRef?: MutableRefObject<MapHandle | null>;
}

export default function ParcelMap({ mapRef }: ParcelMapProps) {
  const selectedAPN = useAppStore((s) => s.selectedAPN);
  const baseMapStyle = useAppStore((s) => s.baseMapStyle);
  const showParcels = useAppStore((s) => s.showParcels);
  const showParcelFill = useAppStore((s) => s.showParcelFill);
  const showZoning = useAppStore((s) => s.showZoning);
  const showSavedPins = useAppStore((s) => s.showSavedPins);
  const showRoadLabels = useAppStore((s) => s.showRoadLabels);
  const panelOpen = useAppStore((s) => s.panelOpen);
  const activeTab = useAppStore((s) => s.activeTab);
  const showQuickCard = useAppStore((s) => s.showQuickCard);
  const dismissQuickCard = useAppStore((s) => s.dismissQuickCard);
  const quickCardData = useAppStore((s) => s.quickCardData);
  const setViewport = useAppStore((s) => s.setViewport);
  const appMode = useAppStore((s) => s.appMode);
  const setScoutActiveSubMarket = useAppStore((s) => s.setScoutActiveSubMarket);
  const { isMobile } = useResponsive();
  const { savedParcels } = useSavedParcels();

  // Real data hooks
  const { geojson: parcelGeojson, isZoomedIn, requestFetch: requestParcelFetch } = useViewportParcels();
  const { geojson: zoningGeojson, shouldFetch: shouldFetchZoning, requestFetch: requestZoningFetch } = useViewportZoning();

  const internalMapRef = useRef<MapboxMap | null>(null);

  // Centroid for comp radius circle — from quick card or loaded GeoJSON
  const selectedCentroid = (() => {
    if (quickCardData) return quickCardData.lngLat;
    if (!selectedAPN || !parcelGeojson) return null;
    const feature = parcelGeojson.features.find(
      (f) => f.properties?.PIN === selectedAPN
    );
    if (!feature || feature.geometry.type !== 'Polygon') return null;
    const coords = feature.geometry.coordinates[0];
    const lng = coords.reduce((s: number, c: number[]) => s + c[0], 0) / coords.length;
    const lat = coords.reduce((s: number, c: number[]) => s + c[1], 0) / coords.length;
    return [lng, lat] as [number, number];
  })();

  // Expose map controls via parent ref
  useEffect(() => {
    if (mapRef) {
      mapRef.current = {
        flyTo: (lng: number, lat: number, zoom?: number) => {
          internalMapRef.current?.flyTo({
            center: [lng, lat],
            zoom: zoom ?? 16,
            duration: 1500,
          });
        },
        zoomIn: () => {
          internalMapRef.current?.zoomIn({ duration: 300 });
        },
        zoomOut: () => {
          internalMapRef.current?.zoomOut({ duration: 300 });
        },
      };
    }
  }, [mapRef]);

  // Fetch parcels/zoning whenever the map viewport changes
  const triggerViewportFetch = useCallback(() => {
    const map = internalMapRef.current;
    if (!map) return;
    const bounds = map.getBounds();
    if (!bounds) return;
    const bbox = {
      west: bounds.getWest(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      north: bounds.getNorth(),
    };
    requestParcelFetch(bbox);
    if (shouldFetchZoning) {
      requestZoningFetch(bbox);
    }
  }, [requestParcelFetch, requestZoningFetch, shouldFetchZoning]);

  const handleMove = useCallback(
    (e: ViewStateChangeEvent) => {
      const { latitude, longitude, zoom } = e.viewState;
      setViewport(latitude, longitude, zoom);
    },
    [setViewport]
  );

  const handleMoveEnd = useCallback(() => {
    triggerViewportFetch();
  }, [triggerViewportFetch]);

  const handleClick = useCallback(
    (e: MapMouseEvent) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const feature = (e as any).features?.[0];
      // County data uses PIN field; mock data used apn
      const pin = feature?.properties?.PIN || feature?.properties?.apn;

      if (!pin) {
        // Clicked empty area — dismiss quick card
        dismissQuickCard();
        return;
      }

      // Compute centroid from the feature geometry for card positioning
      let lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      if (feature?.geometry?.type === "Polygon" && feature.geometry.coordinates?.[0]) {
        const coords = feature.geometry.coordinates[0] as [number, number][];
        const lng = coords.reduce((s: number, c: [number, number]) => s + c[0], 0) / coords.length;
        const lat = coords.reduce((s: number, c: [number, number]) => s + c[1], 0) / coords.length;
        lngLat = [lng, lat];
      }

      // Show quick preview card with data already available in the GeoJSON
      showQuickCard({
        pin,
        address: feature?.properties?.ADDRESS || "Unknown Address",
        acres: feature?.properties?.CALCULATEDACREAGE || 0,
        lngLat,
      });
    },
    [showQuickCard, dismissQuickCard]
  );

  // Dynamic paint based on selection and fill toggle
  // Use near-invisible fill (not fully transparent) so Mapbox can detect click events
  const defaultFill = showParcelFill ? 'rgba(0, 212, 200, 0.06)' : 'rgba(0, 212, 200, 0.01)';
  const fillPaint: FillLayerSpecification['paint'] = {
    'fill-color': selectedAPN
      ? ['case', ['==', ['get', 'PIN'], selectedAPN], PARCEL_FILL_SELECTED, defaultFill]
      : defaultFill,
    'fill-opacity': 1,
  };

  const linePaint: LineLayerSpecification['paint'] = {
    'line-color': selectedAPN
      ? ['case', ['==', ['get', 'PIN'], selectedAPN], PARCEL_BORDER_SELECTED, PARCEL_BORDER_COLOR]
      : PARCEL_BORDER_COLOR,
    'line-width': selectedAPN
      ? ['case', ['==', ['get', 'PIN'], selectedAPN], 2, 1]
      : 1,
  };

  // Toggle road labels visibility on the base map style
  useEffect(() => {
    const map = internalMapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const style = map.getStyle();
    if (!style?.layers) return;
    for (const layer of style.layers) {
      if (
        layer.type === 'symbol' &&
        (layer.id.includes('label') || layer.id.includes('road-label'))
      ) {
        map.setLayoutProperty(
          layer.id,
          'visibility',
          showRoadLabels ? 'visible' : 'none'
        );
      }
    }
  }, [showRoadLabels, baseMapStyle]);

  // Re-fetch zoning when toggle changes
  useEffect(() => {
    if (shouldFetchZoning) {
      triggerViewportFetch();
    }
  }, [shouldFetchZoning, triggerViewportFetch]);

  // Map padding adjusts when panel is open on desktop
  const padding = {
    top: 0,
    bottom: 0,
    left: 0,
    right: !isMobile && panelOpen ? PANEL_WIDTH : 0,
  };

  // Use real data if available, empty GeoJSON otherwise
  const parcelData = (isZoomedIn && parcelGeojson) ? parcelGeojson : EMPTY_GEOJSON;

  return (
    <div className="absolute inset-0">
      <Map
        ref={(ref) => {
          if (ref) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            internalMapRef.current = (ref as any).getMap?.() ?? null;
          }
        }}
        onLoad={() => {
          // Apply road labels visibility after style loads
          if (!showRoadLabels) {
            const map = internalMapRef.current;
            if (!map) return;
            const style = map.getStyle();
            if (!style?.layers) return;
            for (const layer of style.layers) {
              if (layer.type === 'symbol' && (layer.id.includes('label') || layer.id.includes('road-label'))) {
                map.setLayoutProperty(layer.id, 'visibility', 'none');
              }
            }
          }
          // Initial parcel fetch
          triggerViewportFetch();
        }}
        initialViewState={{
          longitude: MAP_DEFAULT_CENTER[0],
          latitude: MAP_DEFAULT_CENTER[1],
          zoom: MAP_DEFAULT_ZOOM,
          padding,
        }}
        padding={padding}
        mapStyle={MAP_STYLES[baseMapStyle]}
        mapboxAccessToken={MAPBOX_TOKEN}
        interactiveLayerIds={showParcels && isZoomedIn ? [PARCEL_FILL_LAYER] : []}
        onMove={handleMove}
        onMoveEnd={handleMoveEnd}
        onClick={handleClick}
        cursor="pointer"
      >
        <NavigationControl position="top-right" showCompass={false} />

        {/* Zoning overlay (render below parcels) */}
        {showZoning && <ZoningLayer geojson={zoningGeojson} />}

        {/* Comp radius circle */}
        {activeTab === "comps" && selectedCentroid && (
          <Marker longitude={selectedCentroid[0]} latitude={selectedCentroid[1]}>
            <div className="h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-violet/30 bg-violet/5" />
          </Marker>
        )}

        {showParcels && (
          <Source id={PARCEL_SOURCE} type="geojson" data={parcelData}>
            <Layer
              id={PARCEL_FILL_LAYER}
              type="fill"
              source={PARCEL_SOURCE}
              paint={fillPaint}
            />
            <Layer
              id={PARCEL_LINE_LAYER}
              type="line"
              source={PARCEL_SOURCE}
              paint={linePaint}
            />
          </Source>
        )}

        {/* Zoom hint when parcels aren't visible */}
        {showParcels && !isZoomedIn && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-ink2/90 px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider text-mid backdrop-blur-sm">
            Zoom in to see parcels
          </div>
        )}

        {/* Quick info card (geo-anchored on desktop) */}
        <QuickInfoCard />

        {/* Saved parcel pins */}
        {showSavedPins && <SavedPins savedParcels={savedParcels} />}

        {/* Comp Markers */}
        <CompMarkers />

        {/* DC infrastructure layers — must be inside <Map> for react-map-gl context */}
        {appMode === "datacenter" && <InfrastructureLayers />}

        {/* Scout map layers — Tier 1 sub-market bboxes + Tier 2 parcel pins */}
        {appMode === "datacenter" && (
          <SubMarketOverlay
            onExplore={(market) => {
              setScoutActiveSubMarket(market);
              internalMapRef.current?.flyTo({
                center: [market.center[0], market.center[1]],
                zoom: 12,
                duration: 1200,
              });
            }}
          />
        )}
        {appMode === "datacenter" && <ScoutResultPins />}
      </Map>
    </div>
  );
}
