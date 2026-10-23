import { MAX_TRIP_KM } from '../services/routing'

export default function ServiceNotice() {
    return (
        <aside className="service-notice" aria-label="Please read">
            <span className="service-notice-label">PLEASE READ</span>
            <ul>
                <li>
                    Highway Copilot supports trips of up to{' '}
                    <strong>{MAX_TRIP_KM.toLocaleString()} km</strong> in total, counted
                    in a straight line between your start, any via places, and your
                    destination.
                </li>
                <li>
                    Longer journeys can&apos;t be routed. Split them into shorter trips.
                </li>
            </ul>
        </aside>
    )
}
