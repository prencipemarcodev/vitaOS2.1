import { useState, useRef, useCallback, useEffect } from 'react'
import { haversineDistance, calcCalories, calcElevationGain } from '@/lib/runCalculations'

const GPS_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 10000,
}

const MIN_DISTANCE_METERS = 6 // Filtro jitter GPS leggermente più conservativo

export function useRunTracker() {
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

  // Geolocation Callback
  const onPosition = useCallback((position) => {
    const { latitude, longitude, altitude, speed, accuracy: acc } = position.coords
    setAccuracy(acc)
    
    const ts = position.timestamp
    const newPoint = { lat: latitude, lng: longitude, alt: altitude ?? 0, ts }
    
    // Aggiorniamo sempre la posizione live per la mappa
    setLivePosition({ lat: latitude, lng: longitude })

    if (status === 'waiting_gps') {
      // Restiamo in waiting_gps finché l'utente non preme "Inizia Corsa" o triggeriamo il countdown dalla UI
      // La UI monitorerà la precisione (acc) per suggerire l'avvio
    }

    if (status === 'running') {
      if (lastPointRef.current) {
        const dist = haversineDistance(
          lastPointRef.current.lat, lastPointRef.current.lng,
          latitude, longitude
        )

        if (dist < MIN_DISTANCE_METERS || dist > 150) return

        setDistanceM(prev => {
          const newDist = prev + dist
          const currentKm = Math.floor(newDist / 1000)

          if (currentKm > lastKmRef.current && splitStartRef.current) {
            const splitElapsed = (ts - splitStartRef.current) / 1000
            setSplits(s => [...s, {
              km: currentKm,
              pace_sec: Math.round(splitElapsed),
              elapsed_sec: Math.round(elapsed)
            }])
            lastKmRef.current = currentKm
            splitStartRef.current = ts
          }
          return newDist
        })

        const speedMs = speed ?? (dist / ((ts - lastPointRef.current.ts) / 1000))
        setCurrentSpeed(speedMs)
        if (speedMs * 3.6 > maxSpeed) setMaxSpeed(speedMs * 3.6)
        
        if (speedMs > 0.6) {
          setCurrentPace(1000 / speedMs)
        }
      }
    }

    lastPointRef.current = newPoint
    if (status === 'running') {
      setPolyline(prev => [...prev, newPoint])
    }
  }, [status, elapsed, maxSpeed])

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
    watchIdRef.current = navigator.geolocation.watchPosition(onPosition, onError, GPS_OPTIONS)
  }, [acquireWakeLock, onPosition, onError])

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
  }, [])

  useEffect(() => {
    return () => {
      stopTimer()
      releaseWakeLock()
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
