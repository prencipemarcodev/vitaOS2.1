# 📍 SPECIFICA TECNICA — Modulo GPS Run Tracker
## VitaOS 2.1 — Estensione Sezione Salute

> Versione 1.0 | Data: 2026-05-14 | Autore: VitaOS Dev

---

## 1. OBIETTIVO

Aggiungere alla sezione **Salute > Corsa** la possibilità di registrare una corsa in tempo reale tramite GPS del dispositivo, tracciando automaticamente distanza, pace, velocità, dislivello e percorso geografico, senza dipendenze esterne a pagamento.

---

## 2. STACK TECNICO

| Layer              | Tecnologia                        | Costo   |
|--------------------|-----------------------------------|---------|
| GPS                | `navigator.geolocation` (Web API) | Gratis  |
| Calcolo distanza   | Formula Haversine (custom)        | Gratis  |
| Mappa live         | Leaflet.js + OpenStreetMap tiles  | Gratis  |
| Stato tracking     | Zustand (già presente)            | Gratis  |
| Persistenza        | Supabase (già presente)           | Gratis  |
| Wake Lock (schermo)| `navigator.wakeLock` (Web API)    | Gratis  |

> **Nessuna dipendenza esterna aggiuntiva a pagamento.** Leaflet è CDN-importabile o installabile via npm (`leaflet`).

---

## 3. ARCHITETTURA

### 3.1 Nuovi file

```
src/
├── hooks/
│   └── useRunTracker.js            ← cuore del GPS tracking
├── pages/Salute/
│   ├── RunTrackingScreen.jsx       ← schermata fullscreen durante la corsa
│   ├── RunSummaryModal.jsx         ← riepilogo post-corsa con mappa
│   ├── RunMap.jsx                  ← componente mappa Leaflet
│   └── RunHistoryCard.jsx          ← card per storico corse (upgrade)
└── lib/
    └── runCalculations.js          ← formule pure (Haversine, pace, MET)
```

### 3.2 Modifiche a file esistenti

| File | Modifica |
|------|----------|
| `supabase/migrations/001_initial_schema.sql` | Aggiungere colonna `run_polyline JSONB` a `workout_sessions` |
| `src/pages/Salute/index.jsx` | Aggiungere pulsante "Inizia Corsa" |
| `src/store/useHealthStore.js` | Nessuna modifica necessaria |

### 3.3 Modifica schema DB

```sql
-- Aggiungere a workout_sessions
ALTER TABLE workout_sessions
  ADD COLUMN IF NOT EXISTS run_polyline JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS run_splits JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS run_max_speed NUMERIC(6,3) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS run_elevation_gain NUMERIC(8,2) DEFAULT NULL;

-- Struttura run_polyline:
-- [{ lat: 40.8333, lng: 14.2500, alt: 12.5, ts: 1715689200000 }, ...]

-- Struttura run_splits (km splits):
-- [{ km: 1, pace_sec: 312, elapsed_sec: 312 }, ...]
```

---

## 4. HOOK PRINCIPALE — `useRunTracker.js`

