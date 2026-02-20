"use client";

import { Marker } from "react-map-gl/mapbox";

interface GPSMarkerProps {
  lat: number;
  lng: number;
}

export default function GPSMarker({ lat, lng }: GPSMarkerProps) {
  return (
    <Marker latitude={lat} longitude={lng}>
      <div className="relative flex items-center justify-center">
        {/* Glow ring */}
        <div className="absolute h-6 w-6 animate-pulse rounded-full bg-teal-glow" />
        {/* Dot */}
        <div className="relative h-3 w-3 rounded-full border-2 border-ink bg-teal shadow-lg shadow-teal/30" />
      </div>
    </Marker>
  );
}
