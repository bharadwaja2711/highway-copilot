
import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './App.css'

function App() {
    const mapContainer = useRef<HTMLDivElement>(null)
    const [origin, setOrigin] = useState('')
    const [destination, setDestination] = useState('')
    const [message, setMessage] = useState('')

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
            attributionControl: true,
        })

        map.addControl(
            new maplibregl.NavigationControl({ showCompass: true }),
            'top-right',
        )

        return () => map.remove()
    }, [])

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!origin.trim() || !destination.trim()) {
            setMessage('Enter both locations to continue.')
            return
        }

        setMessage(
            'Locations captured. Next, we will connect the routing engine.',
        )
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
                            <div className="location-line">
                                <span className="location-dot origin-dot" />
                                <label htmlFor="origin">FROM</label>
                            </div>
                            <input
                                id="origin"
                                value={origin}
                                onChange={(event) => setOrigin(event.target.value)}
                                placeholder="Starting location"
                                autoComplete="off"
                            />

                            <div className="connector" />

                            <div className="location-line">
                                <span className="location-dot destination-dot" />
                                <label htmlFor="destination">TO</label>
                            </div>
                            <input
                                id="destination"
                                value={destination}
                                onChange={(event) => setDestination(event.target.value)}
                                placeholder="Where are you headed?"
                                autoComplete="off"
                            />
                        </div>

                        <button className="plan-button" type="submit">
                            Plan journey <span>↗</span>
                        </button>

                        {message && <p className="form-message" role="status">{message}</p>}
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
