import { format } from 'date-fns'

/**
 * Calcola la Pasqua usando l'algoritmo di Meeus/Jones/Butcher
 */
export function getEaster(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

/**
 * Ritorna le festività italiane per un dato anno
 */
export function getItalianHolidays(year) {
  const easter = getEaster(year)
  const easterMonday = new Date(easter)
  easterMonday.setDate(easter.getDate() + 1)

  return {
    [`${year}-01-01`]: 'Capodanno',
    [`${year}-01-06`]: 'Epifania',
    [format(easter, 'yyyy-MM-dd')]: 'Pasqua',
    [format(easterMonday, 'yyyy-MM-dd')]: 'Lunedì dell\'Angelo',
    [`${year}-04-25`]: 'Liberazione',
    [`${year}-05-01`]: 'Festa del Lavoro',
    [`${year}-06-02`]: 'Festa della Repubblica',
    [`${year}-08-15`]: 'Ferragosto',
    [`${year}-11-01`]: 'Ognissanti',
    [`${year}-12-08`]: 'Immacolata',
    [`${year}-12-25`]: 'Natale',
    [`${year}-12-26`]: 'S. Stefano',
  }
}

/**
 * Controlla se una data è festiva
 */
export function isHoliday(date) {
  const holidays = getItalianHolidays(date.getFullYear())
  const key = format(date, 'yyyy-MM-dd')
  return holidays[key] || null
}
