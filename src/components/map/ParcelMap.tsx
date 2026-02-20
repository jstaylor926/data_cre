'use client';

import { useCallback, useRef, useEffect, type MutableRefObject } from 'react';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl/mapbox';
import type { MapMouseEvent, FillLayerSpecification, LineLayerSpecification, Map as MapboxMap } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAppStore } from '@/store/useAppStore';
import { MOCK_PARCELS_GEOJSON } from '@/lib/mock-geojson';
import { useSavedParcels } from '@/hooks/useSavedParcels';
import SavedPins from './SavedPins';
import ZoningLayer from './ZoningLayer';
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

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export interface MapHandle {
  flyTo: (lng: number, lat: number) => void;
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
  const showZoning = useAppStore((s) => s.showZoning);
  const panelOpen = useAppStore((s) => s.panelOpen);
  const selectParcel = useAppStore((s) => s.selectParcel);
  const { isMobile } = useResponsive();
  const { savedParcels } = useSavedParcels();

  const internalMapRef = useRef<MapboxMap | null>(null);

  // Expose map controls via parent ref
  useEffect(() => {
    if (mapRef) {
      mapRef.current = {
        flyTo: (lng: number, lat: number) => {
          internalMapRef.current?.flyTo({
            center: [lng, lat],
            zoom: 16,
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

  const handleClick = useCallback(
    (e: MapMouseEvent) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const feature = (e as any).features?.[0];
      if (feature?.properties?.apn) {
        selectParcel(feature.properties.apn);
      }
    },
    [selectParcel]
  );

  // Dynamic paint based on selection
  const fillPaint: FillLayerSpecification['paint'] = {
    'fill-color': selectedAPN
      ? ['case', ['==', ['get', 'apn'], selectedAPN], PARCEL_FILL_SELECTED, 'transparent']
      : 'transparent',
    'fill-opacity': 1,
  };

  const linePaint: LineLayerSpecification['paint'] = {
    'line-color': selectedAPN
      ? ['case', ['==', ['get', 'apn'], selectedAPN], PARCEL_BORDER_SELECTED, PARCEL_BORDER_COLOR]
      : PARCEL_BORDER_COLOR,
    'line-width': selectedAPN
      ? ['case', ['==', ['get', 'apn'], selectedAPN], 2, 1]
      : 1,
  };

  // Map padding adjusts when panel is open on desktop
  const padding = {
    top: 0,
    bottom: 0,
    left: 0,
    right: !isMobile && panelOpen ? PANEL_WIDTH : 0,
  };

  return (
    <div className="absolute inset-0">
      <Map
        ref={(ref) => {
          if (ref) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            internalMapRef.current = (ref as any).getMap?.() ?? null;
          }
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
        interactiveLayerIds={showParcels ? [PARCEL_FILL_LAYER] : []}
        onClick={handleClick}
        cursor="pointer"
      >
        <NavigationControl position="top-right" showCompass={false} />

        {/* Zoning overlay (render below parcels) */}
        {showZoning && <ZoningLayer />}

        {showParcels && (
          <Source id={PARCEL_SOURCE} type="geojson" data={MOCK_PARCELS_GEOJSON}>
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

        {/* Saved parcel pins */}
        <SavedPins savedParcels={savedParcels} />
      </Map>
    </div>
  );
}
