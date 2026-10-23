const env = import.meta.env

function baseUrl(value: string | undefined, fallback: string) {
    return (value?.trim() || fallback).replace(/\/+$/, '')
}

// Defaults are the free community servers. Override any of them in .env
// (see .env.example) to switch providers without touching code.
export const config = {
    nominatimUrl: baseUrl(env.VITE_NOMINATIM_URL, 'https://nominatim.openstreetmap.org'),
    photonUrl: baseUrl(env.VITE_PHOTON_URL, 'https://photon.komoot.io'),
    valhallaUrl: baseUrl(env.VITE_VALHALLA_URL, 'https://valhalla1.openstreetmap.de'),
    tileUrl:
        env.VITE_TILE_URL?.trim() || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
        env.VITE_TILE_ATTRIBUTION?.trim() ||
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
}