```javascript
// src/hooks/useRunTracker.js
import { useState, useRef, useCallback, useEffect } from 'react'
import { haversineDistance, calcPace, calcCalories, calcElevationGain } from '@/lib/runCalculations'

const GPS_OPTIONS = {
  enableHighAccuracy: true,   // usa GPS hardware (non solo WiFi/cell)
  maximumAge: 0,              // non usare cache
  timeout: 10000,             // timeout 10s per ogni fix
}

// Filtro minima distanza per evitare drift GPS (punti "jitter")
const MIN_DISTANCE_METERS = 5

export function useRunTracker() {
  const [status, setStatus] = useState('idle') // idle | waiting_gps | running | paused | finished
  const [elapsed, setElapsed] = useState(0)      // secondi totali
  const [distanceM, setDistanceM] = useState(0)  // metri totali
  const [currentPace, setCurrentPace] = useState(null) // sec/km
  const [currentSpeed, setCurrentSpeed] = useState(0)  // m/s
  const [polyline, setPolyline] = useState([])   // array di { lat, lng, alt, ts }
  const [splits, setSplits] = useState([])       // km splits
  const [error, setError] = useState(null)

  const watchIdRef = useRef(null)
  const timerRef = useRef(null)
  const lastPointRef = useRef(null)
  const lastKmRef = useRef(0)
  const splitStartRef = useRef(null)
  const wakeLockRef = useRef(null)
  const userWeightKg = useRef(70) // default, sovrascrivibile

  // ── Timer ──────────────────────────────────────────────
  const startTimer = useCallback(() => {
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

  // ── Wake Lock (mantieni schermo acceso) ────────────────
  const acquireWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      }
    } catch (e) {
      console.warn('WakeLock non disponibile:', e)
    }
  }, [])

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release()
      wakeLockRef.current = null
    }
  }, [])

  // ── Callback GPS ───────────────────────────────────────
  const onPosition = useCallback((position) => {
    const { latitude, longitude, altitude, speed } = position.coords
    const ts = position.timestamp

    const newPoint = { lat: latitude, lng: longitude, alt: altitude ?? 0, ts }

    if (lastPointRef.current) {
      const dist = haversineDistance(
        lastPointRef.current.lat, lastPointRef.current.lng,
        latitude, longitude
      )

      // Ignora punti troppo vicini (GPS jitter) o troppo lontani (spike GPS)
      if (dist < MIN_DISTANCE_METERS || dist > 100) return

      setDistanceM(prev => {
        const newDist = prev + dist

        // Calcola km splits
        const currentKm = Math.floor(newDist / 1000)
        if (currentKm > lastKmRef.current && splitStartRef.current !== null) {
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

      // Pace istantaneo (media ultimi N punti sarebbe meglio, ma semplificato)
      const speedMs = speed ?? (dist / ((ts - lastPointRef.current.ts) / 1000))
      setCurrentSpeed(speedMs)
      if (speedMs > 0.5) { // ignora se fermo
        setCurrentPace(1000 / speedMs) // sec/km
      }
    } else {
      // Primo fix GPS: inizia split timer
      splitStartRef.current = ts
      setStatus('running')
    }

    lastPointRef.current = newPoint
    setPolyline(prev => [...prev, newPoint])
  }, [elapsed])

  const onError = useCallback((err) => {
    console.error('GPS error:', err)
    setError(`Errore GPS: ${err.message}`)
    setStatus('idle')
  }, [])

  // ── Azioni pubbliche ───────────────────────────────────
  const start = useCallback(async (weightKg = 70) => {
    userWeightKg.current = weightKg
    setStatus('waiting_gps')
    setError(null)
    await acquireWakeLock()
    startTimer()

    watchIdRef.current = navigator.geolocation.watchPosition(
      onPosition,
      onError,
      GPS_OPTIONS
    )
  }, [acquireWakeLock, startTimer, onPosition, onError])

  const pause = useCallback(() => {
    setStatus('paused')
    stopTimer()
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [stopTimer])

  const resume = useCallback(() => {
    setStatus('running')
    startTimer()
    watchIdRef.current = navigator.geolocation.watchPosition(
      onPosition, onError, GPS_OPTIONS
    )
  }, [startTimer, onPosition, onError])

  const finish = useCallback(() => {
    setStatus('finished')
    stopTimer()
    releaseWakeLock()
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [stopTimer, releaseWakeLock])

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

  // Cleanup al unmount
  useEffect(() => {
    return () => {
      stopTimer()
      releaseWakeLock()
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [stopTimer, releaseWakeLock])

  // ── Dati derivati ──────────────────────────────────────
  const distanceKm = distanceM / 1000
  const avgPace = distanceKm > 0 ? elapsed / distanceKm : null
  const calories = calcCalories(userWeightKg.current, elapsed / 60)
  const elevationGain = calcElevationGain(polyline)

  return {
    // Stato
    status,
    error,
    // Metriche live
    elapsed,
    distanceKm,
    currentPace,
    currentSpeed,
    avgPace,
    calories,
    elevationGain,
    // Dati registrati
    polyline,
    splits,
    // Azioni
    start,
    pause,
    resume,
    finish,
    reset,
  }
}
```

