import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Car, Zap, ChevronDown, Settings2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { VEHICLE_TYPES } from '../Onboarding/StepVeicolo'

const FUEL_TYPES = [
  { value: 'gasoline', label: 'Benzina' },
  { value: 'diesel',   label: 'Diesel' },
  { value: 'electric', label: 'Elettrico' },
  { value: 'hybrid',   label: 'Ibrido' },
]

const PALETTE = [
  '#9aacc8', '#c8a09a', '#a8c8a0', '#c8c09a', '#a09ac8',
  '#c8b49a', '#1e1e28', '#f0ede8', '#b46243', '#4a90d9',
]

// ── Auto-guesser marca/modello → tipo 3D ─────────────────────────
const CITY_CAR_MODELS = [
  'peugeot 107','peugeot 108','peugeot 206','smart','fiat 500','fiat panda','fiat seicento','fiat punto',
  'toyota aygo','toyota yaris','volkswagen up','seat mii','seat ibiza','renault twingo','renault clio',
  'opel agila','opel corsa','mini','alfa romeo mito','kia picanto','kia rio','hyundai i10','hyundai i20',
  'dacia sandero','suzuki swift','mazda 2','ford fiesta','ford ka',
]
const HATCHBACK_MODELS = [
  'golf','polo','astra','civic','focus','megane','307','308','208','c3','c4','punto','grande punto',
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
  'giulia sw','stinger',
]
const ELECTRIC_MODELS = [
  'tesla','model 3','model s','model x','model y','id.3','id.4','id.5','ioniq','ioniq 5','ioniq 6',
  'kona electric','e-tron','taycan','i3','zoe','leaf','mustang mach-e','i4','ix','bz4x',
]

function guessVehicleTypeFromText(brand, model, name) {
  const text = `${brand ?? ''} ${model ?? ''} ${name ?? ''}`.toLowerCase()
  if (!text.trim()) return null
  if (ELECTRIC_MODELS.some(m => text.includes(m))) return 'electric'
  if (SUV_LARGE_MODELS.some(m => text.includes(m))) return 'suv_large'
  if (SUV_MODELS.some(m => text.includes(m))) return 'suv'
  if (WAGON_MODELS.some(m => text.includes(m))) return 'wagon'
  if (HATCHBACK_MODELS.some(m => text.includes(m))) return 'hatchback'
  if (CITY_CAR_MODELS.some(m => text.includes(m))) return 'city'
  return 'sedan'
}

// ── Helper: input field style ─────────────────────────────────────
const inputCls = 'w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 h-[42px] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]'
const labelCls = 'text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]'

