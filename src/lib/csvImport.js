/**
 * csvImport.js
 * Utility per parsare file CSV di movimenti bancari.
 *
 * Formato CSV supportato (separatore ; oppure ,):
 *   data;descrizione;importo;tipo;categoria
 *   23/06/2026;Lidl;-12.86;expense;Alimentari
 *   28/05/2026;Stipendio;500.00;income;Stipendio
 *
 * - data       : DD/MM/YYYY o YYYY-MM-DD
 * - descrizione: testo libero
 * - importo    : numero (virgola o punto come decimale). Negativo = uscita.
 * - tipo       : "income" | "expense" | "entrata" | "uscita" (opzionale, deriva dal segno)
 * - categoria  : testo libero (opzionale)
 */

const MAX_ROWS = 500

// ── Normalizza un importo in formato europeo o americano → float ──
function parseAmount(raw) {
  if (!raw) return NaN
  const str = raw.trim()

  // Formato europeo: punto come separatore migliaia, virgola come decimale
  // es. -1.234,56 o 1.234,56 o -12,86
  if (/^-?\d{1,3}(\.\d{3})*(,\d+)?$/.test(str)) {
    return parseFloat(str.replace(/\./g, '').replace(',', '.'))
  }

  // Formato americano: virgola come separatore migliaia, punto come decimale
  // es. -1,234.56 o 1,234.56 o -12.86
  if (/^-?\d{1,3}(,\d{3})*(\.\d+)?$/.test(str)) {
    return parseFloat(str.replace(/,/g, ''))
  }

  // Solo virgola decimale senza separatore migliaia: -12,86
  if (/^-?\d+,\d+$/.test(str)) {
    return parseFloat(str.replace(',', '.'))
  }

  // Numero semplice con punto decimale
  return parseFloat(str)
}

// ── Normalizza una data in formato ISO (YYYY-MM-DD) ──
function parseDate(raw) {
  if (!raw) return null
  const str = raw.trim()

  // DD/MM/YYYY o DD-MM-YYYY
  const itMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (itMatch) {
    const [, d, m, y] = itMatch
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
  if (isoMatch) {
    const [, y, m, d] = isoMatch
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  return null
}

// ── Normalizza il tipo transazione ──
function parseType(raw, amount) {
  if (raw) {
    const t = raw.trim().toLowerCase()
    if (['income', 'entrata', 'in', '+'].includes(t)) return 'income'
    if (['expense', 'uscita', 'out', 'spesa', '-'].includes(t)) return 'expense'
  }
  // Deriva dal segno dell'importo
  return amount < 0 ? 'expense' : 'income'
}

// ── Rileva il separatore dominante nel CSV ──
function detectSeparator(firstLine) {
  const semicolons = (firstLine.match(/;/g) || []).length
  const commas = (firstLine.match(/,/g) || []).length
  return semicolons >= commas ? ';' : ','
}

// ── Splitte una riga rispettando le virgolette ──
function splitRow(line, sep) {
  const cells = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === sep && !inQuotes) {
      cells.push(current.trim().replace(/^"|"$/g, ''))
      current = ''
    } else {
      current += ch
    }
  }
  cells.push(current.trim().replace(/^"|"$/g, ''))
  return cells
}

/**
 * Parsa il contenuto di un file CSV.
 *
 * @param {string} text - Il testo del file CSV
 * @param {Array}  categories - Le categorie esistenti dell'utente (per il matching)
 * @returns {{ rows: Array, errors: Array, totalLines: number }}
 *   rows   : movimenti validi pronti per l'insert su Supabase
 *   errors : righe con problemi { line, message, raw }
 *   totalLines: totale righe dati (senza header)
 */
