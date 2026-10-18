import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './App.css'
import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

setWorkerUrl(workerUrl)

type GeocodingResult = {
    lat: string
    lon: string
    display_name: string
}

async function geocodeLocation(place: string): Promise<GeocodingResult[]> {
    const params = new URLSearchParams({
        q: place,
        format: 'jsonv2',
        limit: '5',
    })

    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
    )

    if (!response.ok) {
        throw new Error('Location search failed. Please try again.')
    }

    return response.json()
}

async function suggestLocations(place: string): Promise<GeocodingResult[]> {
    const params = new URLSearchParams({
        q: place,
        limit: '5',
    })

    const response = await fetch(
        `https://photon.komoot.io/api/?${params}`,
    )

    if (!response.ok) {
        throw new Error('Location suggestions failed.')
    }

    const data = await response.json()

    return data.features.map((feature: {
        properties: { name?: string; city?: string; state?: string; country?: string }
        geometry: { coordinates: [number, number] }
    }) => ({
        lat: String(feature.geometry.coordinates[1]),
        lon: String(feature.geometry.coordinates[0]),
        display_name: [
            feature.properties.name,
            feature.properties.city,
            feature.properties.state,
            feature.properties.country,
        ].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join(', '),
    }))
}

type RouteResult = {
    distance: number
    duration: number
    geometry: {
        coordinates: [number, number][]
    }
}

