import { motion } from 'framer-motion'
import { Car, Check } from 'lucide-react'

// ── Categorie auto ──────────────────────────────────────────────
export const VEHICLE_TYPES = [
  {
    id: 'city',
    label: 'Citycar / Utilitaria',
    examples: 'Fiat Panda, 500, VW Polo',
    modelFile: 'city.glb',
    svgPath: 'M20 54 L20 44 Q22 38 30 35 L37 33 L163 33 L170 37 L177 44 L177 54 Z M52 33 L59 18 Q62 15 66 14 L128 14 Q132 14 135 17 L144 33 Z',
    aspect: 'compact',   // proporzioni visive
  },
  {
    id: 'hatchback',
    label: 'Berlina Compatta',
    examples: 'VW Golf, Ford Focus, Toyota Corolla',
    modelFile: 'hatchback.glb',
    svgPath: 'M18 56 L18 44 Q21 37 32 34 L40 32 L170 32 L179 37 L186 46 L186 56 Z M55 32 L65 16 Q69 13 74 12 L136 12 Q141 12 145 16 L157 32 Z',
    aspect: 'balanced',
  },
  {
    id: 'sedan',
    label: 'Berlina',
    examples: 'BMW 3 Series, Audi A4, Mercedes C',
    modelFile: 'sedan.glb',
    svgPath: 'M16 56 L16 44 Q19 37 31 34 L40 32 L175 32 L185 37 L192 46 L192 56 Z M58 32 L68 17 Q72 14 78 13 L132 13 Q138 13 143 17 L155 32 Z',
    aspect: 'long',
  },
  {
    id: 'wagon',
    label: 'Station Wagon',
    examples: 'VW Passat Variant, Volvo V60',
    modelFile: 'wagon.glb',
    svgPath: 'M15 57 L15 44 Q18 37 30 34 L39 32 L180 32 L190 37 L196 46 L196 57 Z M50 32 L60 17 Q64 14 70 13 L168 13 Q173 14 176 17 L180 32 Z',
    aspect: 'long',
  },
  {
    id: 'suv',
    label: 'SUV / Crossover',
    examples: 'Jeep Renegade, Peugeot 3008, Nissan Qashqai',
    modelFile: 'suv.glb',
    svgPath: 'M18 60 L18 45 Q21 36 33 33 L42 31 L168 31 L178 36 L185 47 L185 60 Z M46 31 L55 14 Q59 10 65 9 L143 9 Q149 10 153 14 L162 31 Z',
    aspect: 'tall',
  },
  {
    id: 'suv_large',
    label: 'SUV Grande',
    examples: 'BMW X5, Volvo XC90, Touareg',
    modelFile: 'suv_large.glb',
    svgPath: 'M16 62 L16 46 Q19 36 32 32 L42 30 L172 30 L182 35 L190 47 L190 62 Z M44 30 L54 12 Q58 8 65 7 L143 7 Q150 8 154 12 L164 30 Z',
    aspect: 'tall',
  },
  {
    id: 'electric',
    label: 'Elettrica',
    examples: 'Tesla Model 3, VW ID.4, Fiat 500e',
    modelFile: 'electric.glb',
    svgPath: 'M18 55 L18 44 Q21 38 32 35 L40 33 L172 33 L181 38 L187 46 L187 55 Z M57 33 L66 18 Q70 15 76 14 L132 14 Q138 15 142 18 L152 33 Z',
    aspect: 'balanced',
    badge: '⚡',
  },
]

// ── Mini SVG per ogni categoria ─────────────────────────────────
function MiniCarSVG({ type, color = '#9aacc8', active = false }) {
  const id = type.id.replace('_', '-')
  const wheelColor = '#2a2a38'
  const glassColor = 'rgba(140,190,240,0.25)'

  return (
    <svg viewBox="0 0 210 75" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 130 }} aria-hidden="true">
      <defs>
        <linearGradient id={`ob-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={active ? '1' : '0.7'} />
          <stop offset="100%" stopColor={color} stopOpacity={active ? '0.7' : '0.45'} />
        </linearGradient>
      </defs>
      {/* Shadow */}
      <ellipse cx="105" cy="73" rx="82" ry="4" fill="rgba(0,0,0,0.08)" />
      {/* Body */}
      <path d={type.svgPath} fill={`url(#ob-${id})`} />
      {/* Glass (approximate — same path slightly smaller, top half) */}
      <rect x="58" y="13" width="90" height="18" rx="2.5" fill={glassColor} />
      {/* Headlight */}
      <rect x={type.aspect === 'long' ? 183 : type.aspect === 'compact' ? 168 : 176}
        y="41" width="8" height="5" rx="2"
        fill="rgba(255,245,180,0.9)" />
      {/* Taillight */}
      <rect x="22" y="41" width="7" height="5" rx="2" fill="rgba(220,60,60,0.8)" />
      {/* Wheels */}
      {[55, 155].map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy={63} r={type.aspect === 'tall' ? 13 : 11} fill={wheelColor} />
          <circle cx={cx} cy={63} r={type.aspect === 'tall' ? 6 : 5} fill="#48485a" />
          <circle cx={cx} cy={63} r="2" fill="rgba(255,255,255,0.3)" />
        </g>
      ))}
    </svg>
  )
}

