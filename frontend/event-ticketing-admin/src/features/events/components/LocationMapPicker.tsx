import { useEffect, useRef, useState, useCallback } from 'react'
import { Map, Marker, NavigationControl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapPin, Search, Compass, ExternalLink, Sparkles, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

export interface ResolvedAddress {
  address: string
  city: string
  state: string
  venueName?: string
  displayName?: string
  postcode?: string
  country?: string
}

interface LocationMapPickerProps {
  latitude?: number
  longitude?: number
  onCoordinatesChange: (lat: number, lng: number) => void
  onAddressResolved?: (resolved: ResolvedAddress) => void
  addressQuery?: string
  venueName?: string
}

const MAPTILER_KEY = 'PdInFiXeCh0BqtZ6W1Za'

const MAP_STYLES = {
  streets: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
  hybrid: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`,
  dark: `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_KEY}`,
} as const

type MapStyleKey = keyof typeof MAP_STYLES

// Helper: Parse Nominatim reverse geocode response to structured address
function parseNominatimAddress(data: any): ResolvedAddress {
  const addr = data?.address || {}

  // 1. Street Address & Neighborhood
  const streetParts: string[] = []
  if (addr.road) {
    streetParts.push(addr.house_number ? `${addr.road} #${addr.house_number}` : addr.road)
  }
  const colSub = addr.neighbourhood || addr.suburb || addr.quarter || addr.residential
  if (colSub) {
    streetParts.push(colSub)
  }

  const address =
    streetParts.length > 0
      ? streetParts.join(', ')
      : data?.display_name
      ? data.display_name.split(',').slice(0, 2).join(',').trim()
      : ''

  // 2. City
  const city =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.county ||
    addr.borough ||
    addr.suburb ||
    ''

  // 3. State
  const state = addr.state || addr.province || addr.region || ''

  // 4. Venue Name (if detected and not just the street name)
  let venueName: string | undefined = undefined
  const rawName = data?.name
  if (rawName && rawName !== addr.road && rawName !== addr.house_number) {
    venueName = rawName
  } else if (addr.amenity || addr.leisure || addr.building || addr.tourism) {
    venueName = addr.amenity || addr.leisure || addr.building || addr.tourism
  }

  return {
    address,
    city,
    state,
    venueName,
    displayName: data?.display_name,
    postcode: addr.postcode,
    country: addr.country,
  }
}

