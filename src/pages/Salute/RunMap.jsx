import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAppStore } from '@/store/useAppStore'

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
  const { theme } = useAppStore()
  
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const tileLayerRef = useRef(null)
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

    // Scegliamo le tessere iniziali in base al tema attivo nell'app store
    const initialUrl = theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png' // CartoDB Dark Matter
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'    // CartoDB Voyager

    tileLayerRef.current = L.tileLayer(initialUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; CartoDB'
    }).addTo(mapRef.current)

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
      if (mapRef.current) {
        mapRef.current.invalidateSize()
      }
    }, 100)

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Sincronizza dinamicamente il tema della mappa con quello di VitaOS in tempo reale
  useEffect(() => {
    if (!tileLayerRef.current) return
    const newUrl = theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
    
    tileLayerRef.current.setUrl(newUrl)
  }, [theme])

  // Fix definitivo per mappa grigia: monitora i cambi di dimensione del contenitore
  // ed esegue il fitBounds/setView iniziale SOLO quando il contenitore ha una dimensione reale > 0
  useEffect(() => {
    if (!containerRef.current || !mapRef.current) return

    const handleResize = () => {
      if (!mapRef.current) return
      mapRef.current.invalidateSize()
      
      const size = mapRef.current.getSize()
      if (size.x > 0 && size.y > 0) {
        if (polyline.length > 1) {
          const latLngs = polyline.map(p => [p.lat, p.lng])
          const bounds = L.latLngBounds(latLngs)
          mapRef.current.fitBounds(bounds, { padding: [30, 30] })
        } else {
          const currentPoint = (polyline.length > 0) ? polyline[0] : livePosition
          if (currentPoint) {
            mapRef.current.setView([currentPoint.lat, currentPoint.lng], isLive ? 16 : 15)
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
        }
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      handleResize()
    })

    resizeObserver.observe(containerRef.current)
    
    // Esegui subito se la dimensione è già disponibile
    handleResize()

    return () => resizeObserver.disconnect()
  }, [polyline, livePosition, isLive])

  // Aggiorna polyline e posizione in tempo reale
  useEffect(() => {
    if (!mapRef.current) return

    const currentPoint = (polyline.length > 0) 
      ? polyline[polyline.length - 1] 
      : livePosition

    if (currentPoint) {
      markerRef.current?.setLatLng([currentPoint.lat, currentPoint.lng])
      
      const size = mapRef.current.getSize()
      if (isLive && size.x > 0 && size.y > 0) {
        mapRef.current.setView([currentPoint.lat, currentPoint.lng], 16)
      }
    }

    if (polyline.length > 0) {
      const latLngs = polyline.map(p => [p.lat, p.lng])
      polylineRef.current?.setLatLngs(latLngs)

      const size = mapRef.current.getSize()
      if (!isLive && polyline.length > 1 && size.x > 0 && size.y > 0) {
        const bounds = L.latLngBounds(latLngs)
        mapRef.current.fitBounds(bounds, { padding: [30, 30] })
      }
    }
  }, [polyline, livePosition, isLive])

  return (
    <div
      ref={containerRef}
      className="relative z-0 shadow-inner bg-gray-100 dark:bg-zinc-900"
      style={{ height, width: '100%', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}
    />
  )
}

export default RunMap
