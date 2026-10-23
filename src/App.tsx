import './App.css'
import RouteMap from './components/RouteMap'
import RouteForm from './components/RouteForm'
import ServiceNotice from './components/ServiceNotice'
import { useRoutePlanner } from './hooks/useRoutePlanner'

function App() {
    const planner = useRoutePlanner()
    const { routeCoordinates } = planner

    return (
        <main className="workspace">
            <header className="topbar">
                <a className="brand" href="/" aria-label="Highway Copilot home">
                    <img className="brand-icon" src="/favicon.svg" alt="" />
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

                    <RouteForm planner={planner} />

                    <ServiceNotice />

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

                <RouteMap coordinates={routeCoordinates} />
            </div>
        </main>
    )
}

export default App

