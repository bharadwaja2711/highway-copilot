import type { useRoutePlanner } from '../hooks/useRoutePlanner'
import ViaPlacesEditor from './ViaPlacesEditor'

type RoutePreferencesProps = {
    planner: ReturnType<typeof useRoutePlanner>
}

const OPTIONS = [
    {
        value: 'recommended',
        title: 'Recommended (Fastest)',
        hint: 'Use the default route',
    },
    {
        value: 'highways',
        title: 'Prefer Highways',
        hint: 'Favor major roads where possible',
    },
    {
        value: 'scenic',
        title: 'Scenic route',
        hint: 'Favor interesting landscapes where data allows',
    },
    {
        value: 'via',
        title: 'Via specific places',
        hint: 'Choose cities and towns your route should pass through',
    },
]

export default function RoutePreferences({ planner }: RoutePreferencesProps) {
    const { routePreference, setRoutePreference } = planner

    return (
        <div className="route-preferences-panel">
            <p className="route-preferences-heading">Route priorities</p>

            {OPTIONS.map((option) => (
                <label className="route-preference-option" key={option.value}>
                    <input
                        type="radio"
                        name="routePreference"
                        value={option.value}
                        checked={routePreference === option.value}
                        onChange={() => setRoutePreference(option.value)}
                    />
                    <span>
                        <strong>{option.title}</strong>
                        <small>{option.hint}</small>
                    </span>
                </label>
            ))}

            {routePreference === 'via' && <ViaPlacesEditor planner={planner} />}

            <p className="route-preferences-note">
                Highway mode favors major roads. Scenic mode tries to avoid major highways and tolls; it cannot guarantee scenic views.
            </p>
        </div>
    )
}
