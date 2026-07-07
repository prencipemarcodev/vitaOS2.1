/**
 * excelImport.js
 * Utility per il parsing di estratti conto bancari in formato Excel (.xls, .xlsx) e CSV.
 * Legge direttamente il file sul client senza worker esterni.
 */

import * as XLSX from 'xlsx'
import { isSavingsTransaction } from './pdfImport' // riutilizziamo la stessa logica di matching

/**
 * Converte il seriale data di Excel in stringa "YYYY-MM-DD".
 * Gestisce sia numeri (seriale Excel) sia stringhe di date standard.
 */
export function parseExcelDate(val) {
  if (!val) return null

  // Se è un numero (seriale Excel)
  if (typeof val === 'number' || !isNaN(Number(val))) {
    const serial = Number(val)
    const excelEpoch = new Date(Date.UTC(1899, 11, 30))
    const date = new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000)
    return date.toISOString().split('T')[0]
  }

  // Se è già una stringa (es. "dd/mm/yyyy" o "dd.mm.yyyy")
  const str = String(val).trim()
  const ddmmyyyy = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // Fallback ISO o null
  try {
    const d = new Date(str)
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0]
    }
  } catch (e) {}

  return null
}

/**
 * Parsa un importo in modo robusto (gestisce float nativi, stringhe con virgola ecc.)
 */
export function parseExcelAmount(val) {
  if (val === undefined || val === null || val === '') return null
  if (typeof val === 'number') return val

  const str = String(val).trim()
  // Rimuovi spazi e valuta se presente
  const clean = str.replace(/[€\s]/g, '')
  
  // Se ha sia punto che virgola (es. 1.234,56), rimuovi i punti e usa la virgola come decimale
  if (clean.includes('.') && clean.includes(',')) {
    return parseFloat(clean.replace(/\./g, '').replace(',', '.'))
  }
  // Se ha solo la virgola (es. -12,34 o 1234,56), converti in punto
  if (clean.includes(',')) {
    return parseFloat(clean.replace(',', '.'))
  }
  
  return parseFloat(clean)
}

/**
 * Legge un file Excel (o CSV) dal browser e restituisce le transazioni estratte.
 *
 * @param {File} file - Il file caricato dall'utente (.xls, .xlsx, .csv)
 * @param {Array} categories - Categorie dell'utente per il matching
 * @returns {Promise<{ rows: Array, errors: Array, totalLines: number }>}
 */
export function parseExcelStatement(file, categories = []) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        // Prendi il primo foglio di lavoro
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // Esporta in formato array di array (raw: true per mantenere i seriali delle date)
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true })

        const rows = []
        const errors = []

        // Mappa categorie dell'utente per matching veloce
        const safeCategories = Array.isArray(categories) ? categories : []
        const catMap = {}
        for (const cat of safeCategories) {
          if (cat && cat.name) {
            catMap[cat.name.toLowerCase().trim()] = cat
          }
        }

        // 1. Identifica l'indice delle colonne analizzando le righe alla ricerca dell'header
        let headerRowIdx = -1
        let colIndices = {
          date: -1,
          desc: -1,
          category: -1,
          amount: -1,
        }

        for (let i = 0; i < rawRows.length; i++) {
          const r = rawRows[i]
          if (!Array.isArray(r)) continue

          // Normalizza in stringhe per la ricerca
          const cells = r.map(c => String(c || '').toLowerCase().trim())
          
          // Cerca colonne chiave gestendo in modo sicuro eventuali elementi undefined (array sparsi)
          const dateIdx = cells.findIndex(c => c === 'data')
          const descIdx = cells.findIndex(c => c === 'operazione' || c === 'descrizione' || c === 'dettagli')
          const catIdx = cells.findIndex(c => c && typeof c === 'string' && c.includes('categoria'))
          const amountIdx = cells.findIndex(c => c === 'importo' || c === 'valore' || c === 'ammontare')

          if (dateIdx !== -1 && amountIdx !== -1) {
            headerRowIdx = i
            colIndices = {
              date: dateIdx,
              desc: descIdx !== -1 ? descIdx : 1, // Fallback colonna successiva
              category: catIdx !== -1 ? catIdx : -1,
              amount: amountIdx,
            }
            break
          }
        }

        if (headerRowIdx === -1) {
          reject(new Error("Formato Excel non riconosciuto. Assicurati che contenga le colonne 'Data' e 'Importo'."))
          return
        }

        // 2. Parsa le righe successive all'header
        let processedLines = 0
        for (let i = headerRowIdx + 1; i < rawRows.length; i++) {
          const r = rawRows[i]
          if (!r || r.length === 0) continue

          const rawDate = r[colIndices.date]
          const rawAmount = r[colIndices.amount]

          if (rawDate === undefined || rawDate === null || rawDate === '' || rawAmount === undefined || rawAmount === null || rawAmount === '') {
            // Riga vuota o riga finale informativa, la saltiamo senza segnalare errore se non c'è proprio nulla
            if (!rawDate && !rawAmount) continue
            errors.push({ line: i + 1, message: 'Dati mancanti in Data o Importo', raw: JSON.stringify(r) })
            continue
          }

          processedLines++
          try {
            const date = parseExcelDate(rawDate)
            const amount = parseExcelAmount(rawAmount)

            if (!date) {
              errors.push({ line: i + 1, message: `Data non valida: "${rawDate}"`, raw: JSON.stringify(r) })
              continue
            }

            if (amount === null || isNaN(amount)) {
              errors.push({ line: i + 1, message: `Importo non valido: "${rawAmount}"`, raw: JSON.stringify(r) })
              continue
            }

            const type = amount < 0 ? 'expense' : 'income'
            const absAmount = Math.abs(amount)
            
            // Descrizione
            const description = r[colIndices.desc] ? String(r[colIndices.desc]).trim() : 'Movimento importato'

            // Categoria
            const rawCategory = colIndices.category !== -1 && r[colIndices.category] ? String(r[colIndices.category]).trim() : ''
            const catKey = rawCategory.toLowerCase().trim()
            let matchedCat = catMap[catKey] || null

            // Matching parziale categoria
            if (!matchedCat && catKey) {
              for (const [key, cat] of Object.entries(catMap)) {
                if (cat && cat.type === type && (key.includes(catKey) || catKey.includes(key))) {
                  matchedCat = cat
                  break
                }
              }
            }

            // Fallback categoria
            if (!matchedCat) {
              matchedCat = safeCategories.find(c => c && c.type === type) || null
            }

            rows.push({
              date,
              description,
              amount: absAmount,
              type,
              category: matchedCat?.id || null,
              category_name: matchedCat?.name || rawCategory || null,
              payment_method: 'bank',
              _raw_category: rawCategory,
              _cat_matched: !!matchedCat && catKey !== '',
              _is_savings: isSavingsTransaction(description, rawCategory),
            })

          } catch (err) {
            errors.push({ line: i + 1, message: `Errore parsing: ${err.message}`, raw: JSON.stringify(r) })
          }
        }

        resolve({ rows, errors, totalLines: processedLines })

      } catch (err) {
        reject(err)
      }
    }

    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}
