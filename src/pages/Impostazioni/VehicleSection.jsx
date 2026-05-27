import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Car, Plus, Trash2, Calendar, TrendingUp, Gauge, Droplet,
  Wrench, Shield, FileText, AlertTriangle, ArrowLeftRight
} from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import AnimatedNumber from '@/components/ui/AnimatedNumber'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { useConfirmStore } from '@/store/useConfirmStore'
import { motion, AnimatePresence } from 'framer-motion'

// ─────────────────────────────────────────────────────────────
// SVG Car (sedan side view, uses VitaOS CSS vars for theming)
// ─────────────────────────────────────────────────────────────
function CarIllustration({ rotateY = 0 }) {
  return (
    <svg
      viewBox="0 0 320 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 280, transform: `rotateY(${rotateY}deg)`, transition: 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="vbody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--vcar-top, #c8d0dc)" />
          <stop offset="55%" stopColor="var(--vcar-mid, #a0aab8)" />
          <stop offset="100%" stopColor="var(--vcar-bot, #707888)" />
        </linearGradient>
        <linearGradient id="vroof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--vcar-top, #d0d8e4)" />
          <stop offset="100%" stopColor="var(--vcar-mid, #8090a8)" />
        </linearGradient>
        <linearGradient id="vwheel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#48485a" />
          <stop offset="100%" stopColor="#1e1e28" />
        </linearGradient>
        <radialGradient id="vwheelc" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#888" />
          <stop offset="100%" stopColor="#333" />
        </radialGradient>
        <filter id="vglow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="160" cy="126" rx="130" ry="6" fill="rgba(0,0,0,0.08)" />

      {/* Body lower */}
      <path d="M32 90 L32 76 Q35 68 50 63 L62 61 L258 61 L272 66 L282 76 L282 90 Z" fill="url(#vbody)" />

      {/* Roof / cabin */}
      <path d="M88 61 L104 34 Q110 28 118 26 L200 26 Q208 26 214 31 L234 61 Z" fill="url(#vroof)" />

      {/* Windshield front */}
      <path d="M200 26 Q208 26 214 31 L234 61 L212 61 Z" fill="rgba(140,190,240,0.22)" stroke="rgba(150,200,255,0.28)" strokeWidth="0.6" />

      {/* Windshield rear */}
      <path d="M88 61 L104 34 Q110 28 118 26 L110 61 Z" fill="rgba(140,190,240,0.18)" stroke="rgba(150,200,255,0.2)" strokeWidth="0.6" />

      {/* Side windows */}
      <rect x="112" y="30" width="86" height="29" rx="3" fill="rgba(130,185,240,0.16)" stroke="rgba(150,200,255,0.18)" strokeWidth="0.6" />
      {/* Window divider */}
      <line x1="154" y1="30" x2="154" y2="59" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />

      {/* Body accent line */}
      <path d="M34 76 L280 76" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
      <path d="M34 79 L280 79" stroke="rgba(0,0,0,0.12)" strokeWidth="0.5" />

      {/* Headlight */}
      <path d="M268 67 L280 73 L277 80 L260 78 Z" fill="rgba(255,245,180,0.92)" filter="url(#vglow)" />
      <line x1="266" y1="68" x2="278" y2="74" stroke="rgba(255,235,150,0.5)" strokeWidth="1.5" />

      {/* Taillight */}
      <path d="M50 64 L34 71 L35 79 L54 77 Z" fill="rgba(220,60,60,0.82)" />
      <line x1="36" y1="72" x2="50" y2="66" stroke="rgba(255,100,100,0.4)" strokeWidth="1" />

      {/* Door line */}
      <path d="M152 61 L152 88" stroke="rgba(0,0,0,0.14)" strokeWidth="0.8" />
      <path d="M196 61 L196 88" stroke="rgba(0,0,0,0.1)" strokeWidth="0.8" />

      {/* Door handles */}
      <rect x="116" y="73" width="22" height="3" rx="1.5" fill="rgba(255,255,255,0.2)" />
      <rect x="160" y="73" width="22" height="3" rx="1.5" fill="rgba(255,255,255,0.2)" />

      {/* Mirror */}
      <path d="M248 61 L258 56 L261 60 L250 64 Z" fill="var(--vcar-mid, #8090a8)" />

      {/* Wheels */}
      {[226, 90].map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy={97} r="22" fill="url(#vwheel)" />
          <circle cx={cx} cy={97} r="16" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          <circle cx={cx} cy={97} r="9" fill="url(#vwheelc)" />
          <circle cx={cx} cy={97} r="3.5" fill="rgba(255,255,255,0.28)" />
          {[0, 60, 120, 180, 240, 300].map((deg) => {
            const rad = (deg * Math.PI) / 180
            return (
              <line
                key={deg}
                x1={cx + Math.cos(rad) * 9.5}
                y1={97 + Math.sin(rad) * 9.5}
                x2={cx + Math.cos(rad) * 16}
                y2={97 + Math.sin(rad) * 16}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.5"
              />
            )
          })}
        </g>
      ))}

      {/* Roof shine */}
      <path d="M120 28 Q160 24 198 28 Q178 34 140 34 Z" fill="rgba(255,255,255,0.14)" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// Hotspot Pin component
