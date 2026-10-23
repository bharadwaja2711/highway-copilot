import { config } from '../config'

export type GeocodingResult = {
    lat: string
    lon: string
    display_name: string
}

export async function geocodeLocation(place: string): Promise<GeocodingResult[]> {
    const params = new URLSearchParams({
        q: place,
        format: 'jsonv2',
        limit: '5',
    })

    const response = await fetch(
        `${config.nominatimUrl}/search?${params}`,
    )

    if (!response.ok) {
        throw new Error('Location search failed. Please try again.')
    }

    return response.json()
}

export async function suggestLocations(
    place: string,
    signal?: AbortSignal,
): Promise<GeocodingResult[]> {
    const params = new URLSearchParams({
        q: place,
        limit: '5',
    })

    const response = await fetch(
        `${config.photonUrl}/api/?${params}`,
        { signal },
    )

    if (!response.ok) {
        throw new Error('Location suggestions failed.')
    }

    const data = await response.json()

    return data.features.map((feature: {
        properties: {
            name?: string
            city?: string
            state?: string
            country?: string
        }
        geometry: { coordinates: [number, number] }
    }) => ({
        lat: String(feature.geometry.coordinates[1]),
        lon: String(feature.geometry.coordinates[0]),
        display_name: [
            feature.properties.name,
            feature.properties.city,
            feature.properties.state,
            feature.properties.country,
        ]
            .filter(Boolean)
            .filter((value, index, values) => values.indexOf(value) === index)
            .join(', '),
    }))
}
