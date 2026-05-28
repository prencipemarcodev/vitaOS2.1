import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Car, Plus, Trash2, TrendingUp, Gauge, Droplet,
  Wrench, Shield, FileText, AlertTriangle, ArrowLeftRight,
  ChevronLeft, ChevronRight, Pencil
} from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import AnimatedNumber from '@/components/ui/AnimatedNumber'
import Car3DViewer from './Car3DViewer'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { useConfirmStore } from '@/store/useConfirmStore'

// ── Mappa intelligente marca/modello → tipo 3D ────────────────────
const CITY_CAR_MODELS = [
  'peugeot 107','peugeot 108','peugeot 206','smart','fiat 500','fiat panda','fiat seicento','fiat punto',
  'toyota aygo','toyota yaris','volkswagen up','seat mii','seat ibiza','renault twingo','renault clio',
  'opel agila','opel corsa','mini','alfa romeo mito','kia picanto','kia rio','hyundai i10','hyundai i20',
  'dacia sandero','suzuki swift','mazda 2','ford fiesta','ford ka',
]
const HATCHBACK_MODELS = [
  'golf','polo','astra','civic','focus','megane','307','308','208','308','c3','c4','punto','grande punto',
  'bravo','giulietta','tipo','clio','zafira','1 serie','2 serie','a1','a3','leon','207','peugeot 207',
]
const SUV_MODELS = [
  'suv','crossover','qashqai','tucson','sportage','tiguan','kuga','hr-v','cr-v','rav4','x-trail',
  'koleos','duster','karoq','ateca','arona','t-roc','t-cross','captur','mokka','ecosport','puma',
  'grandland','3008','5008','2008','compass','renegade','500x','stelvio','tonale','levante',
]
const SUV_LARGE_MODELS = [
  'defender','discovery','range rover','x5','x6','x7','q7','q8','glc','gle','gls','ml','gl',
  'kodiaq','sorento','santa fe','terracan','forester','outback','4runner','land cruiser','pajero',
  'grand cherokee','wrangler','durango','navigator','expedition','tahoe','yukon','escalade',
]
const WAGON_MODELS = [
  'avant','touring','break','sw','kombi','estate','allroad','4 serie gran coupe','passat variant',
  'giulia sw','stinger','modelo s',
]
const ELECTRIC_MODELS = [
  'tesla','model 3','model s','model x','model y','id.3','id.4','id.5','ioniq','ioniq 5','ioniq 6',
  'kona electric','e-tron','taycan','i3','zoe','leaf','mustang mach-e','i4','ix','bz4x',
]