---

## 5. LIBRERIA CALCOLI — `runCalculations.js`

```javascript
// src/lib/runCalculations.js

const EARTH_RADIUS_M = 6371000

/**
 * Formula di Haversine — distanza in metri tra due coordinate GPS.
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return EARTH_RADIUS_M * 2 * Math.asin(Math.sqrt(a))
}

/**
 * Formatta secondi/km → "mm:ss /km"
 */
export function formatPace(secPerKm) {
  if (!secPerKm || secPerKm <= 0 || secPerKm > 3600) return '--:--'
  const min = Math.floor(secPerKm / 60)
  const sec = Math.round(secPerKm % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

/**
 * Formatta secondi → "h:mm:ss" o "mm:ss"
 */
export function formatDuration(totalSec) {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * Stima calorie bruciate.
 * Formula semplificata: MET × peso (kg) × durata (h)
 * MET corsa a ritmo moderato ≈ 8.0
 */
export function calcCalories(weightKg, durationMin, met = 8.0) {
  return Math.round((met * weightKg * (durationMin / 60)))
}

/**
 * Calcola dislivello positivo accumulato dalla polyline.
 */
export function calcElevationGain(polyline) {
  let gain = 0
  for (let i = 1; i < polyline.length; i++) {
    const diff = (polyline[i].alt ?? 0) - (polyline[i - 1].alt ?? 0)
    if (diff > 0.5) gain += diff // soglia 0.5m per filtrare rumore barometrico
  }
  return Math.round(gain)
}

/**
 * Calcola velocità media da distanza e tempo.
 */
export function calcAvgSpeed(distanceKm, durationSec) {
  if (durationSec <= 0) return 0
  return (distanceKm / (durationSec / 3600)).toFixed(1) // km/h
}

/**
 * Stima il livello di sforzo (1-5) basandosi sul pace.
 * Utile per la UI (colore, label).
 */
export function effortLevel(secPerKm) {
  if (!secPerKm) return 0
  if (secPerKm > 420) return 1  // < 2.4 m/s → jogging leggero
  if (secPerKm > 360) return 2  // corsa moderata
  if (secPerKm > 300) return 3  // corsa sostenuta
  if (secPerKm > 240) return 4  // corsa veloce
  return 5                       // sprint
}
```

---

## 6. INTEGRAZIONE SALVATAGGIO SU SUPABASE

```javascript
// In RunSummaryModal.jsx → funzione handleSave

async function saveRun({ tracker, userConfig }) {
  const payload = {
    date: new Date().toISOString().split('T')[0],
    type: 'corsa',
    duration_minutes: Math.round(tracker.elapsed / 60),
    run_distance_km: parseFloat(tracker.distanceKm.toFixed(3)),
    run_avg_pace: formatPace(tracker.avgPace),
    run_calories: tracker.calories,
    run_max_speed: parseFloat((tracker.currentSpeed * 3.6).toFixed(2)),
    run_elevation_gain: tracker.elevationGain,
    // Nuovi campi:
    run_polyline: tracker.polyline,        // JSONB
    run_splits: tracker.splits,            // JSONB
    notes: '',
  }

  const { data, error } = await supabase
    .from('workout_sessions')
    .insert(payload)
    .select()
    .single()

  if (error) throw error

  // Aggiorna total_run_km_ever in user_config
  const newTotal = (parseFloat(userConfig.total_run_km_ever) || 0) + tracker.distanceKm
  await supabase
    .from('user_config')
    .update({ total_run_km_ever: newTotal.toFixed(3) })
    .eq('id', userConfig.id)

  return data
}
```

---

## 7. COMPONENTE MAPPA — `RunMap.jsx`

