/**
 * payslipParser.js
 * Utility per estrarre campi chiave (Netto, Lordo, Ore, Tasse, Ferie, TFR)
 * dal testo estratto da un PDF di busta paga (digitale o tramite OCR).
 */

export function parsePayslipText(text) {
  if (!text) return null

  // Normalizza le righe
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  
  const isCalendarLine = (str) => {
    return /\b[0-9a-zA-Z]{2}\s*(Lu|Ma|Me|Gi|Ve|Sa|Do|D0|G1|EG)\b/i.test(str)
  }

  // Trova tutti i numeri formattati in stile italiano/europeo in una stringa
  // e ritorna il primo numero valido che non sia un codice gestionale.
  const extractAmount = (str, rangeMin = 0, rangeMax = 999999) => {
    // Se la riga corrisponde al calendario presenze, la escludiamo a priori
    if (isCalendarLine(str)) return null

    // Trova numeri con virgola o punto per decimali ed eventuali spazi inseriti dall'OCR (es. "433, 00" o "2, 00")
    const matches = str.match(/[-+]?[\d.]+(?:\s*,\s*\d{2})?/g)
    if (!matches) return null
    
    for (const m of matches) {
      // Pulisci il numero rimuovendo gli spazi e formattandolo per parseFloat
      const cleaned = m.replace(/\s+/g, '').replace(/\./g, '').replace(',', '.')
      const parsed = parseFloat(cleaned)
      if (isNaN(parsed)) continue
      
      // Salta i codici gestionali comuni (es: 8801 per TFR, 0001, 0201, matricole, CAP)
      const absVal = Math.floor(parsed)
      if ([8801, 1, 2, 4, 1000, 2000, 71037, 7103, 3109, 9743, 8992, 3430].includes(absVal)) {
        continue
      }
      
      // Salta numeri di 4 cifre esatte senza decimali (spesso codici anno o voci)
      if (/^\d{4}$/.test(m.trim())) {
        continue
      }
      
      // Controlla il range di verosimiglianza
      if (parsed >= rangeMin && parsed <= rangeMax) {
        return parsed
      }
    }
    return null
  }

  // Scansiona le righe cercando parole chiave con corrispondenza flessibile (refusi OCR)
  const scanForKeyword = (keywords, excludeKeywords = [], rangeMin = 0, rangeMax = 999999, checkNextLinesCount = 5) => {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase()
      
      // Verifica se la riga contiene una delle parole chiave
      const hasKeyword = keywords.some(kw => line.includes(kw))
      // Esclude righe contenenti parole indesiderate
      const hasExclude = excludeKeywords.some(ex => line.includes(ex))
      
      if (hasKeyword && !hasExclude) {
        // 1. Cerca prima un valore numerico sulla stessa riga
        const hasNumber = /\d/.test(lines[i])
        if (hasNumber) {
          let lineMinusKw = line
          keywords.forEach(kw => { lineMinusKw = lineMinusKw.replace(kw, '') })
          const amt = extractAmount(lineMinusKw, rangeMin, rangeMax)
          if (amt !== null) return amt
        }
        
        // 2. Cerca nelle righe immediatamente successive
        for (let j = 1; j <= checkNextLinesCount; j++) {
          if (i + j < lines.length) {
            const nextLine = lines[i + j]
            const nextAmt = extractAmount(nextLine, rangeMin, rangeMax)
            if (nextAmt !== null) return nextAmt
          }
        }
      }
    }
    return null
  }

  // 1. Estrazione Mese e Anno
  let month = null
  let year = new Date().getFullYear()

  const monthsMap = {
    gennaio: 'Gennaio', febbraio: 'Febbraio', marzo: 'Marzo', aprile: 'Aprile',
    maggio: 'Maggio', giugno: 'Giugno', luglio: 'Luglio', agosto: 'Agosto',
    settembre: 'Settembre', ottobre: 'Ottobre', novembre: 'Novembre', dicembre: 'Dicembre'
  }

  // Cerca il mese e l'anno associato
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase()
    for (const [key, value] of Object.entries(monthsMap)) {
      if (line.includes(key)) {
        month = value
        
        // Cerca l'anno (4 cifre esatte, es. 2026)
        const yearMatch = lines[i].match(/\b20\d{2}\b/)
        if (yearMatch) {
          year = parseInt(yearMatch[0], 10)
        } else if (i > 0) {
          const prevYearMatch = lines[i - 1].match(/\b20\d{2}\b/)
          if (prevYearMatch) year = parseInt(prevYearMatch[0], 10)
        }
        break
      }
    }
    if (month) break
  }

  if (!month) {
    const currentMonthIndex = new Date().getMonth()
    month = Object.values(monthsMap)[currentMonthIndex]
  }

  // 2. Estrazione Campi Finanziari con tolleranza OCR e range di plausibilità

  // NETTO: Rilevamento prioritario (Netto in Busta o Netto a pagare)
  let netAmount = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase().trim()
    if (line === 'netto' || line === 'netto a pagare' || line === 'netto da pagare' || line === 'netto in busta' || line === 'netto dipendente') {
      for (let j = 1; j <= 3; j++) {
        if (i + j < lines.length) {
          const val = extractAmount(lines[i + j], 100, 10000) // Un netto plausibile è tra 100€ e 10000€
          if (val !== null) {
            netAmount = val
            break
          }
        }
      }
    }
    if (netAmount) break
  }

  if (!netAmount) {
    netAmount = scanForKeyword(['netto a pagare', 'netto da pagare', 'netto in busta', 'netto', 'nello', 'neto', 'neta'], [], 100, 10000) || 0
  }

  // LORDO / COMPETENZE (Escludiamo netto o trattenute)
  const grossAmount = scanForKeyword(['totale competenze', 'tot. competenze', 'competenze', 'lordo', 'lorda'], ['netto', 'trattenute'], 100, 15000) || 0

  // IMPOSTE (IRPEF NETTA / PAGATA) - Escludiamo "lorda" e "imponibile" per prendere solo il netto delle trattenute
  const taxes = scanForKeyword(
    ['trattenuta irpef netta', 'irpef netta', 'ritenuta irpef pagata', 'ritenuta irpef', 'irpef pagata', 'imp. irpef', 'tasse', 'imposte'],
    ['lorda', 'imponibile', 'imponbile'],
    5, 5000
  ) || scanForKeyword(['trattenuta irpef lorda', 'irpef lorda'], [], 5, 5000) || 0

  // CONTRIBUTI (Priorità a "contributi" rispetto ai totali per evitare rumore del calendario)
  const contributions = scanForKeyword(['contributi', 'contrib.', 'totale tratt sociali', 'tratt sociali', 'totale tratt socali', 'tratt socali'], [], 5, 2000) || 0

  // ORE ORDINARIE LAVORATE (Filtriamo per un valore plausibile, es. da 10 a 200 ore)
  const workedHours = scanForKeyword(['ore ordinarie', 'ore ordinare', 'ore ordinari', 'ore ord.'], [], 10, 250) || 
                      scanForKeyword(['ore lavorate', 'ore/og num', 'ore/gog num', 'ore'], ['cod', 'giustificat', 'matr'], 10, 250) || 0

  // FERIE RESIDUE (Escludiamo contesto TFR, Anzianità ed escludiamo righe con TFR prima)
  let accruedVacation = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase()
    const isVacationKeyword = ['residuo', 'residui', 'residu', 'restano', 'ferie residue'].some(kw => line.includes(kw))
    const hasTfrContext = (i > 0 && lines[i-1].toLowerCase().includes('tfr')) || 
                          (i > 1 && lines[i-2].toLowerCase().includes('tfr')) || 
                          line.includes('tfr')
    const hasExclude = ['anzianita', '8801', 'anno'].some(ex => line.includes(ex))
    
    if (isVacationKeyword && !hasTfrContext && !hasExclude) {
      // Controlla le righe successive
      for (let j = 1; j <= 4; j++) {
        if (i + j < lines.length) {
          const val = extractAmount(lines[i + j], -50, 350)
          if (val !== null) {
            accruedVacation = val
            break
          }
        }
      }
      if (accruedVacation) break
    }
  }

  // QUOTA TFR ACCANTONATO
  let tfrAmount = scanForKeyword(['tfr maturato', 'quota tfr', 'tfr'], ['retribuzione', 'retrbuzione', 'imponibile', 'imponbile', 'residuo', '8801'], 10, 600) || 0
  
  // Heuristica speciale per TFR in scansioni colonnate:
  // Se TFR è 0, cerca all'indietro a partire dalla riga "totale competenze" per trovare il primo valore numerico nel range plausibile del TFR (5% - 10% del lordo)
  if (tfrAmount === 0) {
    let compIndex = -1
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase()
      if (line.includes('totale competenze') || line.includes('tot. competenze')) {
        compIndex = i
        break
      }
    }
    if (compIndex > 0) {
      const tfrMin = grossAmount > 0 ? grossAmount * 0.05 : 10
      const tfrMax = grossAmount > 0 ? grossAmount * 0.10 : 300
      for (let i = compIndex - 1; i >= 0 && i >= compIndex - 80; i--) {
        const line = lines[i].toLowerCase()
        const hasTfrExcludes = ['ctr', 'contributi', 'contrib', 'irpef', 'trattenuta', 'add.'].some(ex => line.includes(ex))
        if (hasTfrExcludes) continue

        const val = extractAmount(lines[i], tfrMin, tfrMax)
        if (val !== null) {
          tfrAmount = val
          break
        }
      }
    }
  }

  return {
    month,
    year,
    netAmount,
    grossAmount,
    taxes,
    contributions,
    workedHours,
    accruedVacation,
    tfrAmount
  }
}


