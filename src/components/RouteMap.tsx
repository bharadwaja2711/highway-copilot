import { useEffect, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'

setWorkerUrl(workerUrl)

type RouteMapProps = {
    coordinates: [number, number][] | null
}

export default function RouteMap({ coordinates }: RouteMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null)
    const mapRef = useRef<maplibregl.Map | null>(null)

    useEffect(() => {
        if (!mapContainer.current) return

        const map = new maplibregl.Map({
            container: mapContainer.current,
            center: [78.4867, 17.385],
            zoom: 5.2,
            style: {
                version: 8,
                sources: {
                    osm: {
                        type: 'raster',
                        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                        tileSize: 256,
                        attribution: '&copy; OpenStreetMap contributors',
                    },
                },
                layers: [
                    {
                        id: 'osm',
                        type: 'raster',
                        source: 'osm',
                    },
                ],
            },
            attributionControl: {},
        })

        mapRef.current = map
        map.addControl(
            new maplibregl.NavigationControl({ showCompass: true }),
            'top-right',
        )

        return () => {
            map.remove()
            mapRef.current = null
        }
    }, [])

    useEffect(() => {
        const map = mapRef.current
        if (!map || !coordinates || coordinates.length === 0) return

        const drawRoute = () => {
            if (mapRef.current !== map) return

            const routeData = {
                type: 'Feature' as const,
                properties: {},
                geometry: {
                    type: 'LineString' as const,
                    coordinates,
                },
            }

            const source = map.getSource('driving-route') as
                | maplibregl.GeoJSONSource
                | undefined

            if (source) {
                source.setData(routeData)
            } else {
                map.addSource('driving-route', {
                    type: 'geojson',
                    data: routeData,
                })

                map.addLayer({
                    id: 'driving-route-line',
                    type: 'line',
                    source: 'driving-route',
                    paint: {
                        'line-color': '#2563eb',
                        'line-width': 5,
                        'line-opacity': 0.9,
                    },
                })
            }

            const bounds = new maplibregl.LngLatBounds()
            coordinates.forEach((coordinate) => bounds.extend(coordinate))
            map.fitBounds(bounds, { padding: 60 })
        }

        if (map.loaded()) {
            drawRoute()
        } else {
            map.once('load', drawRoute)
        }

        return () => {
            map.off('load', drawRoute)
        }
    }, [coordinates])

    return (
        <section className="map-panel" aria-label="Interactive map">
            <div ref={mapContainer} className="map-canvas" />

            <div className="map-overlay map-heading">
                <span className="map-heading-kicker">EXPLORE THE ROAD</span>
                <span className="map-heading-title">Your journey, at a glance.</span>
            </div>

            <div className="map-overlay map-scale">
                <span className="scale-line" />
                MAP DATA © OPENSTREETMAP
            </div>
        </section>
    )
}
