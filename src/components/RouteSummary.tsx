type RouteSummaryProps = {
    distanceKm: number
    durationMinutes: number
}

export default function RouteSummary({ distanceKm, durationMinutes }: RouteSummaryProps) {
    const totalMinutes = Math.round(durationMinutes)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    return (
        <div className="route-summary">
            <div className="summary-card">
                <span className="summary-label">DISTANCE</span>
                <strong>{distanceKm.toFixed(1)} km</strong>
            </div>

            <div className="summary-card">
                <span className="summary-label">DRIVING TIME</span>
                <strong>
                    {hours}h {minutes}m
                </strong>
            </div>
        </div>
    )
}
