import type { useRoutePlanner } from '../hooks/useRoutePlanner'
import LocationInput from './LocationInput'

type RouteFormProps = {
    planner: ReturnType<typeof useRoutePlanner>
}

export default function RouteForm({ planner }: RouteFormProps) {
    const {
        originField,
        destinationField,
        swapLocations,
        message,
        handleSubmit,
        routeDistance,
        routeDuration,
        showRoutePreferences,
        setShowRoutePreferences,
        routePreference,
        setRoutePreference,
        viaPlaceInput,
        setViaPlaceInput,
        viaPlaceSuggestions,
        setViaPlaceSuggestions,
        selectedViaPlace,
        setSelectedViaPlace,
        viaPlaces,
        setViaPlaces,
        handleViaPlaceChange,
        addViaPlace,
    } = planner

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

            <button className="plan-button" type="submit">
                Plan journey <span>↗</span>
            </button>

            {message && !message.startsWith('Route found!') && (
                <p className="form-message" role="status">{message}</p>
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

                    {showRoutePreferences && (
                        <div className="route-preferences-panel">
                            <p className="route-preferences-heading">Route priorities</p>

                            <label className="route-preference-option">
                                <input
                                    type="radio"
                                    name="routePreference"
                                    value="recommended"
                                    checked={routePreference === 'recommended'}
                                    onChange={() => setRoutePreference('recommended')}
                                />
                                <span>
                                    <strong>Recommended (Fastest)</strong>
                                    <small>Use the default route</small>
                                </span>
                            </label>

                            <label className="route-preference-option">
                                <input
                                    type="radio"
                                    name="routePreference"
                                    value="highways"
                                    checked={routePreference === 'highways'}
                                    onChange={() => setRoutePreference('highways')}
                                />
                                <span>
                                    <strong>Prefer Highways</strong>
                                    <small>Favor major roads where possible</small>
                                </span>
                            </label>

                            <label className="route-preference-option">
                                <input
                                    type="radio"
                                    name="routePreference"
                                    value="scenic"
                                    checked={routePreference === 'scenic'}
                                    onChange={() => setRoutePreference('scenic')}
                                />
                                <span>
                                    <strong>Scenic route</strong>
                                    <small>Favor interesting landscapes where data allows</small>
                                </span>
                            </label>

                            <label className="route-preference-option">
                                <input
                                    type="radio"
                                    name="routePreference"
                                    value="via"
                                    checked={routePreference === 'via'}
                                    onChange={() => setRoutePreference('via')}
                                />
                                <span>
                                    <strong>Via specific places</strong>
                                    <small>Choose cities and towns your route should pass through</small>
                                </span>
                            </label>

                            {routePreference === 'via' && (
                                <div className="via-places-section">
                                    <label htmlFor="via-place-input">Places to pass through</label>

                                    <p className="via-places-help">
                                        Add cities or towns in the order you want to visit them.
                                    </p>

                                    <div className="via-place-input-row">
                                        <input
                                            id="via-place-input"
                                            type="text"
                                            value={viaPlaceInput}
                                            onChange={(event) => {
                                                void handleViaPlaceChange(event.target.value)
                                            }}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    event.preventDefault()
                                                    if (viaPlaceSuggestions.length > 0) {
                                                        const first = viaPlaceSuggestions[0]
                                                        setViaPlaceInput(first.display_name)
                                                        setSelectedViaPlace(first)
                                                        setViaPlaceSuggestions([])
                                                    } else {
                                                        addViaPlace()
                                                    }
                                                }
                                            }}
                                            placeholder="Search for a city or town"
                                            autoComplete="off"
                                        />

                                        <button
                                            type="button"
                                            onClick={addViaPlace}
                                            disabled={!selectedViaPlace}
                                        >
                                            Add
                                        </button>
                                    </div>

                                    {viaPlaceSuggestions.length > 0 && (
                                        <div className="suggestions-list">
                                            {viaPlaceSuggestions.map((place, index) => (
                                                <button
                                                    key={`${place.lat}-${place.lon}-${index}`}
                                                    type="button"
                                                    className="suggestion-item"
                                                    onClick={() => {
                                                        setViaPlaceInput(place.display_name)
                                                        setSelectedViaPlace(place)
                                                        setViaPlaceSuggestions([])
                                                    }}
                                                >
                                                    {place.display_name}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {viaPlaces.length > 0 && (
                                        <div className="via-places-list">
                                            <p className="via-places-list-heading">Your route, in order</p>

                                            {viaPlaces.map((place, index) => (
                                                <div className="via-place-item" key={`${place.lat}-${place.lon}`}>
                                                    <span className="via-place-number">{index + 1}</span>
                                                    <span className="via-place-name">{place.display_name}</span>

                                                    <div className="via-place-order-controls">
                                                        <button
                                                            type="button"
                                                            disabled={index === 0}
                                                            aria-label={`Move ${place.display_name} up`}
                                                            onClick={() => {
                                                                const updated = [...viaPlaces]
                                                                ;[updated[index - 1], updated[index]] = [
                                                                    updated[index],
                                                                    updated[index - 1],
                                                                ]
                                                                setViaPlaces(updated)
                                                            }}
                                                        >
                                                            ↑
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={index === viaPlaces.length - 1}
                                                            aria-label={`Move ${place.display_name} down`}
                                                            onClick={() => {
                                                                const updated = [...viaPlaces]
                                                                ;[updated[index], updated[index + 1]] = [
                                                                    updated[index + 1],
                                                                    updated[index],
                                                                ]
                                                                setViaPlaces(updated)
                                                            }}
                                                        >
                                                            ↓
                                                        </button>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className="via-place-remove"
                                                        onClick={() => {
                                                            setViaPlaces(viaPlaces.filter((_, i) => i !== index))
                                                        }}
                                                        aria-label={`Remove ${place.display_name}`}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <p className="route-preferences-note">
                                Highway mode favors major roads. Scenic mode tries to avoid major highways and tolls; it cannot guarantee scenic views.
                            </p>
                        </div>
                    )}

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
                </>
            )}
        </form>
    )
}