export function LocationMapPicker({
  latitude,
  longitude,
  onCoordinatesChange,
  onAddressResolved,
  addressQuery = '',
  venueName = '',
}: LocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<Map | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const [mapStyle, setMapStyle] = useState<MapStyleKey>('streets')
  const [pasteInput, setPasteInput] = useState('')
  const [pasteFeedback, setPasteFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const [isLocatingCurrent, setIsLocatingCurrent] = useState(false)
  const [isResolvingAddress, setIsResolvingAddress] = useState(false)

  // Default coordinate: CDMX if empty
  const defaultLat = 19.4326
  const defaultLng = -99.1332

  const currentLat = typeof latitude === 'number' && !isNaN(latitude) && latitude !== 0 ? latitude : defaultLat
  const currentLng = typeof longitude === 'number' && !isNaN(longitude) && longitude !== 0 ? longitude : defaultLng
  const hasValidCoords =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    (latitude !== 0 || longitude !== 0)

  // Ref to onAddressResolved so Leaflet / MapLibre event listeners always access current callback
  const onAddressResolvedRef = useRef(onAddressResolved)
  useEffect(() => {
    onAddressResolvedRef.current = onAddressResolved
  }, [onAddressResolved])

  // Reverse geocoding logic with OpenStreetMap Nominatim
  const fetchReverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!onAddressResolvedRef.current) return

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsResolvingAddress(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'es',
          },
          signal: controller.signal,
        }
      )
      if (!res.ok) throw new Error('Reverse geocode failed')
      const data = await res.json()
      const resolved = parseNominatimAddress(data)

      onAddressResolvedRef.current(resolved)

      setPasteFeedback({
        type: 'success',
        message: resolved.address
          ? `📍 Dirección autocompletada: ${resolved.address}${resolved.city ? ` (${resolved.city})` : ''}`
          : `Ubicación marcada: ${lat}, ${lng}`,
      })
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setPasteFeedback({
          type: 'success',
          message: `Ubicación marcada (${lat}, ${lng})`,
        })
      }
    } finally {
      setIsResolvingAddress(false)
    }
  }, [])

  const reverseGeocodeRef = useRef(fetchReverseGeocode)
  useEffect(() => {
    reverseGeocodeRef.current = fetchReverseGeocode
  }, [fetchReverseGeocode])

  // Switch Map Style (Streets v2, Satélite Híbrido, Nocturno)
  const handleSwitchLayer = (styleKey: MapStyleKey) => {
    if (!mapInstanceRef.current) return
    setMapStyle(styleKey)
    mapInstanceRef.current.setStyle(MAP_STYLES[styleKey])
  }

  // Initialize MapLibre GL Map & Marker
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return

    // Initialize MapLibre GL
    const map = new Map({
      container: mapContainerRef.current,
      style: MAP_STYLES.streets,
      center: [currentLng, currentLat], // [lng, lat]
      zoom: hasValidCoords ? 15 : 13,
      attributionControl: false,
    })

    // Navigation controls: Zoom in/out, Pitch/Rotate
    map.addControl(new NavigationControl({ visualizePitch: true }), 'top-left')

    // Venú Orange Draggable Marker
    const marker = new Marker({
      draggable: true,
      color: '#FA4616',
    })
      .setLngLat([currentLng, currentLat])
      .addTo(map)

    // Drag-end handler: update coordinates and reverse-geocode
    marker.on('dragend', () => {
      const lngLat = marker.getLngLat()
      const fixedLat = Number(lngLat.lat.toFixed(6))
      const fixedLng = Number(lngLat.lng.toFixed(6))
      onCoordinatesChange(fixedLat, fixedLng)
      reverseGeocodeRef.current?.(fixedLat, fixedLng)
    })

    // Click on map handler: move marker and reverse-geocode
    map.on('click', (e) => {
      marker.setLngLat(e.lngLat)
      const fixedLat = Number(e.lngLat.lat.toFixed(6))
      const fixedLng = Number(e.lngLat.lng.toFixed(6))
      onCoordinatesChange(fixedLat, fixedLng)
      reverseGeocodeRef.current?.(fixedLat, fixedLng)
    })

    mapInstanceRef.current = map
    markerRef.current = marker

    // Invalidate container size after mount
    const timer = setTimeout(() => {
      map.resize()
    }, 150)

    return () => {
      clearTimeout(timer)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      marker.remove()
      map.remove()
      mapInstanceRef.current = null
      markerRef.current = null
    }
  }, []) // Mount once

  // Sync marker position when coordinates change from outside
  useEffect(() => {
    if (hasValidCoords && markerRef.current && mapInstanceRef.current) {
      const current = markerRef.current.getLngLat()
      if (
        Math.abs(current.lat - latitude!) > 0.00001 ||
        Math.abs(current.lng - longitude!) > 0.00001
      ) {
        markerRef.current.setLngLat([longitude!, latitude!])
        mapInstanceRef.current.easeTo({ center: [longitude!, latitude!] })
      }
    }
  }, [latitude, longitude, hasValidCoords])

  // Smart Parser for Google Maps links and pasted coordinates
  const handleParseAndApply = (input: string) => {
    const raw = input.trim()
    if (!raw) return

    let lat: number | null = null
    let lng: number | null = null

    // Pattern 1: URL with @lat,lng,zoom
    const urlAtMatch = raw.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (urlAtMatch) {
      lat = parseFloat(urlAtMatch[1])
      lng = parseFloat(urlAtMatch[2])
    }

    // Pattern 2: URL with ?q=lat,lng or &q=lat,lng or ll=lat,lng
    if (lat === null) {
      const urlQMatch = raw.match(/[?&](?:q|ll|query)=(-?\d+\.\d+),(-?\d+\.\d+)/)
      if (urlQMatch) {
        lat = parseFloat(urlQMatch[1])
        lng = parseFloat(urlQMatch[2])
      }
    }

    // Pattern 3: Standard comma separated "20.912247, -100.728071"
    if (lat === null) {
      const commaMatch = raw.match(/^(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)$/)
      if (commaMatch) {
        lat = parseFloat(commaMatch[1])
        lng = parseFloat(commaMatch[2])
      }
    }

    // Pattern 4: Accidentally joined like "20.912247-100.728071"
    if (lat === null) {
      const joinedMatch = raw.match(/^(\d+\.\d+)(-\d+(?:\.\d+)?)$/)
      if (joinedMatch) {
        lat = parseFloat(joinedMatch[1])
        lng = parseFloat(joinedMatch[2])
        if (!joinedMatch[2].includes('.') && joinedMatch[2].length > 4) {
          const minusPart = joinedMatch[2]
          lng = parseFloat(minusPart.substring(0, 4) + '.' + minusPart.substring(4))
        }
      }
    }

    if (
      lat !== null &&
      lng !== null &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      const fixedLat = Number(lat.toFixed(6))
      const fixedLng = Number(lng.toFixed(6))

      onCoordinatesChange(fixedLat, fixedLng)
      if (markerRef.current) {
        markerRef.current.setLngLat([fixedLng, fixedLat])
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo({ center: [fixedLng, fixedLat], zoom: 16 })
      }
      setPasteInput('')
      fetchReverseGeocode(fixedLat, fixedLng)
    } else {
      setPasteFeedback({
        type: 'error',
        message:
          'No pudimos reconocer las coordenadas en ese texto. Intenta pegar "20.912247, -100.728071" o el enlace de Google Maps.',
      })
    }
  }

  // Geocoding with OpenStreetMap Nominatim
  const handleSearchAddress = async () => {
    const query = [venueName, addressQuery].filter(Boolean).join(', ')
    if (!query.trim()) {
      setPasteFeedback({
        type: 'error',
        message: 'Escribe primero el nombre del recinto o dirección para buscarlo.',
      })
      return
    }

    try {
      setIsSearchingAddress(true)
      setPasteFeedback(null)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        {
          headers: {
            'Accept-Language': 'es',
          },
        }
      )
      const data = await res.json()
      if (data && data.length > 0) {
        const foundLat = Number(parseFloat(data[0].lat).toFixed(6))
        const foundLng = Number(parseFloat(data[0].lon).toFixed(6))

        onCoordinatesChange(foundLat, foundLng)
        if (markerRef.current) {
          markerRef.current.setLngLat([foundLng, foundLat])
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo({ center: [foundLng, foundLat], zoom: 16 })
        }
        setPasteFeedback({
          type: 'success',
          message: `Ubicado: ${data[0].display_name.substring(0, 60)}...`,
        })
      } else {
        setPasteFeedback({
          type: 'error',
          message: `No se encontró "${query}". Haz clic directamente en el mapa para ubicar el pin.`,
        })
      }
    } catch {
      setPasteFeedback({
        type: 'error',
        message: 'Error al consultar el servicio de búsqueda. Puedes colocar el pin haciendo clic en el mapa.',
      })
    } finally {
      setIsSearchingAddress(false)
    }
  }

  // Current Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setPasteFeedback({
        type: 'error',
        message: 'La geolocalización no está soportada en tu navegador.',
      })
      return
    }

    setIsLocatingCurrent(true)
    setPasteFeedback(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocatingCurrent(false)
        const lat = Number(position.coords.latitude.toFixed(6))
        const lng = Number(position.coords.longitude.toFixed(6))

        onCoordinatesChange(lat, lng)
        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat])
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo({ center: [lng, lat], zoom: 16 })
        }
        fetchReverseGeocode(lat, lng)
      },
      () => {
        setIsLocatingCurrent(false)
        setPasteFeedback({
          type: 'error',
          message: 'Permiso de ubicación denegado o no disponible.',
        })
      },
      { timeout: 8000 }
    )
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-4 sm:p-5 shadow-sm transition-colors">
      {/* Header with Title and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FA4616]/15 text-[#FA4616]">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Ubicación en Mapa Interactivo
            </h4>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Haz clic o arrastra el marcador para autocompletar la dirección exacta
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocatingCurrent}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[11px] font-mono text-[var(--text-primary)] hover:border-[#FA4616]/50 transition-colors"
            title="Usar mi ubicación GPS actual"
          >
            <Compass className="h-3.5 w-3.5 text-[#FA4616]" />
            <span>{isLocatingCurrent ? 'Localizando...' : 'Mi ubicación'}</span>
          </button>

          {(venueName || addressQuery) && (
            <button
              type="button"
              onClick={handleSearchAddress}
              disabled={isSearchingAddress}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#FA4616]/40 bg-[#FA4616]/10 px-2.5 py-1 text-[11px] font-mono font-semibold text-[#FA4616] hover:bg-[#FA4616]/20 transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              <span>{isSearchingAddress ? 'Buscando...' : 'Ubicar por texto'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Smart Paste Input for Google Maps URL or Coordinates */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#FA4616]" />
            <input
              type="text"
              value={pasteInput}
              onChange={(e) => setPasteInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleParseAndApply(pasteInput)
                }
              }}
              placeholder="Pega enlace de Google Maps o coordenadas (ej. 20.912247, -100.728071)..."
              className="h-9 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] pl-9 pr-3 text-xs font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#FA4616] focus:outline-none transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={() => handleParseAndApply(pasteInput)}
            disabled={!pasteInput.trim()}
            className="h-9 px-3 rounded-xl bg-[#FA4616] hover:bg-[#FF6B35] disabled:opacity-40 text-white text-xs font-bold font-mono transition-colors shrink-0"
          >
            Aplicar
          </button>
        </div>

        {/* Feedback message */}
        {pasteFeedback && (
          <div
            className={`mt-2 flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg ${
              pasteFeedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
            }`}
          >
            {pasteFeedback.type === 'success' ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>{pasteFeedback.message}</span>
          </div>
        )}
      </div>

      {/* Map Container (500px as requested) */}
      <div className="relative h-[480px] sm:h-[500px] w-full overflow-hidden rounded-xl border border-[var(--border-color)] shadow-inner bg-[var(--bg-main)]">
        <div ref={mapContainerRef} className="h-full w-full" />

        {/* Loading overlay when reverse geocoding */}
        {isResolvingAddress && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[10] inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-surface)] px-3 py-1 text-[11px] font-mono font-medium text-[#FA4616] border border-[#FA4616]/40 shadow-lg backdrop-blur-md animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Autocompletando dirección...</span>
          </div>
        )}

        {/* Layer Switcher (Streets v2 | Satélite Híbrido | Nocturno) */}
        <div className="absolute top-3 right-32 z-[10] flex items-center bg-[var(--bg-surface)]/90 rounded-lg p-0.5 backdrop-blur-md border border-[var(--border-color)] shadow-md text-[10px] font-mono">
          <button
            type="button"
            onClick={() => handleSwitchLayer('streets')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              mapStyle === 'streets'
                ? 'bg-[#FA4616] text-white font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Calles
          </button>
          <button
            type="button"
            onClick={() => handleSwitchLayer('hybrid')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              mapStyle === 'hybrid'
                ? 'bg-[#FA4616] text-white font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Satélite
          </button>
          <button
            type="button"
            onClick={() => handleSwitchLayer('dark')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              mapStyle === 'dark'
                ? 'bg-[#FA4616] text-white font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Nocturno
          </button>
        </div>

        {/* Open in Google Maps Link */}
        {hasValidCoords && (
          <a
            href={`https://www.google.com/maps?q=${currentLat},${currentLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3 z-[10] inline-flex items-center gap-1 rounded-lg bg-[var(--bg-surface)]/90 hover:bg-[var(--bg-elevated)] px-2.5 py-1 backdrop-blur-md border border-[var(--border-color)] text-[10px] font-mono text-[var(--text-primary)] hover:text-[#FA4616] transition-colors shadow-md"
            title="Ver en Google Maps externo"
          >
            <span>Google Maps</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {/* Active Coordinates Float Badge */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-[10] flex items-center gap-2 rounded-lg bg-[var(--bg-surface)]/90 px-2.5 py-1 backdrop-blur-md border border-[var(--border-color)] text-[10px] font-mono text-[var(--text-primary)] shadow-md">
          <span className="h-2 w-2 rounded-full bg-[#FA4616] animate-pulse" />
          <span>
            Lat: <strong>{hasValidCoords ? currentLat : '--'}</strong>, Lng:{' '}
            <strong>{hasValidCoords ? currentLng : '--'}</strong>
          </span>
        </div>
      </div>
    </div>
  )
}
