/**
 * Calcola la ripartizione tra ore ordinarie e straordinarie
 * @param {string} date - Formato YYYY-MM-DD
 * @param {string} checkIn - Formato HH:mm
 * @param {string} checkOut - Formato HH:mm
 * @param {Object} schedule - Orari previsti per giorno { monday: { start: '09:00', end: '18:00' }, ... }
 */
export function calculateOvertime(date, checkIn, checkOut, schedule) {
  if (!checkIn || !checkOut || !schedule) return { ordinary: 0, overtime: 0 }

  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' })
  const daySchedule = schedule[dayOfWeek]

  if (!daySchedule || !daySchedule.active) {
    // Se il giorno non è lavorativo, tutto è straordinario
    return { ordinary: 0, overtime: Math.max(0, diffInMinutes(checkIn, checkOut)) }
  }

  const sessionStart = timeToMinutes(checkIn)
  const sessionEnd = timeToMinutes(checkOut)
  const schedStart = timeToMinutes(daySchedule.start)
  const schedEnd = timeToMinutes(daySchedule.end)

  // Calcolo sovrapposizione (ore ordinarie)
  const overlapStart = Math.max(sessionStart, schedStart)
  const overlapEnd = Math.min(sessionEnd, schedEnd)
  
  const ordinaryMinutes = Math.max(0, overlapEnd - overlapStart)
  const totalMinutes = Math.max(0, sessionEnd - sessionStart)
  const overtimeMinutes = totalMinutes - ordinaryMinutes

  return {
    ordinary: ordinaryMinutes,
    overtime: overtimeMinutes
  }
}

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function diffInMinutes(start, end) {
  return timeToMinutes(end) - timeToMinutes(start)
}
