"use client";

import { useRef, useCallback, useEffect } from "react";
import Map, { Source, Layer, type MapRef, type MapMouseEvent } from "react-map-gl/mapbox";
import { useAppStore } from "@/store/useAppStore";
import {
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_STYLES,
  PARCEL_SOURCE,
  PARCEL_FILL_LAYER,
  PARCEL_LINE_LAYER,
  ZONING_SOURCE,
  ZONING_FILL_LAYER,
  ZONING_LINE_LAYER,
  PARCEL_BORDER_COLOR,
  PARCEL_BORDER_SELECTED,
  PARCEL_FILL_SELECTED,
  PANEL_WIDTH,
  ZONING_COLORS,
} from "@/lib/constants";
import { PARCEL_GEOJSON, ZONING_GEOJSON, SUBSTATION_GEOJSON } from "@/lib/mock-geojson";
import { useResponsive } from "@/hooks/useResponsive";
import "mapbox-gl/dist/mapbox-gl.css";

export default function ParcelMap() {
  const mapRef = useRef<MapRef>(null);
  const { isMobile } = useResponsive();

  const baseMapStyle = useAppStore((s) => s.baseMapStyle);
  const showParcels = useAppStore((s) => s.showParcels);
  const showZoning = useAppStore((s) => s.showZoning);
  const showSubstations = useAppStore((s) => s.showSubstations);
  const selectedAPN = useAppStore((s) => s.selectedAPN);
  const panelOpen = useAppStore((s) => s.panelOpen);
  const selectParcel = useAppStore((s) => s.selectParcel);
  const assemblageModeActive = useAppStore((s) => s.assemblageModeActive);
  const toggleAPNSelection = useAppStore((s) => s.toggleAPNSelection);
  const selectedAPNs = useAppStore((s) => s.selectedAPNs);

  const handleClick = useCallback(
    (e: MapMouseEvent) => {
      const features = e.features;
      if (!features?.length) return;
      const apn = features[0].properties?.apn;
      if (!apn) return;

      if (assemblageModeActive) {
        toggleAPNSelection(apn);
      } else {
        selectParcel(apn);
      }
    },
    [selectParcel, assemblageModeActive, toggleAPNSelection]
  );

  // Adjust padding when panel opens/closes (desktop only)
  useEffect(() => {
    if (isMobile || !mapRef.current) return;
    mapRef.current.easeTo({
      padding: { right: panelOpen ? PANEL_WIDTH : 0, top: 0, bottom: 0, left: 0 },
      duration: 300,
    });
  }, [panelOpen, isMobile]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const parcelFillColor: any = [
    "case",
    ["==", ["get", "apn"], selectedAPN ?? ""],
    PARCEL_FILL_SELECTED,
    ["in", ["get", "apn"], ["literal", selectedAPNs]],
    "rgba(245, 166, 35, 0.20)",
    "rgba(0, 0, 0, 0)",
  ];

  const parcelLineColor: any = [
    "case",
    ["==", ["get", "apn"], selectedAPN ?? ""],
    PARCEL_BORDER_SELECTED,
    ["in", ["get", "apn"], ["literal", selectedAPNs]],
    "#f5a623",
    PARCEL_BORDER_COLOR,
  ];

  const zoningFillColor: any = [
    "match",
    ["get", "zone"],
    ...Object.entries(ZONING_COLORS).flatMap(([zone, color]) => [zone, color]),
    "rgba(100,100,100,0.2)",
  ];
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{
        longitude: MAP_DEFAULT_CENTER[0],
        latitude: MAP_DEFAULT_CENTER[1],
        zoom: MAP_DEFAULT_ZOOM,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={MAP_STYLES[baseMapStyle]}
      interactiveLayerIds={showParcels ? [PARCEL_FILL_LAYER] : []}
      onClick={handleClick}
      cursor="pointer"
    >
      {/* Parcels */}
      {showParcels && (
        <Source id={PARCEL_SOURCE} type="geojson" data={PARCEL_GEOJSON}>
          <Layer
            id={PARCEL_FILL_LAYER}
            type="fill"
            paint={{ "fill-color": parcelFillColor as any, "fill-opacity": 0.6 }}
          />
          <Layer
            id={PARCEL_LINE_LAYER}
            type="line"
            paint={{
              "line-color": parcelLineColor as any,
              "line-width": ["case", ["==", ["get", "apn"], selectedAPN ?? ""], 2.5, 1],
            }}
          />
        </Source>
      )}

      {/* Zoning */}
      {showZoning && (
        <Source id={ZONING_SOURCE} type="geojson" data={ZONING_GEOJSON}>
          <Layer
            id={ZONING_FILL_LAYER}
            type="fill"
            paint={{ "fill-color": zoningFillColor as any, "fill-opacity": 0.15 }}
          />
          <Layer
            id={ZONING_LINE_LAYER}
            type="line"
            paint={{ "line-color": zoningFillColor as any, "line-width": 1, "line-opacity": 0.5 }}
          />
        </Source>
      )}

      {/* Substations */}
      {showSubstations && (
        <Source id="substations-source" type="geojson" data={SUBSTATION_GEOJSON}>
          <Layer
            id="substations-circles"
            type="circle"
            paint={{
              "circle-radius": 8,
              "circle-color": "#f59e0b",
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 2,
            }}
          />
          <Layer
            id="substations-labels"
            type="symbol"
            layout={{
              "text-field": ["get", "name"],
              "text-size": 11,
              "text-offset": [0, 1.5],
              "text-anchor": "top",
            }}
            paint={{
              "text-color": "#f59e0b",
              "text-halo-color": "#000000",
              "text-halo-width": 1,
            }}
          />
        </Source>
      )}
    </Map>
  );
}
