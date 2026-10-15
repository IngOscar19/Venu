import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
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
  address?: string
  city?: string
  state?: string
}

interface MapStyleConfig {
  name: string
  url: string
  options: L.TileLayerOptions
}

const MAP_STYLES: Record<'streets' | 'hybrid' | 'dark', MapStyleConfig> = {
  streets: {
    name: 'Calles',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  hybrid: {
    name: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    },
  },
  dark: {
    name: 'Nocturno',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    options: {
      maxZoom: 20,
      subdomains: ['a', 'b', 'c', 'd'],
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    },
  },
}

type MapStyleKey = keyof typeof MAP_STYLES

// Custom Venú Orange Pin SVG Icon for Leaflet
function createVenuPinIcon() {
  return L.divIcon({
    className: 'venu-pin-container',
    html: `
      <div style="position: relative; width: 34px; height: 44px; transform: translate(-17px, -44px); filter: drop-shadow(0 6px 12px rgba(0,0,0,0.4)); cursor: grab;">
        <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 0C7.611 0 0 7.611 0 17c0 12.8 17 27 17 27s17-14.2 17-27c0-9.389-7.611-17-17-17z" fill="#FA4616"/>
          <circle cx="17" cy="16" r="6" fill="#FFFFFF"/>
        </svg>
      </div>
    `,
    iconSize: [34, 44],
    iconAnchor: [17, 44],
  })
}

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

