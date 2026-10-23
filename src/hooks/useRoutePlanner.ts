import { useState } from 'react'
import { geocodeLocation, type GeocodingResult } from '../services/geocoding'
import { getDrivingRoute } from '../services/routing'
import {
    useLocationAutocomplete,
    type LocationAutocomplete,
} from './useLocationAutocomplete'

// Use the place the user picked from the dropdown; only geocode if they just typed text.
async function resolvePlace(field: LocationAutocomplete): Promise<GeocodingResult | null> {
    if (field.selected) return field.selected
    const results = await geocodeLocation(field.value.trim())
    return results[0] ?? null
}

export function useRoutePlanner() {
    const originField = useLocationAutocomplete()
    const destinationField = useLocationAutocomplete()
    const via = useLocationAutocomplete()

    const [message, setMessage] = useState('')

    const [routeDistance, setRouteDistance] = useState<number | null>(null)
    const [routeDuration, setRouteDuration] = useState<number | null>(null)
    const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null)

    const [showRoutePreferences, setShowRoutePreferences] = useState(false)
    const [routePreference, setRoutePreference] = useState('recommended')

    const [viaPlaces, setViaPlaces] = useState<GeocodingResult[]>([])

    function swapLocations() {
        const fromValue = originField.value
        const fromSelected = originField.selected
        originField.replace(destinationField.value, destinationField.selected)
        destinationField.replace(fromValue, fromSelected)
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!originField.value.trim() || !destinationField.value.trim()) {
            setMessage('Enter both locations to continue.')
            return
        }

        if (routePreference === 'via' && viaPlaces.length === 0) {
            setMessage('Add at least one place for your via route.')
            return
        }

        setMessage('Finding your locations...')

        try {
            const start = await resolvePlace(originField)
            if (!start) {
                setMessage('Starting location not found. Try a more specific place.')
                return
            }

            const end = await resolvePlace(destinationField)
            if (!end) {
                setMessage('Destination not found. Try a more specific place.')
                return
            }

            setMessage('Locations found. Calculating driving route...')

            const route = await getDrivingRoute(
                start,
                end,
                routePreference === 'via' ? viaPlaces : [],
                routePreference,
            )

            setRouteDistance(route.distance / 1000)
            setRouteDuration(route.duration / 60)
            setRouteCoordinates(route.geometry.coordinates)

            setMessage(
                `Route found! Distance: ${(route.distance / 1000).toFixed(1)} km · Estimated driving time: ${Math.round(route.duration / 60)} min`,
            )
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'Something went wrong. Check your internet connection and try again.',
            )
        }
    }

    function addViaPlace() {
        if (!via.selected) return

        const alreadyAdded = viaPlaces.some(
            (place) => place.lat === via.selected!.lat && place.lon === via.selected!.lon,
        )

        if (alreadyAdded) return

        setViaPlaces([...viaPlaces, via.selected])
        via.replace('', null)
    }

    return {
        originField,
        destinationField,
        swapLocations,
        message,
        routeDistance, routeDuration, routeCoordinates,
        showRoutePreferences, setShowRoutePreferences,
        routePreference, setRoutePreference,
        viaPlaceInput: via.value, setViaPlaceInput: via.setValue,
        viaPlaceSuggestions: via.suggestions, setViaPlaceSuggestions: via.setSuggestions,
        selectedViaPlace: via.selected, setSelectedViaPlace: via.setSelected,
        viaPlaces, setViaPlaces,
        handleSubmit,
        handleViaPlaceChange: via.handleChange,
        addViaPlace,
    }
}