// ─────────────────────────────────────────────────────────────
function HotspotPin({ label, value, badge, badgeColor, dotColor, side = 'left', delay = 0, status = 'ok' }) {
  const statusStyles = {
    ok:      { dot: 'var(--color-success)', ring: 'rgba(61,153,112,0.3)' },
    warning: { dot: 'var(--color-warning)', ring: 'rgba(212,160,23,0.3)' },
    danger:  { dot: 'var(--color-danger)',  ring: 'rgba(224,82,82,0.3)' },
  }
  const s = statusStyles[status] ?? statusStyles.ok

  return (
    <motion.div
      initial={{ opacity: 0, y: side === 'top' ? -8 : 8, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay, ease: [0.34, 1.56, 0.64, 1] }}
      className={`absolute flex flex-col items-${side === 'right' ? 'end' : 'start'} z-10 pointer-events-none`}
      style={{ ...(side === 'left' ? { left: 0 } : { right: 0 }) }}
    >
      {/* Pin card */}
      <div
        className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-2.5 py-1.5 shadow-[var(--shadow-md)]"
        style={{ minWidth: 110 }}
      >
        <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] leading-none mb-1">{label}</p>
        <p className="text-xs font-black text-[var(--text-primary)] leading-tight">{value}</p>
        {badge && (
          <span
            className="inline-block mt-1 text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded"
            style={{ background: badgeColor ? `${badgeColor}18` : undefined, color: badgeColor }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Connecting line + dot */}
      <div className={`flex flex-col items-${side === 'right' ? 'end' : 'start'} gap-0`} style={{ marginLeft: side === 'left' ? 12 : undefined, marginRight: side === 'right' ? 12 : undefined }}>
        <div style={{ width: 1, height: 20, background: `linear-gradient(to bottom, ${s.dot}, transparent)`, margin: '0 auto' }} />
        <motion.div
          animate={{ scale: [1, 1.35, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: delay * 0.5 }}
          style={{
            width: 10, height: 10, borderRadius: '50%',
            background: s.dot,
            boxShadow: `0 0 0 4px ${s.ring}`,
            margin: '0 auto',
          }}
        />
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Animated Progress Bar
// ─────────────────────────────────────────────────────────────
function MaintenanceBar({ label, icon: Icon, pct, colorVar, note, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${colorVar}18` }}
          >
            <Icon size={12} style={{ color: colorVar }} />
          </div>
          <span className="text-xs font-bold text-[var(--text-primary)]">{label}</span>
        </div>
        <span className="text-[10px] font-bold" style={{ color: colorVar }}>{note}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: colorVar }}
          initial={{ width: '0%' }}
          animate={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          transition={{ duration: 1.1, delay: delay + 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main VehicleSection
// ─────────────────────────────────────────────────────────────
function VehicleSection() {
  const confirm = useConfirmStore(s => s.confirm)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorNotice, setErrorNotice] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showViewer, setShowViewer] = useState(true)

  // Form State
  const [showAddForm, setShowAddForm] = useState(false)
  const [type, setType] = useState('fuel')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [odometer, setOdometer] = useState('')
  const [liters, setLiters] = useState('')
  const [pricePerLiter, setPricePerLiter] = useState('')
  const [notes, setNotes] = useState('')

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('vehicle_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) {
        if (error.message?.includes('relation "public.vehicle_logs" does not exist') || error.code === '42P01') {
          setErrorNotice(true)
        } else {
          toast.error('Errore nel caricamento dei dati')
        }
      } else {
        setLogs(data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || isNaN(parseFloat(amount))) {
      toast.error('Inserisci un importo valido')
      return
    }
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = {
        user_id: user.id,
        date,
        type,
        amount: parseFloat(amount),
        odometer: odometer ? parseInt(odometer) : null,
        liters: type === 'fuel' && liters ? parseFloat(liters) : null,
        price_per_liter: type === 'fuel' && pricePerLiter ? parseFloat(pricePerLiter) : null,
        notes: notes.trim() || null
      }

      const { error } = await supabase.from('vehicle_logs').insert(payload)
      if (error) throw error

      toast.success('Spesa registrata correttamente')
      setShowAddForm(false)
      setAmount(''); setOdometer(''); setLiters(''); setPricePerLiter(''); setNotes('')
      fetchLogs()
    } catch (err) {
      console.error(err)
      toast.error('Errore nel salvataggio della spesa')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Elimina elemento',
      message: 'Sei sicuro di voler eliminare questo elemento?',
      variant: 'danger',
      confirmText: 'Elimina',
      cancelText: 'Annulla'
    })
    if (!ok) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('vehicle_logs').delete().eq('id', id).eq('user_id', user.id)
      if (error) throw error
      toast.success('Elemento eliminato')
      fetchLogs()
    } catch (err) {
      console.error(err)
      toast.error("Errore durante l'eliminazione")
    }
  }

  // ── Stats ──
  const stats = useMemo(() => {
    const fuelLogs = logs.filter(l => l.type === 'fuel' && l.odometer && l.liters).sort((a, b) => a.odometer - b.odometer)
    const odometers = logs.map(l => l.odometer).filter(o => o && o > 0)

    const maxOdo = odometers.length > 0 ? Math.max(...odometers) : 0
    const minOdo = odometers.length > 0 ? Math.min(...odometers) : 0
    const totalKms = maxOdo - minOdo

    let avgConsumption = 0
    let costPerKm = 0

    if (fuelLogs.length >= 2) {
      const fuelKms = fuelLogs[fuelLogs.length - 1].odometer - fuelLogs[0].odometer
      const totalLiters = fuelLogs.slice(1).reduce((sum, l) => sum + parseFloat(l.liters || 0), 0)
      if (fuelKms > 0) avgConsumption = (totalLiters / fuelKms) * 100
    }

    const totalSpent = logs.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0)
    if (totalKms > 0) costPerKm = totalSpent / totalKms

    return { maxOdo, avgConsumption, costPerKm, totalSpent, totalKms }
  }, [logs])

  // ── Deadlines ──
  const deadlines = useMemo(() => {
    return logs
      .filter(l => (l.type === 'insurance' || l.type === 'tax') && new Date(l.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [logs])

  // ── Maintenance health ──
  const oilLog = useMemo(() => {
    return logs.filter(l => l.type === 'maintenance' && l.odometer).sort((a, b) => b.odometer - a.odometer)[0]
  }, [logs])

  const oilPct = useMemo(() => {
    if (!oilLog || !stats.maxOdo) return 0
    const kmSinceOil = stats.maxOdo - oilLog.odometer
    return Math.min(100, (kmSinceOil / 15000) * 100)
  }, [oilLog, stats.maxOdo])

  const insuranceEntry = deadlines.find(d => d.type === 'insurance')
  const taxEntry = deadlines.find(d => d.type === 'tax')

  const hasData = logs.length > 0

  // ── Badge helper ──
  const getTypeBadge = (type) => {
    switch (type) {
      case 'fuel':        return { label: 'Rifornimento',  icon: Droplet,   color: 'text-blue-500  bg-blue-500/10  border-blue-500/20'  }
      case 'maintenance': return { label: 'Manutenzione',  icon: Wrench,    color: 'text-orange-500 bg-orange-500/10 border-orange-500/20'}
      case 'insurance':   return { label: 'Assicurazione', icon: Shield,    color: 'text-green-500  bg-green-500/10  border-green-500/20' }
      case 'tax':         return { label: 'Bollo Auto',    icon: FileText,  color: 'text-purple-500 bg-purple-500/10 border-purple-500/20'}
      default:            return { label: 'Altro',         icon: Car,       color: 'text-gray-500   bg-gray-500/10   border-gray-500/20'  }
    }
  }

  // ── Error state ──
  if (errorNotice) {
    return (
      <Card padding="lg" className="border-red-500/20 bg-red-500/5">
        <div className="flex items-center gap-3 text-red-500 mb-4">
          <AlertTriangle size={24} />
          <h3 className="text-lg font-black">Tabella Veicolo non configurata</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-5 leading-relaxed">
          La tabella di tracciamento dell'auto non è ancora presente nel tuo database Supabase.
          Per sbloccare questo modulo, copia ed esegui le istruzioni presenti nel file di migrazione{' '}
          <code className="mx-1 px-1.5 py-0.5 bg-black/10 dark:bg-white/10 rounded font-mono text-xs">create_addons_tables.sql</code>
          (situato nella root del tuo progetto) all'interno del <strong>SQL Editor</strong> della tua Dashboard Supabase.
        </p>
        <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-subtle)]">
          <p className="text-xs font-bold mb-2">Procedura veloce:</p>
          <ol className="text-xs text-[var(--text-secondary)] space-y-1 list-decimal pl-4">
            <li>Apri il file <code className="font-mono">create_addons_tables.sql</code> ed apri la console Supabase.</li>
            <li>Incolla lo script nel SQL Editor ed esegui.</li>
            <li>Ricarica questa pagina.</li>
          </ol>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-5">

      {/* ══════════════════════════════════════════
          VEHICLE VIEWER CARD
      ══════════════════════════════════════════ */}
      <Card padding="none" className="overflow-hidden">
        {/* Header bar inside card */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-ghost)] flex items-center justify-center">
              <Car size={14} className="text-[var(--color-primary)]" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Il tuo Veicolo</span>
          </div>
          <button
            onClick={() => setShowViewer(v => !v)}
            className="text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            {showViewer ? 'Nascondi' : 'Mostra'}
          </button>
        </div>

        <AnimatePresence>
          {showViewer && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: 'hidden' }}
            >
              {/* Car stage */}
              <div
                className="relative flex items-end justify-center"
                style={{
                  minHeight: 200,
                  background: 'radial-gradient(ellipse 80% 60% at 50% 70%, var(--bg-elevated) 0%, var(--bg-base) 100%)',
                  paddingBottom: 24,
                  paddingTop: 20,
                }}
              >
                {/* CSS custom props for car SVG gradient in light/dark */}
                <style>{`
                  :root { --vcar-top:#c8d0dc; --vcar-mid:#a0aab8; --vcar-bot:#707888; }
                  [data-theme='dark'] { --vcar-top:#8090a8; --vcar-mid:#606878; --vcar-bot:#404858; }
                `}</style>

                {/* ── HOTSPOT: Cambio Olio (sinistra) ── */}
                {hasData && oilLog && (
                  <div className="absolute left-2 top-3" style={{ zIndex: 10 }}>
                    <HotspotPin
                      label="🔧 Cambio Olio"
                      value={oilPct < 80 ? `${Math.round(stats.maxOdo - oilLog.odometer).toLocaleString('it-IT')} km fa` : 'Da fare presto'}
                      badge={oilPct >= 80 ? '⚠️ Urgente' : '✓ OK'}
                      badgeColor={oilPct >= 80 ? 'var(--color-warning)' : 'var(--color-success)'}
                      status={oilPct >= 90 ? 'danger' : oilPct >= 70 ? 'warning' : 'ok'}
                      side="left"
                      delay={0.6}
                    />
                  </div>
                )}

                {/* ── HOTSPOT: KM (centro-alto) ── */}
                {stats.maxOdo > 0 && (
                  <div className="absolute top-2" style={{ left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: 0.75, ease: [0.34, 1.56, 0.64, 1] }}
                    >
                      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-2.5 py-1.5 shadow-[var(--shadow-md)] text-center">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">📍 Odometro</p>
                        <p className="text-xs font-black text-[var(--text-primary)]">
                          {stats.maxOdo.toLocaleString('it-IT')} km
                        </p>
                      </div>
                      <div style={{ width: 1, height: 16, background: 'linear-gradient(to bottom, var(--color-success), transparent)', margin: '0 auto' }} />
                      <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-success)', boxShadow: '0 0 0 4px rgba(61,153,112,0.25)', margin: '0 auto' }}
                      />
                    </motion.div>
                  </div>
                )}

                {/* ── HOTSPOT: Carburante (destra) ── */}
                {stats.avgConsumption > 0 && (
                  <div className="absolute right-2 top-3" style={{ zIndex: 10 }}>
                    <HotspotPin
                      label="⛽ Consumo"
                      value={`${stats.avgConsumption.toFixed(1)} l/100`}
                      status="ok"
                      side="right"
                      delay={0.9}
                    />
                  </div>
                )}

                {/* ── HOTSPOT: Assicurazione (basso-sinistra) ── */}
                {insuranceEntry && (
                  <div className="absolute bottom-8 left-2" style={{ zIndex: 10 }}>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: 1.05, ease: [0.34, 1.56, 0.64, 1] }}
                    >
                      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-2.5 py-1.5 shadow-[var(--shadow-md)]">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">🛡️ Assicurazione</p>
                        <p className="text-xs font-black text-[var(--text-primary)]">
                          {format(new Date(insuranceEntry.date), 'dd MMM yyyy', { locale: it })}
                        </p>
                        <span className="inline-block mt-0.5 text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(212,160,23,0.12)', color: 'var(--color-warning)' }}>
                          ⚠️ Rinnovo
                        </span>
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* ── CAR SVG ── */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.88, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                  style={{ width: '75%', maxWidth: 280 }}
                >
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <CarIllustration />
                  </motion.div>
                </motion.div>

                {/* Empty state overlay */}
                {!hasData && !loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-base)]/60 backdrop-blur-[2px]">
                    <Car size={28} className="text-[var(--text-muted)] mb-2 opacity-40" />
                    <p className="text-xs font-bold text-[var(--text-muted)] opacity-60 text-center px-8">
                      Inserisci rifornimenti e spese per sbloccare la telemetria
                    </p>
                  </div>
                )}
              </div>

              {/* Ground line */}
              <div className="h-px bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent mx-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* ══════════════════════════════════════════
          STATS GRID
      ══════════════════════════════════════════ */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
      >
        {[
          { icon: Gauge,          label: 'KM Attuali',   value: stats.maxOdo,        suffix: ' km',    decimals: 0, show: stats.maxOdo > 0 },
          { icon: Droplet,        label: 'Consumo',      value: stats.avgConsumption, suffix: ' l/100', decimals: 2, show: stats.avgConsumption > 0 },
          { icon: ArrowLeftRight, label: 'Costo / Km',   value: stats.costPerKm,      prefix: '',        suffix: ' €/km', decimals: 3, show: stats.costPerKm > 0 },
          { icon: TrendingUp,     label: 'Spesa Totale', value: stats.totalSpent,     prefix: '€ ',      decimals: 2, show: stats.totalSpent > 0 },
        ].map(({ icon: Icon, label, value, prefix = '', suffix = '', decimals, show }) => (
          <motion.div
            key={label}
            variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}
          >
            <Card padding="md" className="flex flex-col gap-1 shadow-sm">
              <div className="text-[var(--text-muted)] flex items-center gap-1.5">
                <Icon size={13} />
                <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
              </div>
              <p className="text-xl font-black mt-0.5 text-[var(--text-primary)]">
                {show
                  ? <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} duration={900} />
                  : '—'
                }
              </p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ══════════════════════════════════════════
          SALUTE VEICOLO (health bars)
      ══════════════════════════════════════════ */}
      {hasData && (
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Salute Veicolo</h3>
            {/* Health score badge */}
            {oilPct > 0 && (
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-lg"
                style={{
                  background: oilPct > 80 ? 'rgba(224,82,82,0.1)' : oilPct > 60 ? 'rgba(212,160,23,0.1)' : 'rgba(61,153,112,0.1)',
                  color: oilPct > 80 ? 'var(--color-danger)' : oilPct > 60 ? 'var(--color-warning)' : 'var(--color-success)',
                }}
              >
                {oilPct > 80 ? '⚠️ Attenzione' : oilPct > 60 ? '○ Buono' : '✓ Ottimo'}
              </span>
            )}
          </div>

          <div className="space-y-3.5">
            {oilLog && (
              <MaintenanceBar
                label="Cambio Olio"
                icon={Wrench}
                pct={oilPct}
                colorVar={oilPct > 80 ? 'var(--color-danger)' : oilPct > 60 ? 'var(--color-warning)' : 'var(--color-success)'}
                note={oilPct > 0 ? `${Math.round(oilPct)}% del ciclo` : '—'}
                delay={0}
              />
            )}

            {insuranceEntry && (() => {
              const daysLeft = Math.max(0, Math.round((new Date(insuranceEntry.date) - new Date()) / 86400000))
              const insPct = Math.max(0, 100 - (daysLeft / 365) * 100)
              return (
                <MaintenanceBar
                  label="Assicurazione RCA"
                  icon={Shield}
                  pct={insPct}
                  colorVar={daysLeft < 30 ? 'var(--color-danger)' : daysLeft < 90 ? 'var(--color-warning)' : 'var(--color-success)'}
                  note={`${daysLeft}gg rimanenti`}
                  delay={0.1}
                />
              )
            })()}

            {taxEntry && (() => {
              const daysLeft = Math.max(0, Math.round((new Date(taxEntry.date) - new Date()) / 86400000))
              const taxPct = Math.max(0, 100 - (daysLeft / 365) * 100)
              return (
                <MaintenanceBar
                  label="Bollo Auto"
                  icon={FileText}
                  pct={taxPct}
                  colorVar={daysLeft < 30 ? 'var(--color-danger)' : daysLeft < 60 ? 'var(--color-warning)' : 'var(--color-success)'}
                  note={`${daysLeft}gg rimanenti`}
                  delay={0.2}
                />
              )
            })()}

            {!oilLog && !insuranceEntry && !taxEntry && (
              <p className="text-xs text-[var(--text-muted)] text-center py-2">
                Aggiungi manutenzioni e scadenze per vedere lo stato del veicolo.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* ══════════════════════════════════════════
          MAIN GRID: Form + Log
      ══════════════════════════════════════════ */}
      <div className="grid md:grid-cols-3 gap-5 items-start">

        {/* ── Left: Add form / deadlines ── */}
        <div className="md:col-span-1 space-y-5">
          <Card padding="md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Inserisci Spesa</h3>
              {!showAddForm && (
                <Button size="xs" variant="primary" icon={Plus} onClick={() => setShowAddForm(true)}>Aggiungi</Button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {showAddForm ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Tipo di Spesa</label>
                    <select
                      value={type}
                      onChange={e => setType(e.target.value)}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    >
                      <option value="fuel">⛽ Rifornimento Carburante</option>
                      <option value="maintenance">🔧 Manutenzione / Officina</option>
                      <option value="insurance">🛡️ Assicurazione</option>
                      <option value="tax">📄 Bollo Auto</option>
                      <option value="other">🚗 Altro / Parcheggio / Lavaggio</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Data</label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      required
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Importo (€)</label>
                      <input
                        type="number" step="0.01" placeholder="0.00"
                        value={amount} onChange={e => setAmount(e.target.value)} required
                        className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Odometro (km)</label>
                      <input
                        type="number" placeholder="Es: 125000"
                        value={odometer} onChange={e => setOdometer(e.target.value)}
                        className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                      />
                    </div>
                  </div>

                  {type === 'fuel' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-2 gap-2 p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border-subtle)]"
                    >
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-[var(--text-muted)]">Litri erogati</label>
                        <input
                          type="number" step="0.01" placeholder="0.00"
                          value={liters} onChange={e => setLiters(e.target.value)}
                          className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-[var(--text-muted)]">Prezzo (€/l)</label>
                        <input
                          type="number" step="0.001" placeholder="1.750"
                          value={pricePerLiter} onChange={e => setPricePerLiter(e.target.value)}
                          className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Note</label>
                    <textarea
                      rows={2} placeholder="Dettagli spesa..."
                      value={notes} onChange={e => setNotes(e.target.value)}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] resize-none"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <Button type="button" variant="ghost" size="xs" onClick={() => setShowAddForm(false)}>Annulla</Button>
                    <Button type="submit" variant="primary" size="xs" loading={submitting}>
                      {submitting ? 'Salvo...' : 'Salva'}
                    </Button>
                  </div>
                </motion.form>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-6 text-[var(--text-muted)]"
                >
                  <Car size={28} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-bold opacity-40">Inserisci rifornimenti e spese per sbloccare la telemetria.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Scadenze future */}
          {deadlines.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}>
              <Card padding="md" className="border-yellow-500/10 bg-yellow-500/5">
                <h3 className="text-xs font-black uppercase tracking-widest text-[var(--color-warning)] mb-3 flex items-center gap-1.5">
                  <AlertTriangle size={13} /> Scadenze Future
                </h3>
                <div className="space-y-2">
                  {deadlines.map(d => {
                    const badge = getTypeBadge(d.type)
                    return (
                      <div key={d.id} className="flex justify-between items-center text-xs bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
                        <div>
                          <p className="font-bold text-[var(--text-primary)]">{badge.label}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">{format(new Date(d.date), 'dd MMMM yyyy', { locale: it })}</p>
                        </div>
                        <span className="font-black text-[var(--text-primary)]">€ {parseFloat(d.amount).toFixed(2)}</span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        {/* ── Right: Log list ── */}
        <div className="md:col-span-2 space-y-4">
          <Card padding="md">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-4">Registro Spese & Consumi</h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-[var(--text-muted)]">Caricamento...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <p className="text-sm font-bold opacity-40">Nessun movimento registrato.</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)] overflow-hidden">
                {logs.map((log, i) => {
                  const badge = getTypeBadge(log.type)
                  const Icon = badge.icon

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.03 }}
                      className="flex items-center justify-between py-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${badge.color}`}>
                          <Icon size={15} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[var(--text-primary)] truncate">{badge.label}</span>
                            {log.odometer && (
                              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded text-[var(--text-muted)]">
                                {log.odometer.toLocaleString('it-IT')} km
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 items-center text-[10px] text-[var(--text-muted)] mt-0.5">
                            <span>{format(new Date(log.date), 'dd/MM/yyyy')}</span>
                            {log.notes && (<><span>•</span><span className="truncate italic">"{log.notes}"</span></>)}
                            {log.type === 'fuel' && log.liters && (
                              <><span>•</span><span className="font-semibold text-blue-500">{parseFloat(log.liters).toFixed(2)} Litri</span></>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-black text-[var(--text-primary)]">
                          € {parseFloat(log.amount).toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--color-danger)] opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default VehicleSection
