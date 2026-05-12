import { motion } from 'framer-motion'
import Card from '@/components/ui/Card'
import { Globe } from 'lucide-react'

function GlobeProgress({ totalKm }) {
  const EARTH_CIRCUMFERENCE = 40075
  const progress = (totalKm / EARTH_CIRCUMFERENCE) * 100
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  return (
    <Card padding="lg" className="flex flex-col items-center justify-center relative overflow-hidden h-full">
      <div className="absolute top-4 left-4">
        <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Giro della Terra</h3>
      </div>

      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* SVG Circle Progress */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="96"
            cy="96"
            r={radius}
            fill="transparent"
            stroke="var(--bg-base)"
            strokeWidth="12"
          />
          <motion.circle
            cx="96"
            cy="96"
            r={radius}
            fill="transparent"
            stroke="var(--color-primary)"
            strokeWidth="12"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 2, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Content */}
        <div className="text-center z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="text-[var(--color-primary)] mb-1 inline-block"
          >
            <Globe size={40} strokeWidth={1} />
          </motion.div>
          <p className="text-2xl font-bold text-[var(--text-primary)] leading-none">{totalKm.toFixed(1)}</p>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mt-1">KM TOTALI</p>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-[10px] font-bold text-[var(--color-primary)] mb-1">
          {progress.toFixed(4)}% del percorso
        </p>
        <p className="text-[9px] text-[var(--text-muted)] max-w-[150px]">
          Continua così! Ti mancano {(EARTH_CIRCUMFERENCE - totalKm).toLocaleString()} km per completare il giro.
        </p>
      </div>
    </Card>
  )
}

export default GlobeProgress
