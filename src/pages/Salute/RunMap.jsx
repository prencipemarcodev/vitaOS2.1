import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Colori traccia
const TRACK_COLOR = '#ff851b'        // var(--color-primary) arancio VitaOS
const TRACK_COLOR_LIVE = '#3d9970'   // verde per posizione attuale

// Fix per icone Leaflet (spesso non caricate correttamente in Vite/Webpack)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
})

export function RunMap({ polyline = [], livePosition = null, isLive = false, height = 300 }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const polylineRef = useRef(null)
  const markerRef = useRef(null)

  // Inizializza mappa
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapRef.current = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: !isLive,
      touchZoom: !isLive,
      scrollWheelZoom: !isLive,
    })

    // Usiamo CartoDB Voyager (spesso più veloce e meno bloccato di OSM standard)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(mapRef.current)

    // Tentiamo di centrare sulla posizione reale dell'utente come default iniziale
    if (livePosition) {
      mapRef.current.setView([livePosition.lat, livePosition.lng], 15)
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 15)
        },
        () => {
          mapRef.current?.setView([41.7077, 15.9606], 13) // Fallback Monte Sant'Angelo
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    }

    polylineRef.current = L.polyline([], {
      color: TRACK_COLOR,
      weight: 5,
      opacity: 0.9,
      lineJoin: 'round'
    }).addTo(mapRef.current)

    // Inizializza marker sulla livePosition se disponibile, altrimenti a 0,0 temporaneamente
    const startPos = livePosition ? [livePosition.lat, livePosition.lng] : [0, 0]
    markerRef.current = L.circleMarker(startPos, {
      radius: 7,
      fillColor: TRACK_COLOR_LIVE,
      color: '#fff',
      weight: 3,
      fillOpacity: 1,
    }).addTo(mapRef.current)

    // Forza ricalcolo dopo un attimo per sicurezza
    setTimeout(() => {
      mapRef.current?.invalidateSize()
    }, 100)

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Fix definitivo per mappa grigia: monitora i cambi di dimensione del contenitore
  useEffect(() => {
    if (!containerRef.current || !mapRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize()
      }
    })

    resizeObserver.observe(containerRef.current)

    return () => resizeObserver.disconnect()
  }, [])

  // Aggiorna polyline e posizione
  useEffect(() => {
    if (!mapRef.current) return

    // Aggiorniamo il marker: diamo priorità all'ultimo punto della polyline, 
    // ma usiamo livePosition se la polyline è ancora vuota.
    const currentPoint = (polyline.length > 0) 
      ? polyline[polyline.length - 1] 
      : livePosition

    if (currentPoint) {
      markerRef.current?.setLatLng([currentPoint.lat, currentPoint.lng])
      
      if (isLive) {
        mapRef.current.setView([currentPoint.lat, currentPoint.lng], 16)
      }
    }

    // Aggiorniamo la traccia
    if (polyline.length > 0) {
      const latLngs = polyline.map(p => [p.lat, p.lng])
      polylineRef.current?.setLatLngs(latLngs)

      if (!isLive && polyline.length > 1) {
        const bounds = L.latLngBounds(latLngs)
        mapRef.current.fitBounds(bounds, { padding: [30, 30] })
      }
    }
  }, [polyline, livePosition, isLive])

  return (
    <div
      ref={containerRef}
      className="relative z-0 shadow-inner bg-gray-100"
      style={{ height, width: '100%', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}
    />
  )
}

export default RunMap
