/**
 * pdfImport.js
 * Parser specifico per estratti conto nel formato standard osservato:
 *
 *   DD.MM.YYYY  Descrizione Commerciante  SI  Categoria  €  ±X,XX
 *
 * Esempi reali:
 *   23.06.2026 Cotrap Bari SI Trasporti varie € -2,60
 *   28.05.2026 Bonifico istantaneo disposto da Xxxxxx Xxxxxxx SI Stipendi e pensioni € 500,00
 *   05.06.2026 Accantonamento sul Salvadanaio SI Investimenti, BDR e Salvadanaio € -151,00
 *
 * I movimenti verso/dal Salvadanaio (BDR) sono transferimenti interni e vengono
 * separati dai movimenti regolari con il flag _is_savings.
 */

import * as pdfjsLib from 'pdfjs-dist'
import PDFWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker'

// Inizializza il worker in modo nativo tramite Vite usando workerPort.
// Questo crea un vero Worker del browser locale senza problemi di cross-origin o CDN.
pdfjsLib.GlobalWorkerOptions.workerPort = new PDFWorker()

// ── Regex principale: rileva una riga di transazione ──────────────────────────
// Formato: DD.MM.YYYY [testo...] € [-]X,XX
// Il segno può stare dentro l'importo oppure manca (sempre positivo)
const TX_LINE_RE = /(\.\d{2}\.\d{4}|\d{2}\.\d{2}\.\d{4})\s+([\s\S]*?)\s+€\s*([-+]?[\d.]+,\d{2})/g

// ── Keywords che identificano movimenti verso/dal Salvadanaio ─────────────────
const SAVINGS_DESC_KW = ['accantonamento', 'salvadanaio', 'arrotondamento operazioni', 'movimento salvadanaio']
const SAVINGS_CAT_KW = ['bdr', 'salvadanaio', 'investimenti', 'disinvestimenti']

/**
 * Determina se un movimento è un trasferimento verso/dal Salvadanaio (BDR).
 * Questi sono trasferimenti interni e non vere entrate/uscite.
 *
 * @param {string} description
 * @param {string} rawCategory
 * @returns {boolean}
 */
export function isSavingsTransaction(description, rawCategory) {
  const desc = (description || '').toLowerCase()
  const cat = (rawCategory || '').toLowerCase()
  return (
    SAVINGS_DESC_KW.some(kw => desc.includes(kw)) ||
    SAVINGS_CAT_KW.some(kw => cat.includes(kw))
  )
}

/**
 * Estrae il testo grezzo da un file PDF mantenendo l'ordine delle righe.
 * Raggruppa i frammenti di testo per coordinata Y (riga PDF).
 *
 * @param {File} file - Il file PDF caricato dall'utente
 * @param {function} onProgress - Callback(pagesDone, totalPages)
 * @returns {Promise<string>}
 */
export async function extractTextFromPDF(file, onProgress) {
  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise

  const totalPages = pdf.numPages
  let fullText = ''

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()

    // Raggruppa i frammenti per coordinata Y (con tolleranza 3pt per la stessa riga)
    const lineMap = new Map()

    const items = content && Array.isArray(content.items) ? content.items : []
    for (const item of items) {
      if (!item.str) continue
      const y = Math.round(item.transform[5] / 3) * 3  // snap a griglia 3pt
      const x = item.transform[4]

      if (!lineMap.has(y)) lineMap.set(y, [])
      lineMap.get(y).push({ x, str: item.str })
    }

    // Ordina le righe dall'alto verso il basso (Y decrescente in coordinate PDF)
    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a)

    for (const y of sortedYs) {
      const lineItems = lineMap.get(y).sort((a, b) => a.x - b.x)
      const lineText = lineItems.map(i => i.str).join(' ').trim()
      if (lineText) fullText += lineText + '\n'
    }

    onProgress?.(pageNum, totalPages)
  }

  return fullText
}

