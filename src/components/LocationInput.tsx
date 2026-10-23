import type { LocationAutocomplete } from '../hooks/useLocationAutocomplete'

type LocationInputProps = {
    id: string
    label: string
    dotClass: string
    placeholder: string
    field: LocationAutocomplete
}

export default function LocationInput({
    id,
    label,
    dotClass,
    placeholder,
    field,
}: LocationInputProps) {
    return (
        <>
            <div className="location-line">
                <span className={`location-dot ${dotClass}`} />
                <label htmlFor={id}>{label}</label>
            </div>

            <input
                id={id}
                value={field.value}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder={placeholder}
                autoComplete="off"
            />

            {field.suggestions.length > 0 && (
                <div className="suggestions-list">
                    {field.suggestions.map((place, index) => (
                        <button
                            key={`${place.lat}-${place.lon}-${index}`}
                            type="button"
                            className="suggestion-item"
                            onClick={() => field.select(place)}
                        >
                            {place.display_name}
                        </button>
                    ))}
                </div>
            )}
        </>
    )
}
