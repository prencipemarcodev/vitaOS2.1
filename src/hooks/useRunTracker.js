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
  const [elapsed, setElapsed] = useState(0)
  const [distanceM, setDistanceM] = useState(0)
  const [currentPace, setCurrentPace] = useState(null)
  const [currentSpeed, setCurrentSpeed] = useState(0)
  const [maxSpeed, setMaxSpeed] = useState(0)
  const [polyline, setPolyline] = useState([])
  const [splits, setSplits] = useState([])
  const [error, setError] = useState(null)

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

    if (status === 'waiting_gps') {
      if (acc < 80) { // Soglia leggermente più permissiva (da 50 a 80m)
        setStatus('running')
        startTimer()
        splitStartRef.current = ts
      }
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
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setPermissionStatus('granted')
          resolve(true)
        },
        (err) => {
          if (err.code === 1) setPermissionStatus('denied')
          resolve(false)
        },
        { timeout: 5000 }
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
    polyline, splits, permissionStatus, accuracy,
    start, pause, resume, finish, reset, requestPermission, forceStart
  }
}
