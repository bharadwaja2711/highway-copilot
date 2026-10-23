import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    decodePolyline6,
    getDrivingRoute,
    MAX_TRIP_KM,
    straightLineKm,
} from './routing'

// Test-only encoder, used to round-trip the decoder.
function encodeValue(value: number): string {
    let v = value < 0 ? ~(value << 1) : value << 1
    let out = ''
    while (v >= 0x20) {
        out += String.fromCharCode((0x20 | (v & 0x1f)) + 63)
        v >>= 5
    }
    return out + String.fromCharCode(v + 63)
}

function encodePolyline6(coords: [number, number][]): string {
    let prevLat = 0
    let prevLon = 0
    let out = ''
    for (const [lon, lat] of coords) {
        const la = Math.round(lat * 1e6)
        const lo = Math.round(lon * 1e6)
        out += encodeValue(la - prevLat) + encodeValue(lo - prevLon)
        prevLat = la
        prevLon = lo
    }
    return out
}

const hyderabad = { lat: '17.385', lon: '78.4867', display_name: 'Hyderabad' }
const delhi = { lat: '28.6139', lon: '77.209', display_name: 'Delhi' }
const srinagar = { lat: '34.0837', lon: '74.7973', display_name: 'Srinagar' }

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('decodePolyline6', () => {
    it('decodes a known reference string', () => {
        // Google's canonical example, which is precision 5. Read as precision 6,
        // every value is 10x smaller.
        const decoded = decodePolyline6('_p~iF~ps|U_ulLnnqC_mqNvxq`@')
        const expected = [
            [-12.02, 3.85],
            [-12.095, 4.07],
            [-12.6453, 4.3252],
        ]
        expect(decoded).toHaveLength(3)
        decoded.forEach(([lon, lat], i) => {
            expect(lon).toBeCloseTo(expected[i][0], 6)
            expect(lat).toBeCloseTo(expected[i][1], 6)
        })
    })

    it('round-trips coordinates, including negative ones', () => {
        const coords: [number, number][] = [
            [78.4867, 17.385],
            [77.209, 28.6139],
            [-0.1278, 51.5074],
        ]
        const decoded = decodePolyline6(encodePolyline6(coords))
        expect(decoded).toHaveLength(coords.length)
        decoded.forEach(([lon, lat], i) => {
            expect(lon).toBeCloseTo(coords[i][0], 5)
            expect(lat).toBeCloseTo(coords[i][1], 5)
        })
    })

    it('returns an empty array for an empty string', () => {
        expect(decodePolyline6('')).toEqual([])
    })
})

describe('straightLineKm', () => {
    it('is zero for the same point', () => {
        expect(straightLineKm({ lat: 10, lon: 20 }, { lat: 10, lon: 20 })).toBe(0)
    })

    it('measures one degree of latitude as about 111 km', () => {
        expect(straightLineKm({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(111.2, 0)
    })

    it('puts Hyderabad to Delhi under the limit', () => {
        const km = straightLineKm(
            { lat: 17.385, lon: 78.4867 },
            { lat: 28.6139, lon: 77.209 },
        )
        expect(km).toBeGreaterThan(1200)
        expect(km).toBeLessThan(MAX_TRIP_KM)
    })

    it('puts Hyderabad to Srinagar over the limit', () => {
        const km = straightLineKm(
            { lat: 17.385, lon: 78.4867 },
            { lat: 34.0837, lon: 74.7973 },
        )
        expect(km).toBeGreaterThan(MAX_TRIP_KM)
    })
})

describe('getDrivingRoute trip limit', () => {
    it('rejects an over-limit trip before touching the network', async () => {
        const fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)

        await expect(getDrivingRoute(hyderabad, srinagar)).rejects.toThrow(/1,500 km/)
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('counts via places toward the limit', async () => {
        const fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)

        // Hyderabad to Delhi alone is fine, but detouring via Srinagar is not.
        await expect(getDrivingRoute(hyderabad, delhi, [srinagar])).rejects.toThrow(/1,500 km/)
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('lets an in-limit trip through and parses the response', async () => {
        const shape = encodePolyline6([
            [78.4867, 17.385],
            [77.209, 28.6139],
        ])
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                trip: { legs: [{ shape }], summary: { length: 1500, time: 60000 } },
            }),
        })
        vi.stubGlobal('fetch', fetchMock)

        const route = await getDrivingRoute(hyderabad, delhi)

        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(route.distance).toBe(1_500_000)
        expect(route.duration).toBe(60000)
        expect(route.geometry.coordinates).toHaveLength(2)
    })
})