// Progressive Geocode: Tries specific query, then stripped street, venue, etc.
async function forwardGeocodeProgressive(
  venue: string,
  address: string,
  city: string,
  state: string,
  signal?: AbortSignal
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const cleanAddr = address.trim()
  const cleanCity = city.trim()
  const cleanState = state.trim()
  const cleanVenue = venue.trim()

  const firstAddrSegment = cleanAddr.split(',')[0].trim()
  const cleanStreetOnly = firstAddrSegment.replace(/\b(no\.?|num\.?|#)\s*\d+.*$/i, '').trim()
  const segments = cleanAddr.split(',').map((s) => s.trim()).filter(Boolean)

  const candidates: string[] = []

  // 1. Full combination: Venue + Address + City + State
  if (cleanVenue && cleanAddr && cleanCity) {
    candidates.push([cleanVenue, cleanAddr, cleanCity, cleanState].filter(Boolean).join(', '))
  }

  // 2. Full Address + City + State
  if (cleanAddr && cleanCity) {
    candidates.push([cleanAddr, cleanCity, cleanState].filter(Boolean).join(', '))
  }

  // 3. First street segment + City + State (handles addresses with industrial parks, zip codes)
  if (firstAddrSegment && cleanCity && firstAddrSegment !== cleanAddr) {
    candidates.push([firstAddrSegment, cleanCity, cleanState].filter(Boolean).join(', '))
  }

  // 4. Clean street without house number + City + State
  if (cleanStreetOnly && cleanStreetOnly !== firstAddrSegment && cleanCity) {
    candidates.push([cleanStreetOnly, cleanCity, cleanState].filter(Boolean).join(', '))
  }

  // 5. Venue + City + State
  if (cleanVenue && cleanCity) {
    candidates.push([cleanVenue, cleanCity, cleanState].filter(Boolean).join(', '))
  }

  // 6. Secondary neighborhood / park / zone + City
  if (segments.length > 1 && cleanCity) {
    candidates.push([segments[1], cleanCity, cleanState].filter(Boolean).join(', '))
  }

  // 7. City + State fallback
  if (cleanCity) {
    candidates.push([cleanCity, cleanState].filter(Boolean).join(', '))
  }

  // Deduplicate candidates
  const uniqueCandidates = Array.from(new Set(candidates.filter(Boolean)))

  for (const q of uniqueCandidates) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
        {
          headers: {
            'Accept-Language': 'es',
          },
          signal,
        }
      )
      if (!res.ok) continue
      const data = await res.json()
      if (data && data.length > 0) {
        return {
          lat: Number(parseFloat(data[0].lat).toFixed(6)),
          lng: Number(parseFloat(data[0].lon).toFixed(6)),
          displayName: data[0].display_name,
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') throw err
    }
  }

  return null
}

export function LocationMapPicker({
  latitude,
  longitude,
  onCoordinatesChange,
  onAddressResolved,
  addressQuery = '',
  venueName = '',
  address = '',
  city = '',
  state = '',
}: LocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const autoGeocodeAbortRef = useRef<AbortController | null>(null)

  // Tracking refs to avoid infinite loops between map drag and text inputs
  const lastResolvedByMapRef = useRef<string>('')
  const lastAutoGeocodedSigRef = useRef<string>('')
  const isReverseGeocodingRef = useRef<boolean>(false)

  const [mapStyle, setMapStyle] = useState<MapStyleKey>('streets')
  const [pasteInput, setPasteInput] = useState('')
  const [pasteFeedback, setPasteFeedback] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
  } | null>(null)
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

  // Ref to onAddressResolved so Leaflet event listeners always access current callback
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

    isReverseGeocodingRef.current = true
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

      // Record signature to avoid triggering auto-geocode back on the inputs
      const mapSig = `${resolved.venueName || ''}|${resolved.address || ''}|${resolved.city || ''}|${resolved.state || ''}`.trim()
      lastResolvedByMapRef.current = mapSig
      lastAutoGeocodedSigRef.current = mapSig

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
      isReverseGeocodingRef.current = false
      setIsResolvingAddress(false)
    }
  }, [])

  const reverseGeocodeRef = useRef(fetchReverseGeocode)
  useEffect(() => {
    reverseGeocodeRef.current = fetchReverseGeocode
  }, [fetchReverseGeocode])

  // Forward Geocode executor (used both automatically and by the button)
  const executeForwardGeocode = useCallback(
    async (isAutomatic = false) => {
      const currentSig = `${venueName || ''}|${address || addressQuery || ''}|${city || ''}|${state || ''}`.trim()
      lastAutoGeocodedSigRef.current = currentSig

      if (autoGeocodeAbortRef.current) {
        autoGeocodeAbortRef.current.abort()
      }
      const controller = new AbortController()
      autoGeocodeAbortRef.current = controller

      setIsSearchingAddress(true)
      if (isAutomatic) {
        setPasteFeedback({
          type: 'info',
          message: '🔍 Ubicando dirección en el mapa...',
        })
      }

      try {
        const result = await forwardGeocodeProgressive(
          venueName,
          address || addressQuery,
          city,
          state,
          controller.signal
        )

        if (result) {
          onCoordinatesChange(result.lat, result.lng)
          if (markerRef.current) {
            markerRef.current.setLatLng([result.lat, result.lng])
          }
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([result.lat, result.lng], 16)
          }
          setPasteFeedback({
            type: 'success',
            message: `📍 Ubicado automáticamente: ${result.displayName.substring(0, 65)}...`,
          })
        } else if (!isAutomatic) {
          setPasteFeedback({
            type: 'error',
            message: 'No pudimos encontrar la ubicación exacta con ese texto. Puedes colocar el pin en el mapa.',
          })
        } else {
          // If auto search couldn't pinpoint, clear info feedback quietly
          setPasteFeedback(null)
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && !isAutomatic) {
          setPasteFeedback({
            type: 'error',
            message: 'Error al consultar la ubicación. Puedes ubicar el pin haciendo clic en el mapa.',
          })
        }
      } finally {
        setIsSearchingAddress(false)
      }
    },
    [venueName, address, addressQuery, city, state, onCoordinatesChange]
  )

  // AUTOMATIC GEOCODING: When user writes address & city in form, auto-position the pin on the map
  useEffect(() => {
    // If currently reverse geocoding from a pin drag, ignore
    if (isReverseGeocodingRef.current) return

    const currentSig = `${venueName || ''}|${address || addressQuery || ''}|${city || ''}|${state || ''}`.trim()

    // If matches the address just emitted by map reverse geocode, ignore
    if (currentSig === lastResolvedByMapRef.current) return

    // Require at least a street address (>= 4 chars) and city (>= 2 chars), or venue + city
    const hasEnough =
      ((address || addressQuery).trim().length >= 4 && city.trim().length >= 2) ||
      (venueName.trim().length >= 3 && city.trim().length >= 2)

    if (!hasEnough) return

    // If this exact text signature has already been geocoded, avoid re-fetching
    if (currentSig === lastAutoGeocodedSigRef.current) return

    // Debounce by 800ms to let user finish typing street/city without spamming requests
    const timer = setTimeout(() => {
      executeForwardGeocode(true)
    }, 800)

    return () => clearTimeout(timer)
  }, [venueName, address, addressQuery, city, state, executeForwardGeocode])

  // Switch Map Style (Calles OpenStreetMap | Satélite Esri | Nocturno CartoDB)
  const handleSwitchLayer = (styleKey: MapStyleKey) => {
    if (!mapInstanceRef.current) return
    setMapStyle(styleKey)

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current)
    }

    const conf = MAP_STYLES[styleKey]
    const newLayer = L.tileLayer(conf.url, conf.options).addTo(mapInstanceRef.current)
    tileLayerRef.current = newLayer
  }

  // Initialize Leaflet Map & Marker
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return

    // Prevent Leaflet error if container already initialized
    const container = mapContainerRef.current as any
    if (container._leaflet_id) {
      container._leaflet_id = null
    }

    // Initialize Map with zoom control
    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: hasValidCoords ? 15 : 13,
      zoomControl: true,
      attributionControl: false,
    })

    // Add initial tile layer
    const initialConf = MAP_STYLES.streets
    const initialTile = L.tileLayer(initialConf.url, initialConf.options).addTo(map)
    tileLayerRef.current = initialTile

    // Add draggable Venú Marker
    const marker = L.marker([currentLat, currentLng], {
      draggable: true,
      icon: createVenuPinIcon(),
    }).addTo(map)

    // Drag-end handler: update coordinates and reverse-geocode
    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      const fixedLat = Number(pos.lat.toFixed(6))
      const fixedLng = Number(pos.lng.toFixed(6))
      onCoordinatesChange(fixedLat, fixedLng)
      reverseGeocodeRef.current?.(fixedLat, fixedLng)
    })

    // Click on map handler: move marker and reverse-geocode
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng)
      const fixedLat = Number(e.latlng.lat.toFixed(6))
      const fixedLng = Number(e.latlng.lng.toFixed(6))
      onCoordinatesChange(fixedLat, fixedLng)
      reverseGeocodeRef.current?.(fixedLat, fixedLng)
    })

    mapInstanceRef.current = map
    markerRef.current = marker

    // Invalidate container size after mount to prevent grey/empty tile bounds
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 150)

    return () => {
      clearTimeout(timer)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (autoGeocodeAbortRef.current) {
        autoGeocodeAbortRef.current.abort()
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
      markerRef.current = null
      tileLayerRef.current = null
    }
  }, []) // Mount once

  // Sync marker position when coordinates change from outside
  useEffect(() => {
    if (hasValidCoords && markerRef.current && mapInstanceRef.current) {
      const current = markerRef.current.getLatLng()
      if (
        Math.abs(current.lat - latitude!) > 0.00001 ||
        Math.abs(current.lng - longitude!) > 0.00001
      ) {
        markerRef.current.setLatLng([latitude!, longitude!])
        mapInstanceRef.current.panTo([latitude!, longitude!])
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
        markerRef.current.setLatLng([fixedLat, fixedLng])
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([fixedLat, fixedLng], 16)
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
          markerRef.current.setLatLng([lat, lng])
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 16)
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
              Escribe la dirección arriba o arrastra el marcador para autocompletar en ambas direcciones
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

          {(venueName || address || addressQuery) && (
            <button
              type="button"
              onClick={() => executeForwardGeocode(false)}
              disabled={isSearchingAddress}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#FA4616]/40 bg-[#FA4616]/10 px-2.5 py-1 text-[11px] font-mono font-semibold text-[#FA4616] hover:bg-[#FA4616]/20 transition-colors"
              title="Buscar en el mapa según el texto escrito arriba"
            >
              {isSearchingAddress ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              <span>{isSearchingAddress ? 'Ubicando...' : 'Ubicar por texto'}</span>
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
                : pasteFeedback.type === 'info'
                ? 'bg-[#FA4616]/10 text-[#FA4616] border border-[#FA4616]/30'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
            }`}
          >
            {pasteFeedback.type === 'success' ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            ) : pasteFeedback.type === 'info' ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>{pasteFeedback.message}</span>
          </div>
        )}
      </div>

      {/* Map Container (500px as requested) */}
      <div className="relative h-[480px] sm:h-[500px] w-full overflow-hidden rounded-xl border border-[var(--border-color)] shadow-inner bg-[var(--bg-main)] z-0">
        <div ref={mapContainerRef} className="h-full w-full" />

        {/* Loading overlay when geocoding or reverse geocoding */}
        {(isResolvingAddress || isSearchingAddress) && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1001] inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-surface)] px-3 py-1 text-[11px] font-mono font-medium text-[#FA4616] border border-[#FA4616]/40 shadow-lg backdrop-blur-md animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>
              {isResolvingAddress ? 'Autocompletando dirección...' : 'Ubicando en mapa...'}
            </span>
          </div>
        )}

        {/* Layer Switcher (Calles | Satélite | Nocturno) */}
        <div className="absolute top-3 right-32 z-[1001] flex items-center bg-[var(--bg-surface)]/90 rounded-lg p-0.5 backdrop-blur-md border border-[var(--border-color)] shadow-md text-[10px] font-mono">
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
            className="absolute top-3 right-3 z-[1001] inline-flex items-center gap-1 rounded-lg bg-[var(--bg-surface)]/90 hover:bg-[var(--bg-elevated)] px-2.5 py-1 backdrop-blur-md border border-[var(--border-color)] text-[10px] font-mono text-[var(--text-primary)] hover:text-[#FA4616] transition-colors shadow-md"
            title="Ver en Google Maps externo"
          >
            <span>Google Maps</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {/* Active Coordinates Float Badge */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-[1001] flex items-center gap-2 rounded-lg bg-[var(--bg-surface)]/90 px-2.5 py-1 backdrop-blur-md border border-[var(--border-color)] text-[10px] font-mono text-[var(--text-primary)] shadow-md">
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
