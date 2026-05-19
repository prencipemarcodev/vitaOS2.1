import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Droplets, Plus, Minus, Clock, TrendingUp, ChevronDown } from 'lucide-react'
import { useHealthStore } from '@/store/useHealthStore'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import { format, subDays, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { toast } from 'sonner'
import { BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts'

const TODAY = format(new Date(), 'yyyy-MM-dd')
const WATER_GOAL_ML = 2000
const WATER_STEP_ML = 250
const SLEEP_GOAL_H = 8

// ─── Sleep Section ────────────────────────────────────────────────────────────
function SleepTracker({ sleepLog }) {
  const { addSleepEntry, updateSleepEntry } = useHealthStore()
  const [showInput, setShowInput] = useState(false)
  const [bedtime, setBedtime] = useState('23:00')
  const [wakeup, setWakeup] = useState('07:00')
  const [loading, setLoading] = useState(false)

  const todayEntry = sleepLog.find(e => e.date === TODAY)

  const sleepHours = useMemo(() => {
    if (!todayEntry) return null
    const [bH, bM] = todayEntry.bedtime.split(':').map(Number)
    const [wH, wM] = todayEntry.wakeup.split(':').map(Number)
    let minutes = (wH * 60 + wM) - (bH * 60 + bM)
    if (minutes < 0) minutes += 24 * 60 // notte
    return (minutes / 60).toFixed(1)
  }, [todayEntry])

  const quality = useMemo(() => {
    if (!sleepHours) return null
    const h = parseFloat(sleepHours)
    if (h >= 8) return { label: 'Ottimo', color: '#3d9970', pct: 100 }
    if (h >= 7) return { label: 'Buono', color: '#4a90d9', pct: Math.round((h / SLEEP_GOAL_H) * 100) }
    if (h >= 6) return { label: 'Sufficiente', color: '#ff851b', pct: Math.round((h / SLEEP_GOAL_H) * 100) }
    return { label: 'Insufficiente', color: '#e05252', pct: Math.round((h / SLEEP_GOAL_H) * 100) }
  }, [sleepHours])

  // Ultimi 7 giorni per il grafico
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
      const entry = sleepLog.find(e => e.date === date)
      let hours = 0
      if (entry) {
        const [bH, bM] = entry.bedtime.split(':').map(Number)
        const [wH, wM] = entry.wakeup.split(':').map(Number)
        let mins = (wH * 60 + wM) - (bH * 60 + bM)
        if (mins < 0) mins += 24 * 60
        hours = parseFloat((mins / 60).toFixed(1))
      }
      return {
        day: format(parseISO(date), 'EEE', { locale: it }),
        hours,
        isToday: date === TODAY,
      }
    })
  }, [sleepLog])

  const handleSave = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      if (todayEntry) {
        const { data, error } = await supabase
          .from('sleep_log')
          .update({ bedtime, wakeup })
          .eq('id', todayEntry.id)
          .select().single()
        if (error) throw error
        updateSleepEntry(todayEntry.id, data)
      } else {
        const { data, error } = await supabase
          .from('sleep_log')
          .insert({ user_id: user.id, date: TODAY, bedtime, wakeup })
          .select().single()
        if (error) throw error
        addSleepEntry(data)
      }
      setShowInput(false)
      toast.success('Sonno registrato ✨')
    } catch (err) {
      toast.error('Errore nel salvataggio')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Moon size={16} className="text-indigo-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Sonno</h3>
            <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
              Obiettivo: {SLEEP_GOAL_H}h
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowInput(!showInput)}
          className="flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary)] hover:opacity-80 transition-opacity"
        >
          {todayEntry ? 'Modifica' : '+ Registra'}
          <ChevronDown size={12} className={`transition-transform ${showInput ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Main stat */}
      {sleepHours ? (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-baseline gap-1 mb-1.5">
              <span className="text-4xl font-black tabular-nums" style={{ color: quality.color }}>
                {sleepHours}
              </span>
              <span className="text-sm font-bold text-[var(--text-muted)]">ore</span>
              <span className="ml-auto text-[10px] font-black uppercase tracking-wider" style={{ color: quality.color }}>
                {quality.label}
              </span>
            </div>
            <div className="w-full h-2 bg-[var(--bg-base)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${quality.pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: quality.color }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-[var(--text-muted)] font-bold">{todayEntry?.bedtime} → {todayEntry?.wakeup}</span>
              <span className="text-[9px] text-[var(--text-muted)] font-bold">{quality.pct}%</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100">
          <Moon size={20} className="text-indigo-300" />
          <p className="text-xs text-indigo-400 font-bold">Nessun dato per oggi — registra il tuo sonno!</p>
        </div>
      )}

      {/* Input form */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-[var(--border-subtle)] flex gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Coricato</label>
                <input
                  type="time"
                  value={bedtime}
                  onChange={e => setBedtime(e.target.value)}
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Sveglia</label>
                <input
                  type="time"
                  value={wakeup}
                  onChange={e => setWakeup(e.target.value)}
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="h-[38px] px-4 bg-indigo-500 text-white rounded-xl text-xs font-black disabled:opacity-60 hover:bg-indigo-600 transition-colors"
                >
                  {loading ? '...' : 'Salva'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini chart */}
      {chartData.some(d => d.hours > 0) && (
        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'var(--text-muted)', fontWeight: 700 }} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    return (
                      <div className="bg-white border border-[var(--border-subtle)] px-2 py-1 rounded-lg shadow text-[10px] font-bold">
                        {payload[0].value}h
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.isToday ? '#6366f1' : entry.hours >= SLEEP_GOAL_H ? '#3d9970' : entry.hours >= 6 ? '#4a90d9' : entry.hours > 0 ? '#ff851b' : 'var(--bg-base)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

// ─── Water Section ────────────────────────────────────────────────────────────
function WaterTracker({ waterLog }) {
  const { addWaterEntry, updateWaterEntry } = useHealthStore()
  const [loading, setLoading] = useState(false)

  const todayEntry = waterLog.find(e => e.date === TODAY)
  const currentMl = todayEntry?.amount_ml ?? 0
  const pct = Math.min(100, Math.round((currentMl / WATER_GOAL_ML) * 100))

  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
      const entry = waterLog.find(e => e.date === date)
      return {
        day: format(parseISO(date), 'EEE', { locale: it }),
        ml: entry?.amount_ml ?? 0,
        isToday: date === TODAY,
      }
    })
  }, [waterLog])

  const handleAdd = async (delta) => {
    const newAmount = Math.max(0, Math.min(5000, currentMl + delta))
    if (newAmount === currentMl) return
    setLoading(true)

    // Ottimismo UI — aggiorna immediatamente la visualizzazione
    const tempEntry = todayEntry
      ? { ...todayEntry, amount_ml: newAmount }
      : { id: 'temp-' + Date.now(), date: TODAY, amount_ml: newAmount }

    if (!todayEntry && delta > 0) addWaterEntry(tempEntry)
    else if (todayEntry) updateWaterEntry(todayEntry.id, { amount_ml: newAmount })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      const isTemp = todayEntry?.id?.toString().startsWith('temp-')

      if (todayEntry && !isTemp) {
        const { data, error } = await supabase
          .from('water_log')
          .update({ amount_ml: newAmount })
          .eq('id', todayEntry.id)
          .select().single()
        if (error) throw error
        updateWaterEntry(todayEntry.id, data)
      } else if (!todayEntry) {
        if (delta < 0) { setLoading(false); return }
        const { data, error } = await supabase
          .from('water_log')
          .insert({ user_id: user.id, date: TODAY, amount_ml: newAmount })
          .select().single()
        if (error) throw error
        // Sostituisce l'entry temporanea con quella reale
        updateWaterEntry(tempEntry.id, data)
      }
      if (newAmount >= WATER_GOAL_ML && currentMl < WATER_GOAL_ML) {
        toast.success('🎉 Obiettivo idratazione raggiunto!')
      }
    } catch (err) {
      console.error('[WaterTracker] Errore Supabase:', err)
      const msg = err?.code === '42P01'
        ? 'Tabella water_log mancante — esegui la migration SQL'
        : `Errore: ${err?.message || 'salvataggio fallito'}`
      toast.error(msg, { duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  // Colore progressivo
  const waterColor = pct >= 100 ? '#3d9970' : pct >= 60 ? '#4a90d9' : pct >= 30 ? '#0074d9' : '#93c5fd'

  // Numero di bicchieri (ogni 250ml = 1 bicchiere)
  const glasses = Math.floor(currentMl / WATER_STEP_ML)
  const totalGlasses = WATER_GOAL_ML / WATER_STEP_ML

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
            <Droplets size={16} className="text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Acqua</h3>
            <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
              Obiettivo: {WATER_GOAL_ML / 1000}L / giorno
            </p>
          </div>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${
          pct >= 100 ? 'bg-green-50 text-green-600' : pct >= 60 ? 'bg-blue-50 text-blue-600' : 'bg-[var(--bg-base)] text-[var(--text-muted)]'
        }`}>
          {pct >= 100 ? 'Obiettivo! 🎉' : `${pct}%`}
        </span>
      </div>

      {/* Main display */}
      <div className="flex items-center gap-4">
        {/* Circular-ish progress */}
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--bg-base)" strokeWidth="3" />
            <motion.circle
              cx="18" cy="18" r="15.9"
              fill="none"
              stroke={waterColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${pct} ${100 - pct}`}
              initial={{ strokeDasharray: '0 100' }}
              animate={{ strokeDasharray: `${pct} ${100 - pct}` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-black tabular-nums" style={{ color: waterColor }}>
              {currentMl >= 1000 ? `${(currentMl / 1000).toFixed(1)}L` : `${currentMl}`}
            </span>
            {currentMl < 1000 && <span className="text-[8px] font-bold text-[var(--text-muted)]">ml</span>}
          </div>
        </div>

        {/* Glasses + Controls */}
        <div className="flex-1">
          {/* Glasses grid */}
          <div className="grid grid-cols-8 gap-1 mb-3">
            {Array.from({ length: totalGlasses }, (_, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.8 }}
                onClick={() => handleAdd((i + 1) * WATER_STEP_ML - currentMl)}
                disabled={loading}
                className={`h-5 rounded flex items-center justify-center transition-all ${
                  i < glasses ? 'opacity-100' : 'opacity-20'
                }`}
                style={{ backgroundColor: i < glasses ? waterColor : '#93c5fd' }}
                title={`${(i + 1) * WATER_STEP_ML}ml`}
              >
                <Droplets size={8} className="text-white" />
              </motion.button>
            ))}
          </div>

          {/* +/- controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAdd(-WATER_STEP_ML)}
              disabled={loading || currentMl <= 0}
              className="w-8 h-8 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-center justify-center disabled:opacity-30 hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <Minus size={14} />
            </button>
            <span className="flex-1 text-center text-[10px] font-bold text-[var(--text-muted)]">
              {glasses}/{totalGlasses} bicchieri
            </span>
            <button
              onClick={() => handleAdd(WATER_STEP_ML)}
              disabled={loading || currentMl >= 5000}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white disabled:opacity-30 transition-opacity"
              style={{ backgroundColor: waterColor }}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Mini chart */}
      {chartData.some(d => d.ml > 0) && (
        <div className="h-14">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'var(--text-muted)', fontWeight: 700 }} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    const ml = payload[0].value
                    return (
                      <div className="bg-white border border-[var(--border-subtle)] px-2 py-1 rounded-lg shadow text-[10px] font-bold">
                        {ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="ml" radius={[3, 3, 0, 0]} maxBarSize={20}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.isToday ? '#4a90d9' : entry.ml >= WATER_GOAL_ML ? '#3d9970' : entry.ml > 0 ? '#93c5fd' : 'var(--bg-base)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

// ─── Weight Section ────────────────────────────────────────────────────────────
function WeightTracker({ weightLog }) {
  const chartData = useMemo(() => {
    if (!weightLog || weightLog.length === 0) return []
    // Prendi gli ultimi 7 inserimenti e invertili (ordine cronologico per il grafico)
    return [...weightLog].slice(0, 7).reverse().map(e => ({
      date: format(parseISO(e.date), 'dd MMM', { locale: it }),
      weight: e.weight_kg
    }))
  }, [weightLog])

  const currentWeight = weightLog[0]?.weight_kg || '--'

  // Calcolo trend rispetto alla registrazione precedente
  const trend = useMemo(() => {
    if (weightLog.length < 2) return null
    const diff = weightLog[0].weight_kg - weightLog[1].weight_kg
    return diff
  }, [weightLog])

  const { addWeightEntry } = useHealthStore()
  const [showInput, setShowInput] = useState(false)
  const [newWeight, setNewWeight] = useState(currentWeight !== '--' ? currentWeight : '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!newWeight) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')
      const { data, error } = await supabase
        .from('weight_log')
        .insert({ user_id: user.id, date: TODAY, weight_kg: parseFloat(newWeight) })
        .select().single()
      if (error) throw error
      addWeightEntry(data)
      setShowInput(false)
      toast.success('Peso registrato ⚖️')
      
      // Aggiorna anche user_config
      await supabase.from('user_config').update({ weight_kg: parseFloat(newWeight), weight_updated_at: TODAY }).eq('user_id', user.id)
    } catch (err) {
      toast.error('Errore nel salvataggio')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
            <TrendingUp size={16} className="text-orange-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Andamento Peso</h3>
            <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
              Storico Recente
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowInput(!showInput)}
          className="flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary)] hover:opacity-80 transition-opacity"
        >
          + Registra
          <ChevronDown size={12} className={`transition-transform ${showInput ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Main stat */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-baseline gap-1 mb-1.5">
            <span className="text-4xl font-black tabular-nums text-[var(--color-primary)]">
              {currentWeight}
            </span>
            <span className="text-sm font-bold text-[var(--text-muted)]">kg</span>
            {trend !== null && (
              <span className={`ml-auto text-[10px] font-black uppercase tracking-wider ${trend > 0 ? 'text-red-500' : trend < 0 ? 'text-green-500' : 'text-gray-500'}`}>
                {trend > 0 ? '+' : ''}{trend > 0 ? trend.toFixed(1) : trend < 0 ? trend.toFixed(1) : '='} kg
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Input form */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-[var(--border-subtle)] flex gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={e => setNewWeight(e.target.value)}
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="es. 70.5"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSave}
                  disabled={loading || !newWeight}
                  className="h-[38px] px-4 bg-orange-500 text-white rounded-xl text-xs font-black disabled:opacity-60 hover:bg-orange-600 transition-colors"
                >
                  {loading ? '...' : 'Salva'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini chart */}
      {chartData.length > 0 ? (
        <div className="h-20 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text-muted)', fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 9, fill: 'var(--text-muted)', fontWeight: 700 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    return (
                      <div className="bg-white border border-[var(--border-subtle)] px-2 py-1 rounded-lg shadow text-[10px] font-bold">
                        {payload[0].value} kg
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line type="monotone" dataKey="weight" stroke="#ff851b" strokeWidth={3} dot={{ r: 3, fill: '#ff851b', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-xs text-[var(--text-muted)] italic">Nessun dato registrato. Aggiungi il tuo peso dalle Impostazioni.</p>
      )}
    </Card>
  )
}

// ─── Exported wrapper ──────────────────────────────────────────────────────────
function WellnessTracker() {
  const { sleepLog, waterLog, weightLog } = useHealthStore()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
      <SleepTracker sleepLog={sleepLog} />
      <WaterTracker waterLog={waterLog} />
      <WeightTracker weightLog={weightLog} />
    </div>
  )
}

export default WellnessTracker