export function parseCSV(text, categories = []) {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0)

  if (lines.length === 0) {
    return { rows: [], errors: [{ line: 0, message: 'File CSV vuoto', raw: '' }], totalLines: 0 }
  }

  const sep = detectSeparator(lines[0])
  const headerLine = lines[0]
  const headers = splitRow(headerLine.toLowerCase(), sep)

  // Mappa le colonne per nome (flessibile)
  const colIndex = {
    data:        headers.findIndex(h => ['data', 'date', 'data_operazione', 'data operazione'].includes(h)),
    descrizione: headers.findIndex(h => ['descrizione', 'description', 'causale', 'notes', 'note'].includes(h)),
    importo:     headers.findIndex(h => ['importo', 'amount', 'valore', 'value', 'importo (eur)', 'amount (eur)'].includes(h)),
    tipo:        headers.findIndex(h => ['tipo', 'type', 'tipologia'].includes(h)),
    categoria:   headers.findIndex(h => ['categoria', 'category', 'cat'].includes(h)),
  }

  const dataLines = lines.slice(1).slice(0, MAX_ROWS)
  const rows = []
  const errors = []

  // Costruisci una mappa lowercase delle categorie per matching veloce
  const catMap = {}
  for (const cat of categories) {
    catMap[cat.name.toLowerCase()] = cat
  }

  for (let i = 0; i < dataLines.length; i++) {
    const lineNum = i + 2 // +1 per header, +1 per 1-index
    const raw = dataLines[i]
    const cells = splitRow(raw, sep)

    // ── Estrai i campi ──
    const rawData        = colIndex.data        >= 0 ? cells[colIndex.data]        : cells[0]
    const rawDescrizione = colIndex.descrizione >= 0 ? cells[colIndex.descrizione] : cells[1]
    const rawImporto     = colIndex.importo     >= 0 ? cells[colIndex.importo]     : cells[2]
    const rawTipo        = colIndex.tipo        >= 0 ? cells[colIndex.tipo]        : cells[3]
    const rawCategoria   = colIndex.categoria   >= 0 ? cells[colIndex.categoria]   : cells[4]

    // ── Validazione data ──
    const date = parseDate(rawData)
    if (!date) {
      errors.push({ line: lineNum, message: `Data non valida: "${rawData}"`, raw })
      continue
    }

    // ── Validazione importo ──
    const amount = parseAmount(rawImporto)
    if (isNaN(amount) || amount === 0) {
      errors.push({ line: lineNum, message: `Importo non valido: "${rawImporto}"`, raw })
      continue
    }

    // ── Tipo ──
    const type = parseType(rawTipo, amount)

    // ── Importo assoluto ──
    const absAmount = Math.abs(amount)

    // ── Matching categoria ──
    const catKey = (rawCategoria || '').toLowerCase().trim()
    let matchedCat = catMap[catKey] || null

    // Se non trovata, cerca parziale
    if (!matchedCat && catKey) {
      for (const [key, cat] of Object.entries(catMap)) {
        if (cat.type === type && (key.includes(catKey) || catKey.includes(key))) {
          matchedCat = cat
          break
        }
      }
    }

    // Se ancora non trovata, usa la prima categoria del tipo corretto
    if (!matchedCat) {
      matchedCat = categories.find(c => c.type === type) || null
    }

    rows.push({
      date,
      description: (rawDescrizione || '').trim() || 'Movimento importato',
      amount: absAmount,
      type,
      category: matchedCat?.id || null,
      category_name: matchedCat?.name || rawCategoria || null,
      payment_method: 'bank', // può essere sovrascritto dal chiamante
      // Campi interni utili per la preview
      _raw_category: rawCategoria || '',
      _cat_matched: !!matchedCat,
    })
  }

  return { rows, errors, totalLines: dataLines.length }
}

/**
 * Genera il testo di un template CSV scaricabile.
 */
export function generateCSVTemplate() {
  const header = 'data;descrizione;importo;tipo;categoria'
  const examples = [
    '23/06/2026;Lidl Supermercato;-12,86;expense;Alimentari',
    '28/05/2026;Stipendio;500,00;income;Stipendio',
    '05/06/2026;Arnold\'s Restaurant;-39,50;expense;Ristoranti e bar',
    '07/03/2026;Trenitalia;-11,40;expense;Trasporti',
    '27/04/2026;Versamento Contanti;100,00;income;Entrate varie',
  ]
  return [header, ...examples].join('\n')
}

/**
 * Raggruppa le statistiche di un import.
 */
export function getImportStats(rows, errors) {
  const totalIncome = rows.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  const totalExpense = rows.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
  return {
    validCount: rows.length,
    errorCount: errors.length,
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
  }
}
