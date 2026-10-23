import type { useRoutePlanner } from '../hooks/useRoutePlanner'

type ViaPlacesEditorProps = {
    planner: ReturnType<typeof useRoutePlanner>
}

export default function ViaPlacesEditor({ planner }: ViaPlacesEditorProps) {
    const {
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

    function move(index: number, direction: -1 | 1) {
        const target = index + direction
        if (target < 0 || target >= viaPlaces.length) return
        const updated = [...viaPlaces]
        ;[updated[index], updated[target]] = [updated[target], updated[index]]
        setViaPlaces(updated)
    }

    return (
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
                    onChange={(event) => handleViaPlaceChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key !== 'Enter') return
                        event.preventDefault()

                        if (viaPlaceSuggestions.length > 0) {
                            const first = viaPlaceSuggestions[0]
                            setViaPlaceInput(first.display_name)
                            setSelectedViaPlace(first)
                            setViaPlaceSuggestions([])
                        } else {
                            addViaPlace()
                        }
                    }}
                    placeholder="Search for a city or town"
                    autoComplete="off"
                />

                <button type="button" onClick={addViaPlace} disabled={!selectedViaPlace}>
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
                                    onClick={() => move(index, -1)}
                                >
                                    ↑
                                </button>

                                <button
                                    type="button"
                                    disabled={index === viaPlaces.length - 1}
                                    aria-label={`Move ${place.display_name} down`}
                                    onClick={() => move(index, 1)}
                                >
                                    ↓
                                </button>
                            </div>

                            <button
                                type="button"
                                className="via-place-remove"
                                aria-label={`Remove ${place.display_name}`}
                                onClick={() =>
                                    setViaPlaces(viaPlaces.filter((_, i) => i !== index))
                                }
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
