import { useState, useRef, useCallback, useEffect } from 'react'
import { haversineDistance, calcCalories, calcElevationGain } from '@/lib/runCalculations'
import { useAppStore } from '@/store/useAppStore'

// Defaults usati se l'utente non ha ancora configurato le preferenze GPS
const DEFAULT_GPS_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 5000,
}
const DEFAULT_JITTER_M = 3
const DEFAULT_KEEPALIVE_MS = 2000

// Su iOS Safari, watchPosition viene throttlato in background.
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream


export function useRunTracker() {
  const { userConfig } = useAppStore()

  // Legge le preferenze GPS dall'utente (con fallback ai default)
  const gpsJitterM = userConfig?.gps_jitter_meters ?? DEFAULT_JITTER_M
  const gpsKeepalive = userConfig?.gps_keepalive ?? false
  const gpsKeepaliveMs = userConfig?.gps_keepalive_interval_ms ?? DEFAULT_KEEPALIVE_MS
  const gpsTimeout = userConfig?.gps_timeout_ms ?? DEFAULT_GPS_OPTIONS.timeout

  const gpsOptions = {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: gpsTimeout,
  }
  const [status, setStatus] = useState('idle') // idle | waiting_gps | countdown | running | paused | finished
  const [permissionStatus, setPermissionStatus] = useState('prompt') // prompt | granted | denied
  const [accuracy, setAccuracy] = useState(null)

  useEffect(() => {
    // 1. Tenta con Permissions API (Chrome/Android)
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        setPermissionStatus(result.state)
        // Ascolta cambiamenti
        result.onchange = () => setPermissionStatus(result.state)
      })
    } 
    
    // 2. Fallback per Safari/iOS: Tentativo silenzioso
    // Se il permesso è già dato, questa chiamata è quasi istantanea e non apre popup di sistema
    navigator.geolocation.getCurrentPosition(
      () => setPermissionStatus('granted'),
      (err) => {
        if (err.code === 1) setPermissionStatus('denied')
      },
      { timeout: 1000, maximumAge: Infinity } // Molto veloce, solo per controllo
    )
  }, [])
  const [elapsed, setElapsed] = useState(0)
  const [distanceM, setDistanceM] = useState(0)
  const [currentPace, setCurrentPace] = useState(null)
  const [currentSpeed, setCurrentSpeed] = useState(0)
  const [maxSpeed, setMaxSpeed] = useState(0)
  const [polyline, setPolyline] = useState([])
  const [splits, setSplits] = useState([])
  const [error, setError] = useState(null)
  const [livePosition, setLivePosition] = useState(null) // Posizione in tempo reale (lat, lng)

  const watchIdRef = useRef(null)
  const timerRef = useRef(null)
  const lastPointRef = useRef(null)
  const lastKmRef = useRef(0)
  const splitStartRef = useRef(null)
  const wakeLockRef = useRef(null)
  const userWeightKg = useRef(75)
  const iosKeepAliveRef = useRef(null) // intervallo keep-alive GPS per iOS Safari
  const gpsJitterMRef = useRef(DEFAULT_JITTER_M) // ref per leggere il jitter nel callback GPS
  
  // Refs per evitare stale closures nel callback GPS (watchPosition)
  const statusRef = useRef(status)
  const elapsedRef = useRef(elapsed)

  useEffect(() => { statusRef.current = status }, [status])
  useEffect(() => { elapsedRef.current = elapsed }, [elapsed])
  // Sincronizza il jitter nel ref ogni volta che userConfig cambia
  useEffect(() => { gpsJitterMRef.current = gpsJitterM }, [gpsJitterM])


  // Timer
  const startTimer = useCallback(() => {
    if (timerRef.current) return
    timerRef.current = setInterval(() => {
      setElapsed(s => s + 1)
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Screen Wake Lock
  const acquireWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      }
    } catch (e) {
      console.warn('WakeLock non supportato')
    }
  }, [])

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release()
      wakeLockRef.current = null
    }
  }, [])

  // Geolocation Callback — usato un ref pattern per evitare stale closure
  // onPositionRef punta sempre alla funzione più aggiornata
  // onPositionStable è stabile e viene passata a watchPosition una sola volta
  const onPositionRef = useRef(null)
  const onPositionStable = useRef((position) => {
    if (onPositionRef.current) onPositionRef.current(position)
  }).current

  onPositionRef.current = (position) => {
    const { latitude, longitude, altitude, speed, accuracy: acc } = position.coords
    setAccuracy(acc)
    
    const ts = position.timestamp
    const newPoint = { lat: latitude, lng: longitude, alt: altitude ?? 0, ts }
    
    // Aggiorniamo sempre la posizione live per la mappa
    setLivePosition({ lat: latitude, lng: longitude })

    const currentStatus = statusRef.current

    if (currentStatus === 'running') {
      if (lastPointRef.current) {
        const dist = haversineDistance(
          lastPointRef.current.lat, lastPointRef.current.lng,
          latitude, longitude
        )

        // Filtro jitter: ignora punti troppo vicini o salti anomali (usa preferenze utente)
        if (dist < gpsJitterMRef.current || dist > 150) {
          lastPointRef.current = newPoint
          return
        }

        setDistanceM(prev => {
          const newDist = prev + dist
          const currentKm = Math.floor(newDist / 1000)

          if (currentKm > lastKmRef.current && splitStartRef.current) {
            const splitElapsed = (ts - splitStartRef.current) / 1000
            setSplits(s => [...s, {
              km: currentKm,
              pace_sec: Math.round(splitElapsed),
              elapsed_sec: Math.round(elapsedRef.current)
            }])
            lastKmRef.current = currentKm
            splitStartRef.current = ts
          }
          return newDist
        })

        const dt = (ts - lastPointRef.current.ts) / 1000
        const speedMs = (speed != null && speed > 0) ? speed : (dt > 0 ? dist / dt : 0)
        
        setCurrentSpeed(speedMs)
        setMaxSpeed(prev => {
          const speedKmh = speedMs * 3.6
          return speedKmh > prev ? speedKmh : prev
        })
        if (speedMs > 0.5) {
          setCurrentPace(1000 / speedMs)
        }
      }

      lastPointRef.current = newPoint
      setPolyline(prev => [...prev, newPoint])
    } else {
      // Anche quando non stiamo registrando, aggiorniamo il last point
      // così non calcola distanze errate al riavvio
      lastPointRef.current = newPoint
    }
  }

  const onError = useCallback((err) => {
    console.error('GPS Error:', err)
    if (err.code === 1) {
      setPermissionStatus('denied')
      setError('Permesso GPS negato')
    } else {
      setError(`Errore GPS: ${err.message}`)
    }
    setStatus('idle')
  }, [])

  // Public Actions
  const requestPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocalizzazione non supportata dal browser')
      return false
    }

    // Prova a usare Permissions API se disponibile (Chrome/Android)
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' })
        if (result.state === 'denied') {
          setPermissionStatus('denied')
          setError('Permesso GPS negato nelle impostazioni del browser')
          return false
        }
      } catch (e) { /* Fallback a getCurrentPosition */ }
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        setError('Il sistema GPS non risponde. Riprova o controlla le impostazioni.')
        resolve(false)
      }, 8000)

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timeout)
          setPermissionStatus('granted')
          setAccuracy(pos.coords.accuracy)
          resolve(true)
        },
        (err) => {
          clearTimeout(timeout)
          console.error('Permission Error:', err)
          if (err.code === 1) {
            setPermissionStatus('denied')
            setError('Permesso GPS negato')
          } else {
            setError(`Errore GPS (${err.code}): ${err.message}`)
          }
          resolve(false)
        },
        { enableHighAccuracy: true, timeout: 7000 }
      )
    })
  }, [])

  const start = useCallback(async (weight = 75) => {
    userWeightKg.current = weight
    setStatus('waiting_gps')
    setError(null)
    await acquireWakeLock()
    watchIdRef.current = navigator.geolocation.watchPosition(onPositionStable, onError, gpsOptions)

    // Keep-alive GPS: configurabile dall'utente, attivo solo su iOS
    if (isIOS && gpsKeepalive && !iosKeepAliveRef.current) {
      iosKeepAliveRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          () => {},
          () => {},
          { enableHighAccuracy: true, maximumAge: 0, timeout: 3000 }
        )
      }, gpsKeepaliveMs)
    }
  }, [acquireWakeLock, onPositionStable, onError, gpsOptions, gpsKeepalive, gpsKeepaliveMs])

  const pause = useCallback(() => {
    setStatus('paused')
    stopTimer()
    // Non fermiamo watchPosition per mantenere il fix, ma smettiamo di registrare nel callback
  }, [stopTimer])

  const resume = useCallback(() => {
    setStatus('running')
    startTimer()
  }, [startTimer])

  const finish = useCallback(() => {
    setStatus('finished')
    stopTimer()
    releaseWakeLock()
    // Ferma il keep-alive iOS
    if (iosKeepAliveRef.current) {
      clearInterval(iosKeepAliveRef.current)
      iosKeepAliveRef.current = null
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [stopTimer, releaseWakeLock])

  const forceStart = useCallback(() => {
    if (status === 'waiting_gps') {
      setStatus('running')
      startTimer()
      splitStartRef.current = Date.now()
    }
  }, [status, startTimer])

  const reset = useCallback(() => {
    setStatus('idle')
    setElapsed(0)
    setDistanceM(0)
    setCurrentPace(null)
    setCurrentSpeed(0)
    setPolyline([])
    setSplits([])
    setError(null)
    lastPointRef.current = null
    lastKmRef.current = 0
    splitStartRef.current = null
    // Assicura che il keep-alive sia fermato anche in caso di reset
    if (iosKeepAliveRef.current) {
      clearInterval(iosKeepAliveRef.current)
      iosKeepAliveRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      stopTimer()
      releaseWakeLock()
      if (iosKeepAliveRef.current) clearInterval(iosKeepAliveRef.current)
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [stopTimer, releaseWakeLock])

  // Dati calcolati
  const distanceKm = distanceM / 1000
  const avgPace = distanceKm > 0 ? elapsed / distanceKm : null
  const calories = calcCalories(userWeightKg.current, elapsed)
  const elevationGain = calcElevationGain(polyline)

  return {
    status, error, elapsed, distanceKm,
    currentPace, currentSpeed, maxSpeed, avgPace, calories, elevationGain,
    polyline, splits, permissionStatus, accuracy, livePosition,
    start, pause, resume, finish, reset, requestPermission, forceStart
  }
}