function FieldGroup({ label, children }) {
  return (
    <div className="space-y-1">
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────
function AddVehicleModal({ onClose, onSaved, vehicle = null }) {
  const isEdit = Boolean(vehicle)

  // ── Dati base ─────────────────────────────────────────────────
  const [name, setName]               = useState(vehicle?.name             ?? '')
  const [brand, setBrand]             = useState(vehicle?.brand            ?? '')
  const [model, setModel]             = useState(vehicle?.model            ?? '')
  const [year, setYear]               = useState(vehicle?.year             ?? new Date().getFullYear())
  const [color, setColor]             = useState(vehicle?.color            ?? '#9aacc8')
  const [fuelType, setFuelType]       = useState(vehicle?.fuel_type        ?? 'gasoline')
  const [vehicleType, setVehicleType] = useState(vehicle?.vehicle_type     ?? 'sedan')
  const [plate, setPlate]             = useState(vehicle?.plate            ?? '')

  // ── Dati manutenzione ─────────────────────────────────────────
  const [tankCapacity, setTankCapacity]         = useState(vehicle?.tank_capacity_l       ?? 50)
  const [currentOdometer, setCurrentOdometer]   = useState(vehicle?.current_odometer      ?? '')
  const [oilIntervalKm, setOilIntervalKm]       = useState(vehicle?.oil_interval_km       ?? 15000)
  const [lastOilChangeKm, setLastOilChangeKm]   = useState(vehicle?.last_oil_change_km    ?? '')
  const [lastOilChangeDate, setLastOilChangeDate] = useState(vehicle?.last_oil_change_date ?? '')
  const [tireIntervalKm, setTireIntervalKm]     = useState(vehicle?.tire_interval_km      ?? 40000)
  const [lastTireChangeKm, setLastTireChangeKm] = useState(vehicle?.last_tire_change_km   ?? '')
  const [lastTireChangeDate, setLastTireChangeDate] = useState(vehicle?.last_tire_change_date ?? '')
  const [wiperIntervalMonths, setWiperIntervalMonths] = useState(vehicle?.wiper_interval_months ?? 18)
  const [lastWiperChangeDate, setLastWiperChangeDate] = useState(vehicle?.last_wiper_change_date ?? '')

  const [showMaintenance, setShowMaintenance] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  // ── Auto-guesser handlers ─────────────────────────────────────
  const handleNameChange = (val) => { setName(val); const g = guessVehicleTypeFromText(brand, model, val); if (g) setVehicleType(g) }
  const handleBrandChange = (val) => { setBrand(val); const g = guessVehicleTypeFromText(val, model, name); if (g) setVehicleType(g) }
  const handleModelChange = (val) => { setModel(val); const g = guessVehicleTypeFromText(brand, val, name); if (g) setVehicleType(g) }

  // ── Targa: formattatore e validatore ─────────────────────────
  // Formato italiano standard: AA 123 BB
  const formatPlate = (raw) => {
    // Pulisce, uppercase, rimuove spazi e non-alfanumerici
    const chars = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
    let result = ''
    for (let i = 0; i < Math.min(chars.length, 7); i++) {
      const ch = chars[i]
      if (i < 2 || i >= 5) {
        // Posizioni 0-1 e 5-6: solo lettere
        if (/[A-Z]/.test(ch)) result += ch
      } else {
        // Posizioni 2-4: solo cifre
        if (/[0-9]/.test(ch)) result += ch
      }
    }
    // Inserisce spazi: AB 123 CD
    let formatted = ''
    for (let i = 0; i < result.length; i++) {
      if (i === 2 || i === 5) formatted += ' '
      formatted += result[i]
    }
    return formatted
  }

  const isValidPlate = (p) => /^[A-Z]{2} \d{3} [A-Z]{2}$/.test(p)
  const plateComplete = plate.length === 9  // 'AB 123 CD' = 9 chars
  const plateError = plate.length > 0 && !isValidPlate(plate)

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Inserisci un nome per il veicolo'); return }
    if (plate && !isValidPlate(plate)) { toast.error('Targa non valida — formato: AB 123 CD'); return }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = {
        user_id:      user.id,
        name:         name.trim(),
        brand:        brand.trim()   || null,
        model:        model.trim()   || null,
        year:         year           ? parseInt(year) : null,
        color,
        fuel_type:    fuelType,
        vehicle_type: vehicleType,
        plate:        plate.trim()   || null,
        // Maintenance fields
        tank_capacity_l:        tankCapacity       ? parseInt(tankCapacity)       : 50,
        oil_interval_km:        oilIntervalKm      ? parseInt(oilIntervalKm)      : 15000,
        tire_interval_km:       tireIntervalKm     ? parseInt(tireIntervalKm)     : 40000,
        wiper_interval_months:  wiperIntervalMonths ? parseInt(wiperIntervalMonths) : 18,
        current_odometer:       currentOdometer    ? parseInt(currentOdometer)    : null,
        last_oil_change_km:     lastOilChangeKm    ? parseInt(lastOilChangeKm)    : null,
        last_oil_change_date:   lastOilChangeDate   || null,
        last_tire_change_km:    lastTireChangeKm   ? parseInt(lastTireChangeKm)   : null,
        last_tire_change_date:  lastTireChangeDate  || null,
        last_wiper_change_date: lastWiperChangeDate || null,
      }

      let error
      if (isEdit) {
        ;({ error } = await supabase.from('vehicles').update(payload).eq('id', vehicle.id).eq('user_id', user.id))
      } else {
        ;({ error } = await supabase.from('vehicles').insert(payload))
      }

      if (error) throw error
      toast.success(isEdit ? 'Veicolo aggiornato' : 'Veicolo aggiunto al garage!')
      onSaved()
      onClose()
    } catch (err) {
      console.error(err)
      toast.error('Errore nel salvataggio')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className="w-full max-w-md bg-[var(--bg-surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] shadow-[var(--shadow-lg)] overflow-hidden"
        style={{ maxHeight: '92dvh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-base font-black text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            {isEdit ? 'Modifica Veicolo' : 'Aggiungi al Garage'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="overflow-y-auto px-6 pb-6" style={{ maxHeight: 'calc(92dvh - 80px)' }}>
          <form id="vehicle-form" onSubmit={handleSubmit} className="space-y-4">

            {/* ── Sezione 1: Dati Base ── */}
            <FieldGroup label="Nome / Soprannome *">
              <input
                type="text" placeholder='Es. "La mia Golf" o "Panda rossa"'
                value={name} onChange={e => handleNameChange(e.target.value)} required
                className={inputCls}
              />
            </FieldGroup>

            <div className="grid grid-cols-2 gap-2">
              <FieldGroup label="Marca">
                <input type="text" placeholder="Es. Volkswagen"
                  value={brand} onChange={e => handleBrandChange(e.target.value)}
                  className={inputCls} />
              </FieldGroup>
              <FieldGroup label="Modello">
                <input type="text" placeholder="Es. Golf 7"
                  value={model} onChange={e => handleModelChange(e.target.value)}
                  className={inputCls} />
              </FieldGroup>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <FieldGroup label="Anno">
                <input type="number" min="1900" max={new Date().getFullYear() + 1}
                  value={year} onChange={e => setYear(e.target.value)}
                  className={inputCls} />
              </FieldGroup>
              <FieldGroup label="Carburante">
                <select value={fuelType} onChange={e => setFuelType(e.target.value)} className={inputCls}>
                  {FUEL_TYPES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </FieldGroup>
            </div>

            {/* Vehicle Type */}
            <div className="space-y-2">
              <label className={labelCls}>Tipo di Auto</label>
              <div className="grid grid-cols-4 gap-1.5">
                {VEHICLE_TYPES.map(t => (
                  <button key={t.id} type="button" onClick={() => setVehicleType(t.id)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all duration-150"
                    style={{
                      borderColor: vehicleType === t.id ? 'var(--color-primary)' : 'var(--border-subtle)',
                      background: vehicleType === t.id ? 'var(--color-primary-ghost)' : 'var(--bg-base)',
                    }}
                    title={t.label}
                  >
                    <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center text-[var(--text-primary)] mb-0.5">
                      {t.id === 'electric' ? <Zap size={15} className="text-amber-500" fill="currentColor" /> : <Car size={16} />}
                    </div>
                    <span className="text-[8px] font-bold text-[var(--text-muted)] text-center leading-tight line-clamp-1">
                      {t.label.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[var(--text-muted)] opacity-70">
                {VEHICLE_TYPES.find(t => t.id === vehicleType)?.examples}
              </p>
            </div>

            {/* Plate */}
            <div className="space-y-1">
              <label className={labelCls}>Targa (opzionale)</label>
              <input
                type="text"
                placeholder="AB 123 CD"
                value={plate}
                onChange={e => setPlate(formatPlate(e.target.value))}
                maxLength={9}
                className={`${inputCls} font-mono tracking-widest`}
                style={{
                  borderColor: plateError
                    ? 'var(--color-danger)'
                    : plateComplete
                    ? 'var(--color-success)'
                    : undefined,
                }}
              />
              {plateError && (
                <p className="text-[10px] font-bold" style={{ color: 'var(--color-danger)' }}>
                  Formato non valido — es. AB 123 CD
                </p>
              )}
              {plateComplete && !plateError && (
                <p className="text-[10px] font-bold" style={{ color: 'var(--color-success)' }}>
                  Targa valida
                </p>
              )}
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <label className={labelCls}>Colore Auto</label>
              <div className="flex gap-2 flex-wrap">
                {PALETTE.map(c => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    className="w-7 h-7 rounded-full border-2 transition-all duration-150 flex items-center justify-center"
                    style={{
                      background: c,
                      borderColor: color === c ? 'var(--color-primary)' : 'transparent',
                      transform: color === c ? 'scale(1.2)' : 'scale(1)',
                      boxShadow: color === c ? '0 0 0 2px var(--bg-surface)' : 'none',
                    }}
                  >
                    {color === c && <Check size={10} className="text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Sezione 2: Dati Manutenzione (collassabile) ── */}
            <div className="border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowMaintenance(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings2 size={14} className="text-[var(--color-primary)]" />
                  <span className="text-xs font-black text-[var(--text-primary)]">Dati Manutenzione</span>
                  <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wide px-1.5 py-0.5 rounded bg-[var(--bg-elevated)]">
                    opzionale
                  </span>
                </div>
                <motion.div animate={{ rotate: showMaintenance ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={14} className="text-[var(--text-muted)]" />
                </motion.div>
              </button>

              <AnimatePresence>
                {showMaintenance && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="px-4 pb-4 space-y-4 border-t border-[var(--border-subtle)] pt-4">

                      {/* Odometro attuale + Serbatoio */}
                      <div className="grid grid-cols-2 gap-2">
                        <FieldGroup label="Km attuali (odometro)">
                          <input type="number" min="0" placeholder="Es. 85000"
                            value={currentOdometer} onChange={e => setCurrentOdometer(e.target.value)}
                            className={inputCls} />
                        </FieldGroup>
                        <FieldGroup label="Capac. serbatoio (L)">
                          <input type="number" min="10" max="200" placeholder="Es. 50"
                            value={tankCapacity} onChange={e => setTankCapacity(e.target.value)}
                            className={inputCls} />
                        </FieldGroup>
                      </div>

                      {/* Cambio Olio */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-primary)]">
                          Olio Motore
                        </p>
                        <FieldGroup label="Intervallo cambio (km)">
                          <input type="number" min="1000" max="50000" placeholder="15000"
                            value={oilIntervalKm} onChange={e => setOilIntervalKm(e.target.value)}
                            className={inputCls} />
                        </FieldGroup>
                        <div className="grid grid-cols-2 gap-2">
                          <FieldGroup label="Ultimo cambio — data">
                            <input type="date" value={lastOilChangeDate}
                              onChange={e => setLastOilChangeDate(e.target.value)}
                              className={inputCls} />
                          </FieldGroup>
                          <FieldGroup label="Ultimo cambio — km">
                            <input type="number" min="0" placeholder="Es. 75000"
                              value={lastOilChangeKm} onChange={e => setLastOilChangeKm(e.target.value)}
                              className={inputCls} />
                          </FieldGroup>
                        </div>
                      </div>

                      {/* Cambio Gomme */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-primary)]">
                          Pneumatici
                        </p>
                        <FieldGroup label="Intervallo cambio (km)">
                          <input type="number" min="5000" max="100000" placeholder="40000"
                            value={tireIntervalKm} onChange={e => setTireIntervalKm(e.target.value)}
                            className={inputCls} />
                        </FieldGroup>
                        <div className="grid grid-cols-2 gap-2">
                          <FieldGroup label="Ultimo cambio — data">
                            <input type="date" value={lastTireChangeDate}
                              onChange={e => setLastTireChangeDate(e.target.value)}
                              className={inputCls} />
                          </FieldGroup>
                          <FieldGroup label="Ultimo cambio — km">
                            <input type="number" min="0" placeholder="Es. 50000"
                              value={lastTireChangeKm} onChange={e => setLastTireChangeKm(e.target.value)}
                              className={inputCls} />
                          </FieldGroup>
                        </div>
                      </div>

                      {/* Tergicristalli */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-primary)]">
                          Tergicristalli / Spazzole
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <FieldGroup label="Intervallo (mesi)">
                            <input type="number" min="1" max="60" placeholder="18"
                              value={wiperIntervalMonths} onChange={e => setWiperIntervalMonths(e.target.value)}
                              className={inputCls} />
                          </FieldGroup>
                          <FieldGroup label="Ultimo cambio — data">
                            <input type="date" value={lastWiperChangeDate}
                              onChange={e => setLastWiperChangeDate(e.target.value)}
                              className={inputCls} />
                          </FieldGroup>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>Annulla</Button>
              <Button form="vehicle-form" type="submit" variant="primary" size="sm" loading={saving}>
                {isEdit ? 'Salva Modifiche' : 'Aggiungi'}
              </Button>
            </div>

          </form>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default AddVehicleModal
