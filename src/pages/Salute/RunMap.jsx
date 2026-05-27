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
  const polylineRef = useRef(null)
  const markerRef = useRef(null)

  // Inizializza mappa Leaflet
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapRef.current = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: !isLive,
      touchZoom: !isLive,
      scrollWheelZoom: !isLive,
    })

    // Usiamo il server ufficiale OpenStreetMap (tile.openstreetmap.org)
    // Questo server è al 100% gratuito e non viene MAI bloccato dagli adblocker/content-blocker su Safari e Mobile!
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
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

    // Forza ricalcolo immediato per evitare mappa grigia
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

  // Monitora le dimensioni del contenitore (ResizeObserver) per un dimensionamento perfetto nei modal
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

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(containerRef.current)
    handleResize()

    return () => resizeObserver.disconnect()
  }, [polyline, livePosition, isLive])

  // Aggiorna percorso e posizione in tempo reale
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
      className="relative w-full z-0 overflow-hidden shadow-inner bg-gray-100 dark:bg-zinc-900"
      style={{ height, borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)' }}
    >
      {/* 
        HACK DI DESIGN PREMIUM:
        Per garantire il tema scuro senza usare domini esterni potenzialmente bloccati,
        applichiamo un filtro CSS invertitore SOLO al pannello delle tessere stradali (tile-pane).
        In questo modo, la mappa si trasforma in uno splendido stile dark, ma la nostra linea arancione
        e il marker verde NON vengono invertiti e conservano i loro colori brillanti originali!
      */}
      <style>{`
        .dark .leaflet-tile-pane {
          filter: invert(1) hue-rotate(180deg) brightness(0.85) contrast(1.2) !important;
        }
      `}</style>
    </div>
  )
}

export default RunMap
