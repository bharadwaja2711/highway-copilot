import { useEffect, useRef, useState } from 'react'
import { suggestLocations, type GeocodingResult } from '../services/geocoding'

const DEBOUNCE_MS = 300
const MIN_CHARS = 3

export function useLocationAutocomplete() {
    const [value, setValue] = useState('')
    const [suggestions, setSuggestions] = useState<GeocodingResult[]>([])
    const [selected, setSelected] = useState<GeocodingResult | null>(null)

    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const controller = useRef<AbortController | null>(null)

    function cancelPending() {
        clearTimeout(timer.current)
        controller.current?.abort()
        controller.current = null
    }

    useEffect(() => {
        return () => {
            clearTimeout(timer.current)
            controller.current?.abort()
        }
    }, [])

    // Called when the user types. Clears any previous selection.
    function handleChange(next: string) {
        setValue(next)
        setSelected(null)
        setSuggestions([])
        cancelPending()

        if (next.trim().length < MIN_CHARS) return

        timer.current = setTimeout(async () => {
            const ctrl = new AbortController()
            controller.current = ctrl

            try {
                const results = await suggestLocations(next.trim(), ctrl.signal)
                if (!ctrl.signal.aborted) setSuggestions(results)
            } catch {
                if (!ctrl.signal.aborted) setSuggestions([])
            }
        }, DEBOUNCE_MS)
    }

    // Called when the user clicks a suggestion. Remembers the exact place.
    function select(place: GeocodingResult) {
        cancelPending()
        setValue(place.display_name)
        setSelected(place)
        setSuggestions([])
    }

    // Programmatic replace (used by swap and reset).
    function replace(nextValue: string, nextSelected: GeocodingResult | null) {
        cancelPending()
        setValue(nextValue)
        setSelected(nextSelected)
        setSuggestions([])
    }

    return {
        value, setValue,
        suggestions, setSuggestions,
        selected, setSelected,
        handleChange, select, replace,
    }
}

export type LocationAutocomplete = ReturnType<typeof useLocationAutocomplete>
