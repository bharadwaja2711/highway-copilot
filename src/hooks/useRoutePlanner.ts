import { useState } from 'react'
import {
    geocodeLocation,
    suggestLocations,
    type GeocodingResult,
} from '../services/geocoding'
import { getDrivingRoute } from '../services/routing'

export function useRoutePlanner() {
    const [origin, setOrigin] = useState('')
    const [destination, setDestination] = useState('')
    const [message, setMessage] = useState('')

    const [originSuggestions, setOriginSuggestions] = useState<GeocodingResult[]>([])
    const [destinationSuggestions, setDestinationSuggestions] = useState<GeocodingResult[]>([])

    const [routeDistance, setRouteDistance] = useState<number | null>(null)
    const [routeDuration, setRouteDuration] = useState<number | null>(null)
    const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null)

    const [showRoutePreferences, setShowRoutePreferences] = useState(false)
    const [routePreference, setRoutePreference] = useState('recommended')

    const [viaPlaceInput, setViaPlaceInput] = useState('')
    const [viaPlaceSuggestions, setViaPlaceSuggestions] = useState<GeocodingResult[]>([])
    const [selectedViaPlace, setSelectedViaPlace] = useState<GeocodingResult | null>(null)
    const [viaPlaces, setViaPlaces] = useState<GeocodingResult[]>([])

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

            if (routePreference === 'via' && viaPlaces.length === 0) {
                setMessage('Add at least one place for your via route.')
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

    async function handleViaPlaceChange(value: string) {
        setViaPlaceInput(value)
        setSelectedViaPlace(null)
        setViaPlaceSuggestions([])

        if (value.trim().length < 3) return

        try {
            const results = await suggestLocations(value.trim())
            setViaPlaceSuggestions(results)
        } catch {
            setViaPlaceSuggestions([])
        }
    }

    function addViaPlace() {
        if (!selectedViaPlace) return

        const alreadyAdded = viaPlaces.some(
            (place) =>
                place.lat === selectedViaPlace.lat &&
                place.lon === selectedViaPlace.lon,
        )

        if (alreadyAdded) return

        setViaPlaces([...viaPlaces, selectedViaPlace])
        setViaPlaceInput('')
        setViaPlaceSuggestions([])
        setSelectedViaPlace(null)
    }

    return {
        origin, setOrigin,
        destination, setDestination,
        message,
        originSuggestions, setOriginSuggestions,
        destinationSuggestions, setDestinationSuggestions,
        routeDistance, routeDuration, routeCoordinates,
        showRoutePreferences, setShowRoutePreferences,
        routePreference, setRoutePreference,
        viaPlaceInput, setViaPlaceInput,
        viaPlaceSuggestions, setViaPlaceSuggestions,
        selectedViaPlace, setSelectedViaPlace,
        viaPlaces, setViaPlaces,
        handleSubmit, handleViaPlaceChange, addViaPlace,
    }
}
