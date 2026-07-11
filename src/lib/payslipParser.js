/**
 * payslipParser.js
 * Utility per estrarre campi chiave (Netto, Lordo, Ore, Tasse, Ferie, TFR)
 * dal testo estratto da un PDF di busta paga.
 */

export function parsePayslipText(text) {
  if (!text) return null

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  
  // Trova il primo numero formattato in stile italiano/europeo (es: 433,00 o 1.234,56 o 42,00)
  const extractAmount = (str) => {
    // Regex per numeri con virgola per decimali e opzionale punto per le migliaia
    const match = str.match(/[-+]?[\d.]+(?:,\d{2})?/)
    if (!match) return null
    
    // Rimuove i punti delle migliaia e sostituisce la virgola con il punto decimale
    const cleaned = match[0].replace(/\./g, '').replace(',', '.')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? null : parsed
  }

  // Scansiona le righe cercando una parola chiave ed estrae l'importo associato
  const scanForKeyword = (keywords, checkNextLinesCount = 3) => {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase()
      if (keywords.some(kw => line.includes(kw))) {
        // 1. Prova a cercare un valore sulla stessa riga
        // Evita di catturare se la riga contiene solo la parola chiave
        const hasNumber = /\d/.test(lines[i])
        if (hasNumber) {
          // Rimuovi la parola chiave per evitare falsi positivi
          let lineMinusKw = line
          keywords.forEach(kw => { lineMinusKw = lineMinusKw.replace(kw, '') })
          const amt = extractAmount(lineMinusKw)
          if (amt !== null) return amt
        }
        
        // 2. Prova a cercare nelle righe successive
        for (let j = 1; j <= checkNextLinesCount; j++) {
          if (i + j < lines.length) {
            const nextLine = lines[i + j]
            const nextAmt = extractAmount(nextLine)
            if (nextAmt !== null) return nextAmt
          }
        }
      }
    }
    return null
  }

  // 1. Mese e Anno
  let month = null
  let year = new Date().getFullYear()

  const monthsMap = {
    gennaio: 'Gennaio', febbraio: 'Febbraio', marzo: 'Marzo', aprile: 'Aprile',
    maggio: 'Maggio', giugno: 'Giugno', luglio: 'Luglio', agosto: 'Agosto',
    settembre: 'Settembre', ottobre: 'Ottobre', novembre: 'Novembre', dicembre: 'Dicembre'
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase()
    for (const [key, value] of Object.entries(monthsMap)) {
      if (line.includes(key)) {
        month = value
        
        // Cerca l'anno (4 cifre consecutive) nella stessa riga o in quella immediatamente precedente
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

  // Fallback se il mese non viene identificato
  if (!month) {
    const currentMonthIndex = new Date().getMonth()
    month = Object.values(monthsMap)[currentMonthIndex]
  }

  // 2. Estrazione Campi Finanziari tramite parole chiave comuni delle buste paga italiane
  const netAmount = scanForKeyword(['netto in busta', 'netto da pagare', 'netto a pagare', 'netto']) || 0
  const grossAmount = scanForKeyword(['totale competenze', 'competenze', 'lordo']) || 0
  const taxes = scanForKeyword(['trattenuta irpef netta', 'irpef netta', 'trattenuta irpef lorda', 'imp. irpef', 'irpef lorda', 'imposte']) || 0
  const contributions = scanForKeyword(['totale tratt socali', 'totale tratt sociali', 'tratt socali', 'tratt sociali', 'contributi']) || 0
  const workedHours = scanForKeyword(['ore ordinarie', 'ore ordinare', 'ore lavorate', 'ore/gog num']) || 0
  const accruedVacation = scanForKeyword(['residuo', 'restano', 'ferie residue', 'ferie residuo']) || 0
  const tfrAmount = scanForKeyword(['retrbuzione per tfr', 'retribuzione per tfr', 'tfr maturato', 'tfr']) || 0

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
