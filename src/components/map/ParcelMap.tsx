'use client';

import { useState } from 'react';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function ParcelMap() {
    const [viewState, setViewState] = useState({
        longitude: -84.388,
        latitude: 33.749,
        zoom: 12
    });

    return (
        <div className="w-full h-full min-h-[500px] relative">
            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                mapboxAccessToken={MAPBOX_TOKEN}
                interactiveLayerIds={['parcels-fill']}
            >
                <NavigationControl position="top-right" />
                {/* Placeholder for vector tile source */}
            </Map>
        </div>
    );
}
