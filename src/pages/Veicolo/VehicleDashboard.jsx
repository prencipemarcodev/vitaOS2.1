import { useState, useMemo, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Car, Plus, Trash2, TrendingUp, Gauge, Droplet,
  Wrench, Shield, FileText, AlertTriangle, ArrowLeftRight
} from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import AnimatedNumber from '@/components/ui/AnimatedNumber'
import Car3DViewer from './Car3DViewer'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { useConfirmStore } from '@/store/useConfirmStore'


// ── Hotspot Pin ───────────────────────────────────────────────
function HotspotPin({ label, value, badge, badgeColor, status = 'ok', side = 'left', delay = 0 }) {
  const dotColor = status === 'danger' ? 'var(--color-danger)' : status === 'warning' ? 'var(--color-warning)' : 'var(--color-success)'
  const ringColor = status === 'danger' ? 'rgba(224,82,82,0.28)' : status === 'warning' ? 'rgba(212,160,23,0.28)' : 'rgba(61,153,112,0.28)'

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay, ease: [0.34, 1.56, 0.64, 1] }}
      className={`absolute flex flex-col items-${side === 'right' ? 'end' : 'start'} z-10 pointer-events-none`}
      style={{ ...(side === 'left' ? { left: 0 } : { right: 0 }) }}
    >
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-2.5 py-1.5 shadow-[var(--shadow-md)]" style={{ minWidth: 106 }}>
        <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] leading-none mb-1">{label}</p>
        <p className="text-xs font-black text-[var(--text-primary)] leading-tight">{value}</p>
        {badge && (
          <span className="inline-block mt-1 text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded"
            style={{ background: badgeColor ? `${badgeColor}18` : undefined, color: badgeColor }}>
            {badge}
          </span>
        )}
      </div>
      <div className={`flex flex-col items-${side === 'right' ? 'end' : 'start'}`}
        style={{ marginLeft: side === 'left' ? 12 : undefined, marginRight: side === 'right' ? 12 : undefined }}>
        <div style={{ width: 1, height: 18, background: `linear-gradient(to bottom, ${dotColor}, transparent)`, margin: '0 auto' }} />
        <motion.div
          animate={{ scale: [1, 1.35, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: delay * 0.5 }}
          style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor, boxShadow: `0 0 0 4px ${ringColor}`, margin: '0 auto' }}
        />
      </div>
    </motion.div>
  )
}