/**
 * Converte "DD.MM.YYYY" → "YYYY-MM-DD"
 */
function parseDate(raw) {
  const [d, m, y] = raw.split('.')
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

/**
 * Converte un importo in formato italiano (es. "-1.234,56") → float
 */
function parseItalianAmount(raw) {
  return parseFloat(raw.trim().replace(/\./g, '').replace(',', '.'))
}

/**
 * Pulisce la descrizione estraendo solo la parte prima di " SI " 
 * e rimuovendo eventuali residui di categoria.
 */
function extractDescription(rawMiddle) {
  // Cerca " SI " nel testo (indicatore di stato della transazione)
  const siIdx = rawMiddle.indexOf(' SI ')
  if (siIdx > 0) {
    return rawMiddle.substring(0, siIdx).trim()
  }
  // Fallback: prendi tutto il testo escludendo parole tipicamente di categoria
  return rawMiddle.trim()
}

/**
 * Estrae la categoria dalla parte tra "SI" e "€"
 */
function extractCategory(rawMiddle) {
  const siIdx = rawMiddle.indexOf(' SI ')
  if (siIdx >= 0) {
    return rawMiddle.substring(siIdx + 4).trim()
  }
  return ''
}

/**
 * Parsa il testo estratto dal PDF e restituisce le transazioni.
 *
 * @param {string} text - Testo grezzo estratto dal PDF
 * @param {Array}  categories - Categorie dell'utente per il matching
 * @returns {{ rows: Array, errors: Array, totalLines: number }}
 */
export function parseBankStatementText(text, categories = []) {
  const rows = []
  const errors = []

  // Mappa categorie dell'utente (lowercase) per matching veloce
  const safeCategories = Array.isArray(categories) ? categories : []
  const catMap = {}
  for (const cat of safeCategories) {
    if (cat && cat.name) {
      catMap[cat.name.toLowerCase().trim()] = cat
    }
  }

  // Reset del lastIndex per sicurezza
  TX_LINE_RE.lastIndex = 0

  let match
  let lineCount = 0

  while ((match = TX_LINE_RE.exec(text)) !== null) {
    lineCount++
    const [, rawDate, rawMiddle, rawAmount] = match

    try {
      const date = parseDate(rawDate)
      const amount = parseItalianAmount(rawAmount)

      if (isNaN(amount)) {
        errors.push({ line: lineCount, message: `Importo non valido: "${rawAmount}"`, raw: match[0] })
        continue
      }

      const type = amount < 0 ? 'expense' : 'income'
      const absAmount = Math.abs(amount)
      const description = extractDescription(rawMiddle) || 'Movimento importato'
      const rawCategory = extractCategory(rawMiddle)

      // Matching categoria
      const catKey = rawCategory.toLowerCase().trim()
      let matchedCat = catMap[catKey] || null

      // Ricerca parziale
      if (!matchedCat && catKey) {
        for (const [key, cat] of Object.entries(catMap)) {
          if (cat && cat.type === type && (key.includes(catKey) || catKey.includes(key))) {
            matchedCat = cat
            break
          }
        }
      }

      // Fallback: prima categoria del tipo corretto
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
    } catch (e) {
      errors.push({ line: lineCount, message: `Errore parsing: ${e.message}`, raw: match[0] })
    }
  }

  return { rows, errors, totalLines: lineCount }
}

/**
 * Entry point principale: estrae testo dal PDF e lo parsa.
 *
 * @param {File}     file       - File PDF
 * @param {Array}    categories - Categorie utente
 * @param {function} onProgress - Callback(pagesDone, totalPages) per la barra di avanzamento PDF
 * @returns {Promise<{ rows, errors, totalLines }>}
 */
export async function importFromPDF(file, categories = [], onProgress) {
  const text = await extractTextFromPDF(file, onProgress)
  return parseBankStatementText(text, categories)
}

/**
 * Calcola le statistiche aggregate dei movimenti.
 */
export function getBankImportStats(rows, errors) {
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
