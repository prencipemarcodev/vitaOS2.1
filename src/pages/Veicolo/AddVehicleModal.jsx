import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { X, Check, Car, Zap } from 'lucide-react'
import Button from '@/components/ui/Button'
import { VEHICLE_TYPES } from '../Onboarding/StepVeicolo'

const FUEL_TYPES = [
  { value: 'gasoline', label: 'Benzina' },
  { value: 'diesel',   label: 'Diesel' },
  { value: 'electric', label: 'Elettrico' },
  { value: 'hybrid',   label: 'Ibrido' },
]

const PALETTE = [
  '#9aacc8', // slate blue (default)
  '#c8a09a', // warm rose
  '#a8c8a0', // sage green
  '#c8c09a', // warm sand
  '#a09ac8', // lavender
  '#c8b49a', // caramel
  '#1e1e28', // deep dark
  '#f0ede8', // off-white
  '#b46243', // VitaOS brand
  '#4a90d9', // sky blue
]

// ── Mappa intelligente marca/modello → tipo 3D per auto-guesser ──
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

function AddVehicleModal({ onClose, onSaved, vehicle = null }) {
  const isEdit = Boolean(vehicle)
  const [name, setName]             = useState(vehicle?.name         ?? '')
  const [brand, setBrand]           = useState(vehicle?.brand        ?? '')
  const [model, setModel]           = useState(vehicle?.model        ?? '')
  const [year, setYear]             = useState(vehicle?.year         ?? new Date().getFullYear())
  const [color, setColor]           = useState(vehicle?.color        ?? '#9aacc8')
  const [fuelType, setFuelType]     = useState(vehicle?.fuel_type    ?? 'gasoline')
  const [vehicleType, setVehicleType] = useState(vehicle?.vehicle_type ?? 'sedan')
  const [plate, setPlate]           = useState(vehicle?.plate        ?? '')
  const [saving, setSaving]         = useState(false)

  // Handlers intelligenti per auto-guesser live
  const handleNameChange = (val) => {
    setName(val)
    const guessed = guessVehicleTypeFromText(brand, model, val)
    if (guessed) setVehicleType(guessed)
  }

  const handleBrandChange = (val) => {
    setBrand(val)
    const guessed = guessVehicleTypeFromText(val, model, name)
    if (guessed) setVehicleType(guessed)
  }

  const handleModelChange = (val) => {
    setModel(val)
    const guessed = guessVehicleTypeFromText(brand, val, name)
    if (guessed) setVehicleType(guessed)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Inserisci un nome per il veicolo'); return }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = {
        user_id:      user.id,
        name:         name.trim(),
        brand:        brand.trim() || null,
        model:        model.trim() || null,
        year:         year ? parseInt(year) : null,
        color,
        fuel_type:    fuelType,
        vehicle_type: vehicleType,
        plate:        plate.trim() || null,
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
        className="w-full max-w-md bg-[var(--bg-surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] shadow-[var(--shadow-lg)] p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-black text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            {isEdit ? 'Modifica Veicolo' : 'Aggiungi al Garage'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Nome / Soprannome *</label>
            <input
              type="text" placeholder='Es. "La mia Golf" o "Panda rossa"'
              value={name} onChange={e => handleNameChange(e.target.value)} required
              className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 h-[42px] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          {/* Brand + Model */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Marca</label>
              <input
                type="text" placeholder="Es. Volkswagen"
                value={brand} onChange={e => handleBrandChange(e.target.value)}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 h-[42px] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Modello</label>
              <input
                type="text" placeholder="Es. Golf 7"
                value={model} onChange={e => handleModelChange(e.target.value)}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 h-[42px] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              />
            </div>
          </div>

          {/* Year + Fuel */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Anno</label>
              <input
                type="number" min="1900" max={new Date().getFullYear() + 1}
                value={year} onChange={e => setYear(e.target.value)}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 h-[42px] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Carburante</label>
              <select
                value={fuelType} onChange={e => setFuelType(e.target.value)}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 h-[42px] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              >
                {FUEL_TYPES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          </div>

          {/* Vehicle Type */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Tipo di Auto</label>
            <div className="grid grid-cols-4 gap-1.5">
              {VEHICLE_TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setVehicleType(t.id)}
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
            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Targa (opzionale)</label>
            <input
              type="text" placeholder="Es. AB 123 CD"
              value={plate} onChange={e => setPlate(e.target.value.toUpperCase())}
              className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 h-[42px] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] font-mono tracking-widest"
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Colore Auto</label>
            <div className="flex gap-2 flex-wrap">
              {PALETTE.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
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

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>Annulla</Button>
            <Button type="submit" variant="primary" size="sm" loading={saving}>
              {isEdit ? 'Salva Modifiche' : 'Aggiungi'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default AddVehicleModal