// ── Maintenance Bar ───────────────────────────────────────────
function MaintenanceBar({ label, icon: Icon, pct, color, note, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
            <Icon size={12} style={{ color }} />
          </div>
          <span className="text-xs font-bold text-[var(--text-primary)]">{label}</span>
        </div>
        <span className="text-[10px] font-bold" style={{ color }}>{note}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ background: color }}
          initial={{ width: '0%' }}
          animate={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          transition={{ duration: 1.1, delay: delay + 0.15, ease: [0.25, 0.46, 0.45, 0.94] }} />
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// VehicleDashboard — main component
// ─────────────────────────────────────────────────────────────
function VehicleDashboard({ vehicle }) {
  const confirm = useConfirmStore(s => s.confirm)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(true)
  const [vehicleColor, setVehicleColor] = useState(vehicle?.color ?? '#9aacc8')

  // Sync color when vehicle changes
  useEffect(() => { setVehicleColor(vehicle?.color ?? '#9aacc8') }, [vehicle?.id])

  // Form state
  const [type, setType] = useState('fuel')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [odometer, setOdometer] = useState('')
  const [liters, setLiters] = useState('')
  const [pricePerLiter, setPricePerLiter] = useState('')
  const [notes, setNotes] = useState('')

  // ── Fetch logs for this vehicle ──
  const fetchLogs = async () => {
    if (!vehicle) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from('vehicle_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('vehicle_id', vehicle.id)
        .order('date', { ascending: false })
      if (error) throw error
      setLogs(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [vehicle?.id])

  // ── Submit log ──
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || isNaN(parseFloat(amount))) { toast.error('Inserisci un importo valido'); return }
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('vehicle_logs').insert({
        user_id: user.id,
        vehicle_id: vehicle.id,
        date, type,
        amount: parseFloat(amount),
        odometer: odometer ? parseInt(odometer) : null,
        liters: type === 'fuel' && liters ? parseFloat(liters) : null,
        price_per_liter: type === 'fuel' && pricePerLiter ? parseFloat(pricePerLiter) : null,
        notes: notes.trim() || null,
      })
      if (error) throw error
      toast.success('Spesa registrata')
      setShowAddForm(false)
      setAmount(''); setOdometer(''); setLiters(''); setPricePerLiter(''); setNotes('')
      fetchLogs()
    } catch (err) {
      console.error(err); toast.error('Errore nel salvataggio')
    } finally { setSubmitting(false) }
  }

  // ── Delete log ──
  const handleDelete = async (id) => {
    const ok = await confirm({ title: 'Elimina elemento', message: 'Sei sicuro?', variant: 'danger', confirmText: 'Elimina', cancelText: 'Annulla' })
    if (!ok) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('vehicle_logs').delete().eq('id', id).eq('user_id', user.id)
      if (error) throw error
      toast.success('Eliminato')
      fetchLogs()
    } catch (err) { toast.error("Errore durante l'eliminazione") }
  }

  // ── Stats ──
  const stats = useMemo(() => {
    const fuelLogs = logs.filter(l => l.type === 'fuel' && l.odometer && l.liters).sort((a, b) => a.odometer - b.odometer)
    const odometers = logs.map(l => l.odometer).filter(o => o && o > 0)
    const maxOdo = odometers.length > 0 ? Math.max(...odometers) : 0
    const minOdo = odometers.length > 0 ? Math.min(...odometers) : 0
    const totalKms = maxOdo - minOdo
    let avgConsumption = 0, costPerKm = 0
    if (fuelLogs.length >= 2) {
      const fuelKms = fuelLogs[fuelLogs.length - 1].odometer - fuelLogs[0].odometer
      const totalLiters = fuelLogs.slice(1).reduce((s, l) => s + parseFloat(l.liters || 0), 0)
      if (fuelKms > 0) avgConsumption = (totalLiters / fuelKms) * 100
    }
    const totalSpent = logs.reduce((s, l) => s + parseFloat(l.amount || 0), 0)
    if (totalKms > 0) costPerKm = totalSpent / totalKms
    return { maxOdo, avgConsumption, costPerKm, totalSpent }
  }, [logs])

  const deadlines = useMemo(() =>
    logs.filter(l => (l.type === 'insurance' || l.type === 'tax') && new Date(l.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  , [logs])

  const oilLog = useMemo(() =>
    logs.filter(l => l.type === 'maintenance' && l.odometer).sort((a, b) => b.odometer - a.odometer)[0]
  , [logs])

  const oilPct = useMemo(() => {
    if (!oilLog || !stats.maxOdo) return 0
    return Math.min(100, ((stats.maxOdo - oilLog.odometer) / 15000) * 100)
  }, [oilLog, stats.maxOdo])

  const insuranceEntry = deadlines.find(d => d.type === 'insurance')
  const taxEntry = deadlines.find(d => d.type === 'tax')
  const hasData = logs.length > 0

  const getTypeBadge = (type) => {
    switch (type) {
      case 'fuel':        return { label: 'Rifornimento',  icon: Droplet,  color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' }
      case 'maintenance': return { label: 'Manutenzione',  icon: Wrench,   color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' }
      case 'insurance':   return { label: 'Assicurazione', icon: Shield,   color: 'text-green-500 bg-green-500/10 border-green-500/20' }
      case 'tax':         return { label: 'Bollo Auto',    icon: FileText, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' }
      default:            return { label: 'Altro',         icon: Car,      color: 'text-gray-500 bg-gray-500/10 border-gray-500/20' }
    }
  }

  if (!vehicle) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={vehicle.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
        className="space-y-5"
      >
        {/* ── Car Viewer ── */}
        <Card padding="none" className="overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: vehicle.color }} />
              <span className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">
                {vehicle.name}
              </span>
            </div>
            <button onClick={() => setViewerOpen(v => !v)}
              className="text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              {viewerOpen ? 'Nascondi' : 'Mostra'}
            </button>
          </div>

          <AnimatePresence>
            {viewerOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: 'hidden' }}
              >
                {/* 3D / SVG Viewer con hotspot overlay */}
                <div className="relative">
                  <Car3DViewer
                    vehicleType={vehicle.vehicle_type ?? 'sedan'}
                    color={vehicleColor}
                    onColorChange={setVehicleColor}
                    label={vehicle.name}
                    height={240}
                    className="mx-0 rounded-none"
                  />

                  {/* Hotspot pins overlay sopra il viewer */}
                  {hasData && oilLog && (
                    <div className="absolute left-2 top-3 z-20 pointer-events-none">
                      <HotspotPin label="🔧 Cambio Olio"
                        value={`${Math.round(stats.maxOdo - oilLog.odometer).toLocaleString('it-IT')} km fa`}
                        badge={oilPct >= 80 ? '⚠️ Urgente' : '✓ OK'}
                        badgeColor={oilPct >= 80 ? 'var(--color-warning)' : 'var(--color-success)'}
                        status={oilPct >= 90 ? 'danger' : oilPct >= 70 ? 'warning' : 'ok'}
                        side="left" delay={0.3} />
                    </div>
                  )}
                  {stats.maxOdo > 0 && (
                    <div className="absolute top-2 z-20 pointer-events-none" style={{ left: '50%', transform: 'translateX(-50%)' }}>
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                        <div className="bg-[var(--bg-surface)]/90 backdrop-blur-md border border-[var(--border-default)] rounded-[var(--radius-md)] px-2.5 py-1.5 shadow-[var(--shadow-md)] text-center">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">📍 Odometro</p>
                          <p className="text-xs font-black text-[var(--text-primary)]">{stats.maxOdo.toLocaleString('it-IT')} km</p>
                        </div>
                      </motion.div>
                    </div>
                  )}
                  {stats.avgConsumption > 0 && (
                    <div className="absolute right-2 top-3 z-20 pointer-events-none">
                      <HotspotPin label="⛽ Consumo" value={`${stats.avgConsumption.toFixed(1)} l/100`}
                        status="ok" side="right" delay={0.6} />
                    </div>
                  )}
                  {insuranceEntry && (
                    <div className="absolute bottom-10 left-2 z-20 pointer-events-none">
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                        <div className="bg-[var(--bg-surface)]/90 backdrop-blur-md border border-[var(--border-default)] rounded-[var(--radius-md)] px-2.5 py-1.5 shadow-[var(--shadow-md)]">
                          <p className="text-[9px] font-bold uppercase text-[var(--text-muted)] mb-0.5">🛡️ Assicurazione</p>
                          <p className="text-xs font-black text-[var(--text-primary)]">{format(new Date(insuranceEntry.date), 'dd MMM yyyy', { locale: it })}</p>
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded" style={{ background: 'rgba(212,160,23,0.12)', color: 'var(--color-warning)' }}>⚠️ Rinnovo</span>
                        </div>
                      </motion.div>
                    </div>
                  )}
                  {!hasData && !loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-base)]/50 backdrop-blur-[2px] z-10">
                      <Car size={28} className="text-[var(--text-muted)] mb-2 opacity-30" />
                      <p className="text-xs font-bold text-[var(--text-muted)] opacity-50 text-center px-8">Inserisci rifornimenti per sbloccare la telemetria</p>
                    </div>
                  )}
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent mx-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* ── Stats ── */}
        <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3"
          initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}>
          {[
            { icon: Gauge,          label: 'KM Attuali',   value: stats.maxOdo,         suffix: ' km',    decimals: 0, show: stats.maxOdo > 0 },
            { icon: Droplet,        label: 'Consumo',      value: stats.avgConsumption, suffix: ' l/100', decimals: 2, show: stats.avgConsumption > 0 },
            { icon: ArrowLeftRight, label: 'Costo / Km',   value: stats.costPerKm,      suffix: ' €/km',  decimals: 3, show: stats.costPerKm > 0 },
            { icon: TrendingUp,     label: 'Spesa Totale', value: stats.totalSpent,     prefix: '€ ',     decimals: 2, show: stats.totalSpent > 0 },
          ].map(({ icon: Icon, label, value, prefix = '', suffix = '', decimals, show }) => (
            <motion.div key={label}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}>
              <Card padding="md" className="flex flex-col gap-1 shadow-sm">
                <div className="text-[var(--text-muted)] flex items-center gap-1.5">
                  <Icon size={13} />
                  <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
                </div>
                <p className="text-xl font-black mt-0.5 text-[var(--text-primary)]">
                  {show ? <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} duration={900} /> : '—'}
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Health bars ── */}
        {hasData && (oilLog || insuranceEntry || taxEntry) && (
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Salute Veicolo</h3>
              {oilPct > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-lg"
                  style={{ background: oilPct > 80 ? 'rgba(224,82,82,0.1)' : oilPct > 60 ? 'rgba(212,160,23,0.1)' : 'rgba(61,153,112,0.1)', color: oilPct > 80 ? 'var(--color-danger)' : oilPct > 60 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                  {oilPct > 80 ? '⚠️ Attenzione' : oilPct > 60 ? '○ Buono' : '✓ Ottimo'}
                </span>
              )}
            </div>
            <div className="space-y-3.5">
              {oilLog && <MaintenanceBar label="Cambio Olio" icon={Wrench} pct={oilPct}
                color={oilPct > 80 ? 'var(--color-danger)' : oilPct > 60 ? 'var(--color-warning)' : 'var(--color-success)'}
                note={`${Math.round(oilPct)}% del ciclo`} delay={0} />}
              {insuranceEntry && (() => {
                const daysLeft = Math.max(0, Math.round((new Date(insuranceEntry.date) - new Date()) / 86400000))
                const pct = Math.max(0, 100 - (daysLeft / 365) * 100)
                return <MaintenanceBar label="Assicurazione RCA" icon={Shield} pct={pct}
                  color={daysLeft < 30 ? 'var(--color-danger)' : daysLeft < 90 ? 'var(--color-warning)' : 'var(--color-success)'}
                  note={`${daysLeft}gg rimanenti`} delay={0.1} />
              })()}
              {taxEntry && (() => {
                const daysLeft = Math.max(0, Math.round((new Date(taxEntry.date) - new Date()) / 86400000))
                const pct = Math.max(0, 100 - (daysLeft / 365) * 100)
                return <MaintenanceBar label="Bollo Auto" icon={FileText} pct={pct}
                  color={daysLeft < 30 ? 'var(--color-danger)' : daysLeft < 60 ? 'var(--color-warning)' : 'var(--color-success)'}
                  note={`${daysLeft}gg rimanenti`} delay={0.2} />
              })()}
            </div>
          </Card>
        )}

        {/* ── Add form + Log ── */}
        <div className="grid md:grid-cols-3 gap-5 items-start">
          <div className="md:col-span-1 space-y-5">
            <Card padding="md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Inserisci Spesa</h3>
                {!showAddForm && <Button size="xs" variant="primary" icon={Plus} onClick={() => setShowAddForm(true)}>Aggiungi</Button>}
              </div>
              <AnimatePresence mode="wait">
                {showAddForm ? (
                  <motion.form key="form" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }} onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Tipo</label>
                      <select value={type} onChange={e => setType(e.target.value)}
                        className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]">
                        <option value="fuel">⛽ Rifornimento</option>
                        <option value="maintenance">🔧 Manutenzione</option>
                        <option value="insurance">🛡️ Assicurazione</option>
                        <option value="tax">📄 Bollo Auto</option>
                        <option value="other">🚗 Altro</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Data</label>
                      <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                        className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Importo (€)</label>
                        <input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required
                          className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Odometro (km)</label>
                        <input type="number" placeholder="125000" value={odometer} onChange={e => setOdometer(e.target.value)}
                          className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]" />
                      </div>
                    </div>
                    {type === 'fuel' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        className="grid grid-cols-2 gap-2 p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border-subtle)]">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase text-[var(--text-muted)]">Litri</label>
                          <input type="number" step="0.01" placeholder="0.00" value={liters} onChange={e => setLiters(e.target.value)}
                            className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase text-[var(--text-muted)]">€/litro</label>
                          <input type="number" step="0.001" placeholder="1.750" value={pricePerLiter} onChange={e => setPricePerLiter(e.target.value)}
                            className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none" />
                        </div>
                      </motion.div>
                    )}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Note</label>
                      <textarea rows={2} placeholder="Dettagli..." value={notes} onChange={e => setNotes(e.target.value)}
                        className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] resize-none" />
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <Button type="button" variant="ghost" size="xs" onClick={() => setShowAddForm(false)}>Annulla</Button>
                      <Button type="submit" variant="primary" size="xs" loading={submitting}>Salva</Button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-center py-6 text-[var(--text-muted)]">
                    <Car size={28} className="mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-bold opacity-40">Nessuna spesa ancora registrata.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {deadlines.length > 0 && (
              <Card padding="md" className="border-yellow-500/10 bg-yellow-500/5">
                <h3 className="text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: 'var(--color-warning)' }}>
                  <AlertTriangle size={13} /> Scadenze
                </h3>
                <div className="space-y-2">
                  {deadlines.map(d => {
                    const badge = getTypeBadge(d.type)
                    return (
                      <div key={d.id} className="flex justify-between items-center text-xs bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
                        <div>
                          <p className="font-bold text-[var(--text-primary)]">{badge.label}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">{format(new Date(d.date), 'dd MMM yyyy', { locale: it })}</p>
                        </div>
                        <span className="font-black text-[var(--text-primary)]">€ {parseFloat(d.amount).toFixed(2)}</span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* Log */}
          <div className="md:col-span-2">
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
                <div className="divide-y divide-[var(--border-subtle)]">
                  {logs.map((log, i) => {
                    const badge = getTypeBadge(log.type)
                    const Icon = badge.icon
                    return (
                      <motion.div key={log.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.03 }}
                        className="flex items-center justify-between py-3 group">
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
                              {log.notes && <><span>•</span><span className="truncate italic">"{log.notes}"</span></>}
                              {log.type === 'fuel' && log.liters && <><span>•</span><span className="font-semibold text-blue-500">{parseFloat(log.liters).toFixed(2)}L</span></>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-black text-[var(--text-primary)]">€ {parseFloat(log.amount).toFixed(2)}</span>
                          <button onClick={() => handleDelete(log.id)}
                            className="p-1 text-[var(--text-muted)] hover:text-[var(--color-danger)] opacity-0 group-hover:opacity-100 transition-all">
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
      </motion.div>
    </AnimatePresence>
  )
}

export default VehicleDashboard
