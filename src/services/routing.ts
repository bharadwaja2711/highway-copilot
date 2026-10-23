import type { GeocodingResult } from './geocoding'

type RouteResult = {
    distance: number
    duration: number
    geometry: {
        coordinates: [number, number][]
    }
}

function decodePolyline6(encoded: string): [number, number][] {
    const coordinates: [number, number][] = []
    let index = 0
    let latitude = 0
    let longitude = 0

    while (index < encoded.length) {
        let result = 0
        let shift = 0
        let byte: number

        do {
            byte = encoded.charCodeAt(index++) - 63
            result |= (byte & 0x1f) << shift
            shift += 5
        } while (byte >= 0x20)

        const latitudeChange = result & 1 ? ~(result >> 1) : result >> 1
        latitude += latitudeChange

        result = 0
        shift = 0

        do {
            byte = encoded.charCodeAt(index++) - 63
            result |= (byte & 0x1f) << shift
            shift += 5
        } while (byte >= 0x20)

        const longitudeChange = result & 1 ? ~(result >> 1) : result >> 1
        longitude += longitudeChange

        coordinates.push([longitude / 1_000_000, latitude / 1_000_000])
    }

    return coordinates
}

export async function getDrivingRoute(
    start: GeocodingResult,
    end: GeocodingResult,
    viaPlaces: GeocodingResult[] = [],
    preference = 'recommended',
): Promise<RouteResult> {
    const locations = [start, ...viaPlaces, end].map((place) => ({
        lat: Number(place.lat),
        lon: Number(place.lon),
    }))

    // Valhalla's auto costing options influence which roads the router prefers.
    // Scenic is an approximation that favors avoiding major highways and tolls;
    // it cannot guarantee viewpoints or scenic landscapes.
    const autoOptions: Record<string, number> = {}

    if (preference === 'highways') {
        autoOptions.use_highways = 1.0
        autoOptions.use_tolls = 0.8
    } else if (preference === 'scenic') {
        autoOptions.use_highways = 0.25
        autoOptions.use_tolls = 0.2
        autoOptions.use_living_streets = 0.2
    }

    const requestBody = {
        locations,
        costing: 'auto',
        costing_options: Object.keys(autoOptions).length
            ? { auto: autoOptions }
            : undefined,
        units: 'kilometers',
        shape_format: 'polyline6',
    }

    const response = await fetch('https://valhalla1.openstreetmap.de/route', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Client-Id': 'highway-copilot-community-app',
        },
        body: JSON.stringify(requestBody),
    })

    const data = await response.json()

    if (!response.ok || data.error || !data.trip?.legs?.length) {
        throw new Error(
            data.error || data.status_message || 'Could not calculate a driving route. Please try again.',
        )
    }

    const coordinates = data.trip.legs.flatMap((leg: { shape: string }, index: number) => {
        const legCoordinates = decodePolyline6(leg.shape)
        // Remove duplicate join points between consecutive legs.
        return index === 0 ? legCoordinates : legCoordinates.slice(1)
    })

    return {
        distance: data.trip.summary.length * 1000,
        duration: data.trip.summary.time,
        geometry: { coordinates },
    }
}