// ── Step principale ─────────────────────────────────────────────
function StepVeicolo({ formData, updateFormData }) {
  const selected = formData.vehicle_type ?? null
  const hasVehicle = formData.has_vehicle ?? null // null = non scelto, true = sì, false = no

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--color-primary-ghost)' }}
        >
          <Car size={28} className="text-[var(--color-primary)]" />
        </motion.div>
        <h2 className="text-2xl font-medium text-[var(--text-primary)] mb-2"
          style={{ fontFamily: 'var(--font-display)' }}>
          Hai un'auto?
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          VitaOS può tracciare spese, manutenzioni e consumo del tuo veicolo.
        </p>
      </div>

      {/* Sì / No */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex gap-3"
      >
        {[
          { value: true, label: 'Sì, ho un\'auto', emoji: '🚗' },
          { value: false, label: 'No, per ora no', emoji: '🚶' },
        ].map(({ value, label, emoji }) => (
          <button
            key={String(value)}
            onClick={() => updateFormData({ has_vehicle: value, vehicle_type: value ? selected : null })}
            className="flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-[var(--radius-lg)] border-2 transition-all duration-200"
            style={{
              borderColor: hasVehicle === value ? 'var(--color-primary)' : 'var(--border-subtle)',
              background: hasVehicle === value ? 'var(--color-primary-ghost)' : 'var(--bg-surface)',
            }}
          >
            <span className="text-2xl">{emoji}</span>
            <span className="text-xs font-bold text-[var(--text-primary)]">{label}</span>
            {hasVehicle === value && (
              <span className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'var(--color-primary)' }}>
                <Check size={10} className="text-white" strokeWidth={3} />
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Selezione tipo auto */}
      {hasVehicle === true && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <p className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-3">
            Che tipo di auto hai?
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {VEHICLE_TYPES.map((type, i) => {
              const isSelected = selected === type.id
              return (
                <motion.button
                  key={type.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * i, type: 'spring', stiffness: 300, damping: 22 }}
                  onClick={() => updateFormData({ vehicle_type: type.id })}
                  className="relative flex flex-col items-center p-3 rounded-[var(--radius-lg)] border-2 transition-all duration-200 text-left"
                  style={{
                    borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-subtle)',
                    background: isSelected ? 'var(--color-primary-ghost)' : 'var(--bg-surface)',
                  }}
                >
                  {/* Badge (es. ⚡ per elettrica) */}
                  {type.badge && (
                    <span className="absolute top-2 right-2 text-xs">{type.badge}</span>
                  )}
                  {/* Check */}
                  {isSelected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 left-2 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--color-primary)' }}
                    >
                      <Check size={8} className="text-white" strokeWidth={3} />
                    </motion.span>
                  )}

                  {/* Mini car preview */}
                  <div className="w-full flex items-center justify-center py-1 mb-2"
                    style={{
                      background: isSelected ? `${formData.vehicle_color ?? '#9aacc8'}18` : 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-md)',
                      minHeight: 52,
                    }}>
                    <MiniCarSVG
                      type={type}
                      color={formData.vehicle_color ?? '#9aacc8'}
                      active={isSelected}
                    />
                  </div>

                  {/* Label */}
                  <p className="text-[11px] font-black text-[var(--text-primary)] text-center leading-tight">
                    {type.label}
                  </p>
                  <p className="text-[9px] text-[var(--text-muted)] text-center mt-0.5 leading-tight line-clamp-1">
                    {type.examples}
                  </p>
                </motion.button>
              )
            })}
          </div>

          {/* Palletta colore rapida */}
          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4"
            >
              <p className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Colore auto
              </p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { hex: '#9aacc8', name: 'Argento' },
                  { hex: '#c8a09a', name: 'Rosso' },
                  { hex: '#a8c8a0', name: 'Verde' },
                  { hex: '#1e1e28', name: 'Nero' },
                  { hex: '#f0ede8', name: 'Bianco' },
                  { hex: '#b46243', name: 'Arancio' },
                  { hex: '#4a90d9', name: 'Blu' },
                  { hex: '#c8c09a', name: 'Beige' },
                ].map(c => (
                  <button
                    key={c.hex}
                    onClick={() => updateFormData({ vehicle_color: c.hex })}
                    title={c.name}
                    className="w-7 h-7 rounded-full border-2 transition-all duration-150 flex items-center justify-center"
                    style={{
                      background: c.hex,
                      borderColor: (formData.vehicle_color ?? '#9aacc8') === c.hex
                        ? 'var(--color-primary)' : 'transparent',
                      transform: (formData.vehicle_color ?? '#9aacc8') === c.hex ? 'scale(1.2)' : 'scale(1)',
                      boxShadow: (formData.vehicle_color ?? '#9aacc8') === c.hex
                        ? '0 0 0 2px var(--bg-base)' : 'none',
                    }}
                  >
                    {(formData.vehicle_color ?? '#9aacc8') === c.hex && (
                      <Check size={10} className="text-white drop-shadow" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Skip hint */}
      {hasVehicle === null && (
        <p className="text-center text-xs text-[var(--text-muted)] opacity-60">
          Puoi aggiungere la tua auto in qualsiasi momento dalla sezione Garage
        </p>
      )}
    </div>
  )
}

export default StepVeicolo
