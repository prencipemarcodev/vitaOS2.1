import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns'
import { it } from 'date-fns/locale'

/* ── Currency ── */
export function formatCurrency(amount, compact = false) {
  if (compact && Math.abs(amount) >= 1000) {
    return `€${(amount / 1000).toFixed(1)}k`
  }
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount)
}

/* ── Duration from minutes ── */
export function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/* ── Date ── */
export function formatDate(dateStr, fmt = 'd MMMM yyyy') {
  if (!dateStr) return ''
  return format(new Date(dateStr), fmt, { locale: it })
}

export function formatDateShort(dateStr) {
  return formatDate(dateStr, 'd MMM')
}

export function formatRelative(dateStr) {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: it })
}

/* ── Time ── */
export function minutesBetween(timeFrom, timeTo) {
  const [fh, fm] = timeFrom.split(':').map(Number)
  const [th, tm] = timeTo.split(':').map(Number)
  return (th * 60 + tm) - (fh * 60 + fm)
}

/* ── Monthly comparison ── */
/**
 * Confronta due mesi di dati e restituisce delta e direzione.
 * @param {number} current
 * @param {number} previous
 * @param {'finance'|'work'} type  — determina se "up" è beter o worse
 * @param {'income'|'expense'|'hours'} subtype
 */
export function compareMonths(current, previous, subtype = 'hours') {
  if (previous === 0 && current === 0) return { delta: 0, pct: 0, direction: 'equal', isBetter: true }
  const delta = current - previous
  const pct = previous !== 0 ? (delta / previous) * 100 : 0
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'equal'

  // "Meglio" dipende dal contesto
  let isBetter
  if (subtype === 'expense') isBetter = direction === 'down'  // meno spese = meglio
  else if (subtype === 'income') isBetter = direction === 'up'  // più entrate = meglio
  else if (subtype === 'hours') isBetter = direction === 'up'   // più ore = meglio
  else isBetter = direction === 'up'

  return { delta, pct, direction, isBetter }
}

/* ── KPI delta display ── */
export function formatDelta(delta, isAmount = true) {
  const sign = delta >= 0 ? '+' : ''
  if (isAmount) return `${sign}${formatCurrency(delta)}`
  return `${sign}${formatDuration(Math.round(Math.abs(delta) * 60))}${delta < 0 ? ' meno' : ''}`
}