async function getDrivingRoute(
    start: GeocodingResult,
    end: GeocodingResult,
): Promise<RouteResult> {
    const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${start.lon},${start.lat};${end.lon},${end.lat}` +
        `?overview=full&geometries=geojson`

    const response = await fetch(url)

    if (!response.ok) {
        throw new Error('Could not calculate the road route.')
    }

    const data = await response.json()

    if (data.code !== 'Ok' || !data.routes?.length) {
        throw new Error('No driving route found for these locations.')
    }

    return data.routes[0]
}

function App() {
    const mapContainer = useRef<HTMLDivElement>(null)
    const mapRef = useRef<maplibregl.Map | null>(null)
    const [origin, setOrigin] = useState('')
    const [destination, setDestination] = useState('')
    const [message, setMessage] = useState('')
    const [originSuggestions, setOriginSuggestions] = useState<GeocodingResult[]>([])
    const [destinationSuggestions, setDestinationSuggestions] = useState<GeocodingResult[]>([])
    const [routeDistance, setRouteDistance] = useState<number | null>(null)
    const [routeDuration, setRouteDuration] = useState<number | null>(null)

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

        return () => map.remove()
    }, [])


    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!origin.trim() || !destination.trim()) {
            setMessage('Enter both locations to continue.')
            return
        }

        setMessage('Searching for your starting location...')

        try {

            const originResults = await geocodeLocation(origin.trim())

            if (originResults.length === 0) {
                setMessage('Starting location not found. Try a more specific place.')
                return
            }

            setMessage('Starting location found. Searching for destination...')

            const destinationResults = await geocodeLocation(destination.trim())

            if (destinationResults.length === 0) {
                setMessage('Destination not found. Try a more specific place.')
                return
            }

            const start = originResults[0]
            const end = destinationResults[0]

            setMessage('Locations found. Calculating driving route...')

            const route = await getDrivingRoute(start, end)
            setRouteDistance(route.distance / 1000)
            setRouteDuration(route.duration / 60)

            const map = mapRef.current

            if (map) {
                const drawRoute = () => {
                    const routeData = {
                        type: 'Feature' as const,
                        properties: {},
                        geometry: {
                            type: 'LineString' as const,
                            coordinates: route.geometry.coordinates,
                        },
                    }

                    if (map.getSource('driving-route')) {
                        ;(map.getSource('driving-route') as maplibregl.GeoJSONSource)
                            .setData(routeData)
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

                    route.geometry.coordinates.forEach((coordinate) => {
                        bounds.extend(coordinate)
                    })

                    map.fitBounds(bounds, { padding: 60 })
                }

                if (map.loaded()) {
                    drawRoute()
                } else {
                    map.once('load', drawRoute)
                }
            }

            setMessage(
                `Route found! Distance: ${(route.distance / 1000).toFixed(1)} km · Estimated driving time: ${Math.round(route.duration / 60)} min`,
            )

        } catch {
            setMessage('Location search failed. Check your internet connection and try again.')
        }
    }


    return (
        <main className="workspace">
            <header className="topbar">

                <a className="brand" href="/" aria-label="Highway Copilot home">
                    <img
                        className="brand-icon"
                        src="/favicon.svg"
                        alt=""
                    />
                    <span className="brand-name">
    Highway<span>Copilot</span>
  </span>
                </a>


                <div className="topbar-right">
                    <span className="open-indicator" />
                    <span>OPEN ROUTE PLANNER</span>
                </div>
            </header>

            <div className="workarea">
                <aside className="sidebar">
                    <div className="section-label">JOURNEY PLANNER <span>01</span></div>

                    <h1>Where to?</h1>
                    <p className="intro-copy">
                        Plan the route. Prepare the stops. Know before you go.
                    </p>

                    <form className="route-form" onSubmit={handleSubmit}>
                        <div className="location-fields">
                            <button
                                type="button"
                                className="swap-button"
                                aria-label="Swap starting point and destination"
                                title="Swap locations"
                                onClick={() => {
                                    setOrigin(destination)
                                    setDestination(origin)
                                    setOriginSuggestions([])
                                    setDestinationSuggestions([])
                                }}
                            >
                                ⇅
                            </button>
                            <div className="location-line">
                                <span className="location-dot origin-dot" />
                                <label htmlFor="origin">FROM</label>
                            </div>
                            <input
                                id="origin"
                                value={origin}
                                onChange={async (event) => {
                                    const value = event.target.value
                                    setOrigin(value)
                                    setOriginSuggestions([])

                                    if (value.trim().length < 3) return

                                    try {
                                        const results = await suggestLocations(value.trim())
                                        setOriginSuggestions(results)
                                    } catch {
                                        setOriginSuggestions([])
                                    }
                                }}
                                placeholder="Starting location"
                                autoComplete="off"
                            />

                            {originSuggestions.length > 0 && (
                                <div className="suggestions-list">
                                    {originSuggestions.map((place, index) => (
                                        <button
                                            key={`${place.lat}-${place.lon}-${index}`}
                                            type="button"
                                            className="suggestion-item"
                                            onClick={() => {
                                                setOrigin(place.display_name)
                                                setOriginSuggestions([])
                                            }}
                                        >
                                            {place.display_name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="connector" />

                            <button
                                type="button"
                                className="swap-button"
                                aria-label="Swap starting point and destination"
                                title="Swap locations"
                                onClick={() => {
                                    setOrigin(destination)
                                    setDestination(origin)
                                    setOriginSuggestions([])
                                    setDestinationSuggestions([])
                                }}
                            >
                                ⇅
                            </button>

                            <div className="location-line">
                                <span className="location-dot destination-dot" />
                                <label htmlFor="destination">TO</label>
                            </div>

                            <input
                                id="destination"
                                value={destination}
                                onChange={async (event) => {
                                    const value = event.target.value
                                    setDestination(value)
                                    setDestinationSuggestions([])

                                    if (value.trim().length < 3) return

                                    try {
                                        const results = await suggestLocations(value.trim())
                                        setDestinationSuggestions(results)
                                    } catch {
                                        setDestinationSuggestions([])
                                    }
                                }}
                                placeholder="Where are you headed?"
                                autoComplete="off"
                            />

                            {destinationSuggestions.length > 0 && (
                                <div className="suggestions-list">
                                    {destinationSuggestions.map((place, index) => (
                                        <button
                                            key={`${place.lat}-${place.lon}-${index}`}
                                            type="button"
                                            className="suggestion-item"
                                            onClick={() => {
                                                setDestination(place.display_name)
                                                setDestinationSuggestions([])
                                            }}
                                        >
                                            {place.display_name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className="plan-button" type="submit">
                            Plan journey <span>↗</span>
                        </button>

                        {message && !message.startsWith('Route found!') && (
                            <p className="form-message" role="status">{message}</p>
                        )}

                        {routeDistance !== null && routeDuration !== null && (
                            <div className="route-summary">
                                <div className="summary-card">
                                    <span className="summary-label">DISTANCE</span>
                                    <strong>{routeDistance.toFixed(1)} km</strong>
                                </div>

                                <div className="summary-card">
                                    <span className="summary-label">DRIVING TIME</span>
                                    <strong>
                                        {Math.floor(routeDuration / 60)}h {Math.round(routeDuration % 60)}m
                                    </strong>
                                </div>
                            </div>
                        )}
                    </form>

                    <div className="sidebar-divider" />

                    <div className="section-label">YOUR JOURNEY <span>02</span></div>
                    <div className="empty-state">
                        <span className="empty-icon">⌁</span>
                        <p>Your itinerary starts here.</p>
                        <span>Route distance, fuel stops, breaks and costs will appear once routing is connected.</span>
                    </div>

                    <div className="sidebar-bottom">
                        <span className="status-dot" />
                        OPEN DATA · COMMUNITY BUILT
                    </div>
                </aside>

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
            </div>
        </main>
    )
}

export default App
