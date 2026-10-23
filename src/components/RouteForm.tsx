import type { useRoutePlanner } from '../hooks/useRoutePlanner'
import LocationInput from './LocationInput'
import RoutePreferences from './RoutePreferences'
import RouteSummary from './RouteSummary'

type RouteFormProps = {
    planner: ReturnType<typeof useRoutePlanner>
}

export default function RouteForm({ planner }: RouteFormProps) {
    const {
        originField,
        destinationField,
        swapLocations,
        status,
        message,
        handleSubmit,
        routeDistance,
        routeDuration,
        showRoutePreferences,
        setShowRoutePreferences,
    } = planner

    const isLoading = status === 'loading'

    return (
        <form className="route-form" onSubmit={handleSubmit}>
            <div className="location-fields">
                <button
                    type="button"
                    className="swap-button"
                    aria-label="Swap starting point and destination"
                    title="Swap locations"
                    onClick={swapLocations}
                >
                    ⇅
                </button>

                <LocationInput
                    id="origin"
                    label="FROM"
                    dotClass="origin-dot"
                    placeholder="Starting location"
                    field={originField}
                />

                <div className="connector" />

                <LocationInput
                    id="destination"
                    label="TO"
                    dotClass="destination-dot"
                    placeholder="Where are you headed?"
                    field={destinationField}
                />
            </div>

            <button
                className="plan-button"
                type="submit"
                disabled={isLoading}
                aria-busy={isLoading}
            >
                {isLoading ? 'Planning…' : 'Plan journey'} <span>↗</span>
            </button>

            {message && (status === 'loading' || status === 'error') && (
                <p
                    className="form-message"
                    role={status === 'error' ? 'alert' : 'status'}
                >
                    {message}
                </p>
            )}

            {routeDistance !== null && routeDuration !== null && (
                <>
                    <div className="route-summary-header">
                        <span className="route-summary-title">YOUR ROUTE</span>
                        <button
                            type="button"
                            className="route-preferences-button"
                            onClick={() => setShowRoutePreferences(!showRoutePreferences)}
                            aria-label="Route preferences"
                        >
                            ⚙ Preferences
                        </button>
                    </div>

                    {showRoutePreferences && <RoutePreferences planner={planner} />}

                    <RouteSummary distanceKm={routeDistance} durationMinutes={routeDuration} />
                </>
            )}
        </form>
    )
}