```jsx
// src/pages/Salute/RunMap.jsx
// Leaflet caricato come modulo npm: npm install leaflet

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Colori traccia
const TRACK_COLOR = '#B46243'        // var(--color-primary) VitaOS
const TRACK_COLOR_LIVE = '#3d9970'   // verde per punti live

export function RunMap({ polyline = [], isLive = false, height = 300 }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const polylineRef = useRef(null)
  const markerRef = useRef(null)

  // Inizializza mappa una sola volta
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapRef.current = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
      dragging: isLive ? false : true, // durante corsa blocca drag
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(mapRef.current)

    polylineRef.current = L.polyline([], {
      color: TRACK_COLOR,
      weight: 4,
      opacity: 0.85,
    }).addTo(mapRef.current)

    // Marker posizione attuale
    markerRef.current = L.circleMarker([0, 0], {
      radius: 8,
      fillColor: TRACK_COLOR_LIVE,
      color: '#fff',
      weight: 2,
      fillOpacity: 1,
    }).addTo(mapRef.current)

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Aggiorna polyline quando arrivano nuovi punti
  useEffect(() => {
    if (!mapRef.current || polyline.length === 0) return

    const latLngs = polyline.map(p => [p.lat, p.lng])
    polylineRef.current?.setLatLngs(latLngs)

    const last = polyline[polyline.length - 1]
    markerRef.current?.setLatLng([last.lat, last.lng])

    if (isLive) {
      // Durante la corsa: centra sulla posizione attuale
      mapRef.current.setView([last.lat, last.lng], 16)
    } else if (polyline.length === 1) {
      // Prima inizializzazione: centra e zooma
      mapRef.current.fitBounds(polylineRef.current.getBounds(), { padding: [20, 20] })
    }
  }, [polyline, isLive])

  return (
    <div
      ref={containerRef}
      style={{ height, width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
    />
  )
}
```

---

## 8. FLUSSO UX — STATI DELL'APPLICAZIONE

```
[SALUTE] ──► [NUOVO ALLENAMENTO] ──► Tipo: CORSA
                                          │
                                          ▼
                                    [PERMESSO GPS]
                                     ├─ Negato → Mostra errore + istruzioni
                                     └─ Concesso ↓
                                          │
                                          ▼
                                  [WAITING FOR GPS FIX]
                                  (spinner + "Acquisizione segnale GPS...")
                                          │
                                    Primo fix ricevuto
                                          │
                                          ▼
                              ┌─────[RUNNING]─────────────────┐
                              │  • Timer incrementale          │
                              │  • Km, Pace, Speed live        │
                              │  • Mappa con traccia live      │
                              │  • Pulsanti: PAUSA | STOP      │
                              └──────────────────┬────────────┘
                                                 │
                              ┌──────────────────▼────────────┐
                              │            [PAUSED]            │
                              │  Timer fermo, GPS sospeso      │
                              │  Pulsanti: RIPRENDI | TERMINA  │
                              └──────────────────┬────────────┘
                                                 │ TERMINA
                                                 ▼
                              ┌────────[SUMMARY MODAL]─────────┐
                              │  Mappa percorso completo        │
                              │  Statistiche riepilogo          │
                              │  Km splits table                │
                              │  Pulsanti: SCARTA | SALVA       │
                              └─────────────────────────────────┘
```

---

## 9. GESTIONE PERMESSI GPS

```javascript
// Richiesta permesso prima di avviare il tracker
async function requestGPSPermission() {
  // Metodo 1: Permission API (Chrome, Edge)
  if ('permissions' in navigator) {
    const perm = await navigator.permissions.query({ name: 'geolocation' })
    if (perm.state === 'denied') {
      return { granted: false, reason: 'denied' }
    }
  }

  // Metodo 2: Test diretto (Safari, Firefox)
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve({ granted: true }),
      (err) => resolve({
        granted: false,
        reason: err.code === 1 ? 'denied' : 'unavailable'
      }),
      { timeout: 8000, maximumAge: 0 }
    )
  })
}
```

**Messaggi di errore:**

| Codice | Messaggio utente |
|--------|-----------------|
| `denied` | "Permesso GPS negato. Vai in Impostazioni > Safari/Chrome > Posizione e abilita l'accesso." |
| `unavailable` | "GPS non disponibile. Assicurati di essere all'aperto o con buon segnale." |
| `timeout` | "Acquisizione GPS lenta. Assicurati di avere segnale sufficiente." |