function guessVehicleType(vehicle) {
  if (vehicle?.vehicle_type) return vehicle.vehicle_type
  const name = `${vehicle?.make ?? ''} ${vehicle?.model ?? ''} ${vehicle?.name ?? ''}`.toLowerCase()
  if (ELECTRIC_MODELS.some(m => name.includes(m))) return 'electric'
  if (SUV_LARGE_MODELS.some(m => name.includes(m))) return 'suv_large'
  if (SUV_MODELS.some(m => name.includes(m))) return 'suv'
  if (WAGON_MODELS.some(m => name.includes(m))) return 'wagon'
  if (HATCHBACK_MODELS.some(m => name.includes(m))) return 'hatchback'
  if (CITY_CAR_MODELS.some(m => name.includes(m))) return 'city'
  return 'sedan'
}


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
function VehicleDashboard({
  vehicle,
  vehicles = [],
  activeIndex = 0,
  onSelect,
  onEdit,
}) {
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

      const odometerVal = odometer ? parseInt(odometer) : null
      const notesVal    = notes.trim() || null

      // ── Determina se il log è una manutenzione specifica ──
      const notesLow  = notesVal?.toLowerCase() ?? ''
      const isOilLog  = type === 'maintenance' && (notesLow.includes('olio') || notesLow.includes('oil') || notesLow.includes('cambio olio'))
      const isTireLog = type === 'maintenance' && (notesLow.includes('gomm') || notesLow.includes('pneumat') || notesLow.includes('ruot') || notesLow.includes('tyre') || notesLow.includes('tire'))
      const isWiperLog= type === 'maintenance' && (notesLow.includes('tergi') || notesLow.includes('spazzol') || notesLow.includes('wiper'))

      const { error } = await supabase.from('vehicle_logs').insert({
        user_id:        user.id,
        vehicle_id:     vehicle.id,
        date, type,
        amount:         parseFloat(amount),
        odometer:       odometerVal,
        liters:         type === 'fuel' && liters ? parseFloat(liters) : null,
        price_per_liter:type === 'fuel' && pricePerLiter ? parseFloat(pricePerLiter) : null,
        notes:          notesVal,
      })
      if (error) throw error

      // ── Auto-aggiorna i campi di manutenzione sul veicolo ──────────
      const vehicleUpdates = {}

      // Aggiorna current_odometer se il nuovo valore è maggiore
      if (odometerVal && odometerVal > (vehicle.current_odometer ?? 0)) {
        vehicleUpdates.current_odometer = odometerVal
      }
      // Aggiorna last_oil_change se è un cambio olio
      if (isOilLog) {
        vehicleUpdates.last_oil_change_date = date
        if (odometerVal) vehicleUpdates.last_oil_change_km = odometerVal
      }
      // Aggiorna last_tire_change se sono le gomme
      if (isTireLog) {
        vehicleUpdates.last_tire_change_date = date
        if (odometerVal) vehicleUpdates.last_tire_change_km = odometerVal
      }
      // Aggiorna last_wiper_change se sono le spazzole
      if (isWiperLog) {
        vehicleUpdates.last_wiper_change_date = date
      }

      if (Object.keys(vehicleUpdates).length > 0) {
        await supabase.from('vehicles').update(vehicleUpdates).eq('id', vehicle.id).eq('user_id', user.id)
      }

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
    const maxOdo = odometers.length > 0 ? Math.max(...odometers) : (vehicle?.current_odometer ?? 0)
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
  }, [logs, vehicle?.current_odometer])

  const deadlines = useMemo(() =>
    logs.filter(l => (l.type === 'insurance' || l.type === 'tax') && new Date(l.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  , [logs])

  // ── Diagnostica smart — algoritmo preciso ────────────────────────
  const diagnosticData = useMemo(() => {
    // Odometro attuale: prendi il massimo tra i log e il campo vehicle
    const odometers = logs.map(l => l.odometer).filter(o => o && o > 0)
    const currentOdo = Math.max(
      vehicle?.current_odometer ?? 0,
      odometers.length > 0 ? Math.max(...odometers) : 0
    )

    // ── 1. OLIO MOTORE ────────────────────────────────────────────
    const oilIntervalKm = vehicle?.oil_interval_km ?? 15000
    // last_oil_change_km da vehicle oppure dai log di manutenzione (parola chiave olio)
    const oilLogsKm = logs
      .filter(l => l.type === 'maintenance' && l.odometer &&
        (l.notes?.toLowerCase().includes('olio') || l.notes?.toLowerCase().includes('oil') || l.notes?.toLowerCase().includes('cambio olio')))
      .map(l => l.odometer)
    const lastOilKm = Math.max(
      vehicle?.last_oil_change_km ?? 0,
      oilLogsKm.length > 0 ? Math.max(...oilLogsKm) : 0
    )
    let oilStatus = 'success', oilText = 'Monitorato'
    if (lastOilKm > 0 && currentOdo > 0) {
      const kmSinceOil = currentOdo - lastOilKm
      const kmLeftOil  = oilIntervalKm - kmSinceOil
      const pctOil     = Math.min(100, (kmSinceOil / oilIntervalKm) * 100)
      oilStatus = pctOil >= 90 ? 'danger' : pctOil >= 65 ? 'warning' : 'success'
      oilText   = pctOil >= 100
        ? `Superato di ${Math.abs(kmLeftOil).toLocaleString('it')} km`
        : pctOil >= 90
        ? 'Cambio urgente'
        : `~${Math.round(kmLeftOil / 100) * 100} km rimasti`
    } else if (vehicle?.last_oil_change_date) {
      // fallback: solo data
      const monthsSince = (Date.now() - new Date(vehicle.last_oil_change_date)) / (1000 * 60 * 60 * 24 * 30)
      oilStatus = monthsSince > 18 ? 'danger' : monthsSince > 12 ? 'warning' : 'success'
      oilText   = `${Math.round(monthsSince)} mesi fa`
    }

    // ── 2. RIFORNIMENTO — algoritmo L/100km preciso ───────────────
    const fuelLogs = logs
      .filter(l => l.type === 'fuel')
      .sort((a, b) => {
        // Ordina per odometro se disponibile, altrimenti per data
        if (a.odometer && b.odometer) return b.odometer - a.odometer
        return new Date(b.date) - new Date(a.date)
      })

    let fuelStatus = 'warning', fuelText = 'Nessun dato'

    const fuelWithOdo = fuelLogs.filter(l => l.odometer && l.liters)
    if (fuelWithOdo.length >= 2) {
      // Algoritmo preciso: calcola consumo ciclo per ciclo
      const sorted = [...fuelWithOdo].sort((a, b) => b.odometer - a.odometer)
      const cycles = []
      for (let i = 0; i < sorted.length - 1; i++) {
        const kmFatti = sorted[i].odometer - sorted[i + 1].odometer
        const litri   = parseFloat(sorted[i + 1].liters) // litri inseriti al rifornimento precedente
        if (kmFatti > 0 && litri > 0) {
          cycles.push({ consumption: (litri / kmFatti) * 100, km: kmFatti })
        }
      }
      if (cycles.length > 0) {
        // Media pesata per km percorsi
        const totalKmCycles = cycles.reduce((s, c) => s + c.km, 0)
        const avgL100 = cycles.reduce((s, c) => s + c.consumption * (c.km / totalKmCycles), 0)
        // Stima litri rimasti nel serbatoio
        const tankCap = vehicle?.tank_capacity_l ?? 50
        const lastFuel = sorted[0]
        const kmDallUltimoRiforn = currentOdo > 0 ? currentOdo - lastFuel.odometer : 0
        const litriUsati   = (kmDallUltimoRiforn * avgL100) / 100
        const litriRimasti = Math.max(0, tankCap - litriUsati)
        const kmAutonomia  = Math.round((litriRimasti / avgL100) * 100)
        const pctTank = (litriRimasti / tankCap) * 100
        fuelStatus = pctTank < 15 ? 'danger' : pctTank < 35 ? 'warning' : 'success'
        fuelText   = pctTank < 5
          ? 'Rifornire ora'
          : `~${kmAutonomia} km rimasti`
      }
    } else if (fuelLogs.length === 0) {
      fuelText = 'Nessun dato'; fuelStatus = 'warning'
    } else if (fuelLogs.length === 1) {
      const daysSince = Math.floor((Date.now() - new Date(fuelLogs[0].date)) / 86400000)
      fuelText = `${daysSince}gg fa`
      fuelStatus = daysSince > 20 ? 'warning' : 'success'
    } else {
      // Fallback intervallo temporale medio
      const intervals = []
      for (let i = 0; i < fuelLogs.length - 1; i++) {
        const d = (new Date(fuelLogs[i].date) - new Date(fuelLogs[i + 1].date)) / 86400000
        if (d > 0) intervals.push(d)
      }
      const avgInterval   = intervals.reduce((s, v) => s + v, 0) / intervals.length
      const daysSinceLast = (Date.now() - new Date(fuelLogs[0].date)) / 86400000
      const pctUsed       = Math.min(100, (daysSinceLast / avgInterval) * 100)
      const daysLeft      = Math.max(0, Math.round(avgInterval - daysSinceLast))
      fuelStatus = pctUsed >= 90 ? 'danger' : pctUsed >= 65 ? 'warning' : 'success'
      fuelText   = pctUsed >= 90 && daysLeft <= 0 ? 'Rifornire ora' : `~${daysLeft}gg al pieno`
    }

    // ── 3. PNEUMATICI ────────────────────────────────────────────
    const tireIntervalKm = vehicle?.tire_interval_km ?? 40000
    const tireLogsKm = logs
      .filter(l => l.type === 'maintenance' && l.odometer &&
        (l.notes?.toLowerCase().includes('gomm') || l.notes?.toLowerCase().includes('pneumat') ||
         l.notes?.toLowerCase().includes('ruot') || l.notes?.toLowerCase().includes('tyre') || l.notes?.toLowerCase().includes('tire')))
      .map(l => l.odometer)
    const lastTireKm = Math.max(
      vehicle?.last_tire_change_km ?? 0,
      tireLogsKm.length > 0 ? Math.max(...tireLogsKm) : 0
    )
    const lastTireDate = vehicle?.last_tire_change_date
    let tiresStatus = 'success', tiresText = 'Stato Buono'
    if (lastTireKm > 0 && currentOdo > 0) {
      const kmSinceTire = currentOdo - lastTireKm
      const kmLeftTire  = tireIntervalKm - kmSinceTire
      const pctTire     = Math.min(100, (kmSinceTire / tireIntervalKm) * 100)
      // Considera anche l'età in anni (gomme degradano indipendentemente dai km)
      const yearsSinceTire = lastTireDate ? (Date.now() - new Date(lastTireDate)) / (365.25 * 86400000) : 0
      const ageTire = Math.max(pctTire, yearsSinceTire > 6 ? 100 : yearsSinceTire > 4 ? 80 : 0)
      tiresStatus = ageTire >= 90 ? 'danger' : ageTire >= 65 ? 'warning' : 'success'
      tiresText   = ageTire >= 100
        ? 'Sostituzione urgente'
        : `~${Math.round(kmLeftTire / 100) * 100} km rimasti`
    } else if (lastTireDate) {
      const yearsSince = (Date.now() - new Date(lastTireDate)) / (365.25 * 86400000)
      tiresStatus = yearsSince > 6 ? 'danger' : yearsSince > 4 ? 'warning' : 'success'
      tiresText   = `Sost. ${format(new Date(lastTireDate), 'MM/yyyy')}`
    }

    // ── 4. TERGICRISTALLI ────────────────────────────────────────
    const wiperIntervalMonths = vehicle?.wiper_interval_months ?? 18
    // Prendi la data più recente tra vehicle e log
    const wiperLogDates = logs
      .filter(l => l.notes?.toLowerCase().includes('tergi') || l.notes?.toLowerCase().includes('spazzol') || l.notes?.toLowerCase().includes('wiper'))
      .map(l => new Date(l.date).getTime())
    const vehicleWiperTs = vehicle?.last_wiper_change_date ? new Date(vehicle.last_wiper_change_date).getTime() : 0
    const lastWiperTs = Math.max(vehicleWiperTs, wiperLogDates.length > 0 ? Math.max(...wiperLogDates) : 0)
    let wipersStatus = 'success', wipersText = 'Nessun dato'
    if (lastWiperTs > 0) {
      const monthsSinceWiper = (Date.now() - lastWiperTs) / (1000 * 60 * 60 * 24 * 30.44)
      const pctWiper         = Math.min(100, (monthsSinceWiper / wiperIntervalMonths) * 100)
      wipersStatus = pctWiper >= 90 ? 'danger' : pctWiper >= 65 ? 'warning' : 'success'
      const mesiRimasti = Math.max(0, Math.round(wiperIntervalMonths - monthsSinceWiper))
      wipersText = pctWiper >= 100
        ? 'Sostituzione urgente'
        : pctWiper >= 90
        ? `Cambia presto (${mesiRimasti}m)`
        : `${Math.round(monthsSinceWiper)} mesi fa`
    } else {
      wipersText = 'Non registrato'
    }

    return {
      oil:    { status: oilStatus,    label: oilText },
      fuel:   { status: fuelStatus,   label: fuelText },
      tires:  { status: tiresStatus,  label: tiresText },
      wipers: { status: wipersStatus, label: wipersText },
    }
  }, [logs, vehicle])

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

  const vehicleType3D = guessVehicleType(vehicle)

    const touchStartX = useRef(0)

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeIndex < vehicles.length - 1) {
        onSelect?.(activeIndex + 1)
      } else if (diff < 0 && activeIndex > 0) {
        onSelect?.(activeIndex - 1)
      }
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Car Viewer con controlli 3D e navigazione ── */}
      <Card padding="none" className="overflow-hidden relative" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: vehicle.color }} />
            <span className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">
              Visualizzazione 3D
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
              className="relative animate-fadeIn"
            >
              {/* 3D Viewer */}
              <Car3DViewer
                vehicleId={vehicle.id}
                vehicleType={vehicleType3D}
                color={vehicleColor}
                onColorChange={setVehicleColor}
                label={vehicle.name}
                className="mx-0 rounded-none"
                diagnosticData={diagnosticData}
              />

              {/* ── Strip info veicolo — overlay in basso, stile player ── */}
              <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none select-none"
                style={{
                  background: 'linear-gradient(to top, var(--bg-surface) 0%, rgba(var(--bg-surface-rgb, 255,255,255), 0.82) 55%, transparent 100%)',
                  backdropFilter: 'blur(0px)',
                  padding: '28px 16px 14px',
                }}>
                <div className="flex items-end justify-between gap-3">
                  {/* Sinistra: nome + marca/modello/anno */}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: vehicleColor }} />
                      <p className="text-sm font-black text-[var(--text-primary)] leading-tight truncate">
                        {vehicle.name}
                      </p>
                      <button
                        onClick={() => onEdit?.(vehicle)}
                        className="p-1 rounded bg-black/5 dark:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors pointer-events-auto shrink-0"
                        title="Modifica veicolo"
                        type="button"
                      >
                        <Pencil size={11} />
                      </button>
                    </div>
                    {(vehicle.brand || vehicle.model) && (
                      <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider leading-none pl-4">
                        {[vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  {/* Destra: targa + badge carburante */}
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    {vehicle.plate && (
                      <span className="px-2 py-0.5 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded font-mono text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
                        {vehicle.plate}
                      </span>
                    )}
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-[var(--color-primary-ghost)] text-[var(--color-primary)]">
                      {vehicle.fuel_type === 'gasoline' ? 'Benzina' :
                       vehicle.fuel_type === 'diesel' ? 'Diesel' :
                       vehicle.fuel_type === 'electric' ? 'Elettrico' : 'Ibrido'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Frecce di navigazione Fluttuanti */}
              {vehicles.length > 1 && (
                <>
                  {activeIndex > 0 && (
                    <button
                      onClick={() => onSelect?.(activeIndex - 1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[var(--bg-surface)]/80 hover:bg-[var(--bg-surface)] backdrop-blur border border-[var(--border-subtle)]/50 flex items-center justify-center text-[var(--text-primary)] shadow-sm transition-all hover:scale-105 active:scale-95"
                      title="Veicolo precedente"
                      type="button"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  {activeIndex < vehicles.length - 1 && (
                    <button
                      onClick={() => onSelect?.(activeIndex + 1)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[var(--bg-surface)]/80 hover:bg-[var(--bg-surface)] backdrop-blur border border-[var(--border-subtle)]/50 flex items-center justify-center text-[var(--text-primary)] shadow-sm transition-all hover:scale-105 active:scale-95"
                      title="Veicolo successivo"
                      type="button"
                    >
                      <ChevronRight size={18} />
                    </button>
                  )}
                </>
              )}

              <div className="h-px bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent mx-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* ── Resto del contenuto animato al cambio veicolo ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={vehicle.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="space-y-5"
        >

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
        {hasData && (
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Salute Veicolo</h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-lg"
                style={{
                  background: diagnosticData.oil?.status === 'danger' ? 'rgba(224,82,82,0.1)' : diagnosticData.oil?.status === 'warning' ? 'rgba(212,160,23,0.1)' : 'rgba(61,153,112,0.1)',
                  color: diagnosticData.oil?.status === 'danger' ? 'var(--color-danger)' : diagnosticData.oil?.status === 'warning' ? 'var(--color-warning)' : 'var(--color-success)'
                }}>
                {diagnosticData.oil?.status === 'danger' ? 'Attenzione' : diagnosticData.oil?.status === 'warning' ? 'Verifica' : 'Ottimo'}
              </span>
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
                        <option value="fuel">Rifornimento</option>
                        <option value="maintenance">Manutenzione</option>
                        <option value="insurance">Assicurazione</option>
                        <option value="tax">Bollo Auto</option>
                        <option value="other">Altro</option>
                      </select>
                    </div>
                    {/* Shortcut manutenzione rapida */}
                    {type === 'maintenance' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-1.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Accesso rapido</p>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: 'Cambio Olio', note: 'Cambio olio motore' },
                            { label: 'Cambio Gomme', note: 'Sostituzione pneumatici' },
                            { label: 'Spazzole Tergi', note: 'Sostituzione spazzole tergicristalli' },
                            { label: 'Filtro Aria', note: 'Sostituzione filtro aria' },
                            { label: 'Pastiglie Freno', note: 'Sostituzione pastiglie freno' },
                          ].map(({ label, note }) => (
                            <button key={label} type="button"
                              onClick={() => setNotes(note)}
                              className="text-[9px] font-bold px-2 py-1 rounded-lg border transition-colors"
                              style={{
                                borderColor: notes === note ? 'var(--color-primary)' : 'var(--border-subtle)',
                                background: notes === note ? 'var(--color-primary-ghost)' : 'var(--bg-base)',
                                color: notes === note ? 'var(--color-primary)' : 'var(--text-muted)',
                              }}
                            >{label}</button>
                          ))}
                        </div>
                      </motion.div>
                    )}
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
    </div>
  )
}

export default VehicleDashboard
