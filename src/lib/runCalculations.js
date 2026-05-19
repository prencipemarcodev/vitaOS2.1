/**
 * runCalculations.js
 * Funzioni matematiche e di formattazione per il GPS Run Tracker
 */

const EARTH_RADIUS_M = 6371000

/**
 * Formula di Haversine — calcola la distanza in metri tra due punti GPS.
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
 * Formatta secondi/km (numero) in stringa "mm:ss /km"
 */
export function formatPace(secPerKm) {
  if (!secPerKm || isNaN(secPerKm) || secPerKm <= 0 || secPerKm > 3600) return '--:--'
  const min = Math.floor(secPerKm / 60)
  const sec = Math.round(secPerKm % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

/**
 * Formatta i secondi totali in stringa tempo leggibile
 * "h:mm:ss" o "mm:ss"
 */
export function formatDuration(totalSec) {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = Math.round(totalSec % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * Stima delle calorie bruciate
 * Formula: MET (8.0 per corsa) * peso (kg) * durata (h)
 */
export function calcCalories(weightKg, durationSec, met = 8.0) {
  if (!weightKg || !durationSec) return 0
  const durationH = durationSec / 3600
  return Math.round(met * weightKg * durationH)
}

export function calcElevationData(polyline) {
  if (!polyline || polyline.length < 2) return { gain: 0, loss: 0 }
  let gain = 0
  let loss = 0
  for (let i = 1; i < polyline.length; i++) {
    const diff = (polyline[i].alt || 0) - (polyline[i - 1].alt || 0)
    if (diff > 2.0) { // Filtro rumore GPS
      gain += diff
    } else if (diff < -2.0) {
      loss += Math.abs(diff)
    }
  }
  return { gain: Math.round(gain), loss: Math.round(loss) }
}

/**
 * Calcola la velocità media in km/h
 */
export function calcAvgSpeed(distanceKm, durationSec) {
  if (durationSec <= 0 || !distanceKm) return 0
  return parseFloat((distanceKm / (durationSec / 3600)).toFixed(1))
}
