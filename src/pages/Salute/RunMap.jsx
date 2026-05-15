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

export function RunMap({ polyline = [], isLive = false, height = 300 }) {
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

    // Impostiamo una vista di default iniziale (es. Roma o un punto neutro) 
    // finché non arrivano coordinate reali
    mapRef.current.setView([41.9028, 12.4964], 13)

    polylineRef.current = L.polyline([], {
      color: TRACK_COLOR,
      weight: 5,
      opacity: 0.9,
      lineJoin: 'round'
    }).addTo(mapRef.current)

    markerRef.current = L.circleMarker([0, 0], {
      radius: 7,
      fillColor: TRACK_COLOR_LIVE,
      color: '#fff',
      weight: 3,
      fillOpacity: 1,
    }).addTo(mapRef.current)

    // Forza ricalcolo dopo un attimo per sicurezza
    setTimeout(() => {
      mapRef.current?.invalidateSize()
    }, 500)

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Fix per mappa grigia (forza ricalcolo dimensioni ogni volta che cambia lo stato di visibilità)
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize()
      }
    }
    
    // Forza ricalcolo all'avvio e dopo ogni possibile transizione
    const timers = [100, 500, 1000].map(ms => setTimeout(handleResize, ms))
    
    return () => timers.forEach(t => clearTimeout(t))
  }, [isLive, polyline.length])

  // Aggiorna polyline e posizione
  useEffect(() => {
    if (!mapRef.current) return

    // Se abbiamo punti, centriamo su quelli
    if (polyline.length > 0) {
      const latLngs = polyline.map(p => [p.lat, p.lng])
      polylineRef.current?.setLatLngs(latLngs)

      const last = polyline[polyline.length - 1]
      markerRef.current?.setLatLng([last.lat, last.lng])

      if (isLive) {
        mapRef.current.setView([last.lat, last.lng], 16)
      } else if (polyline.length > 1) {
        const bounds = L.latLngBounds(latLngs)
        mapRef.current.fitBounds(bounds, { padding: [30, 30] })
      } else {
        mapRef.current.setView([last.lat, last.lng], 16)
      }
    }
  }, [polyline, isLive])

  return (
    <div
      ref={containerRef}
      className="relative z-0 shadow-inner bg-gray-100"
      style={{ height, width: '100%', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}
    />
  )
}

export default RunMap