---

## 10. CONSIDERAZIONI SPECIFICHE PIATTAFORMA

### iOS Safari
- Il GPS funziona ma richiede **HTTPS** (Vercel lo garantisce già).
- Con schermo bloccato: il `watchPosition` continua in background **solo se** è una **PWA installata** (aggiunta alla home screen). In browser normale si sospende.
- `wakeLock` non è supportato su iOS Safari (ignorare silenziosamente).
- Soluzione: mostrare un banner "Per non interrompere il tracking, tieni lo schermo acceso" su iOS.

### Android Chrome
- GPS completo, `wakeLock` supportato.
- Il tracking continua anche in background se la scheda è aperta.

### Desktop
- Funziona solo con permesso posizione del browser/OS.
- Accuratezza bassissima (WiFi positioning). Non indicato per tracking corsa.
- Utile per testing: mostrare un disclaimer "Funzionalità ottimizzata per dispositivi mobili".

---

## 11. STRUTTURA DATI — RIEPILOGO PAYLOAD FINALE

```typescript
// Struttura completa salvata su Supabase
interface RunSession {
  // Campi esistenti
  id: string
  date: string                    // "2026-05-14"
  type: 'corsa'
  duration_minutes: number        // 35
  notes?: string

  // Campi esistenti (run)
  run_distance_km: number         // 5.234
  run_avg_pace: string            // "6:42"
  run_calories: number            // 420
  run_route?: string              // (vecchio campo testo, ora deprecato)

  // NUOVI CAMPI
  run_max_speed: number           // km/h, es. 12.4
  run_elevation_gain: number      // metri, es. 45
  run_polyline: Array<{
    lat: number                   // 40.8333
    lng: number                   // 14.2500
    alt: number                   // 12.5 (metri s.l.m.)
    ts: number                    // timestamp ms
  }>
  run_splits: Array<{
    km: number                    // 1, 2, 3...
    pace_sec: number              // secondi/km per quel km
    elapsed_sec: number           // tempo totale al completamento
  }>
}
```

---

## 12. NUOVI COMPONENTI — RIEPILOGO

| Componente | Responsabilità |
|------------|----------------|
| `useRunTracker.js` | Logica GPS, timer, calcoli, stato tracking |
| `RunTrackingScreen.jsx` | UI fullscreen durante la corsa |
| `RunSummaryModal.jsx` | Riepilogo post-corsa + salvataggio |
| `RunMap.jsx` | Mappa Leaflet (live + storico) |
| `RunHistoryCard.jsx` | Card corsa storica con mini-mappa |
| `runCalculations.js` | Formule pure (Haversine, pace, calorie) |

---

## 13. ORDINE DI SVILUPPO CONSIGLIATO

1. Migrazione DB (aggiungere colonne `run_polyline`, `run_splits`, ecc.)
2. `runCalculations.js` — formule pure, testabili in isolamento
3. `useRunTracker.js` — hook, testabile con mock geolocation
4. `RunMap.jsx` — componente mappa con Leaflet (testare con dati statici)
5. `RunTrackingScreen.jsx` — UI tracking live
6. `RunSummaryModal.jsx` — UI riepilogo + salvataggio
7. Integrazione in `Salute/index.jsx`
8. Test su dispositivo reale (Android + iOS)

---

## 14. CHECKLIST PRE-DEPLOY

- [ ] Migrazione DB eseguita su Supabase
- [ ] HTTPS attivo su Vercel (già garantito)
- [ ] Permesso GPS testato su iOS Safari + Android Chrome
- [ ] WakeLock testato (Android) + fallback messaggio (iOS)
- [ ] Mappa carica correttamente (tiles OpenStreetMap)
- [ ] Salvataggio corsa su Supabase verificato
- [ ] `total_run_km_ever` aggiornato correttamente
- [ ] Schermata tracking testata con schermo sempre acceso
- [ ] Test su rete lenta (tiles mappa con loading graceful)
- [ ] Messaggio "desktop non supportato" su schermi larghi
