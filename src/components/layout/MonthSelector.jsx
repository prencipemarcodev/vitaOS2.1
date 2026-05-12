import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, subMonths } from 'date-fns'
import { it } from 'date-fns/locale'
import { useAppStore } from '@/store/useAppStore'

function MonthSelector() {
  const { selectedMonth, setSelectedMonth } = useAppStore()
  const date = selectedMonth ? new Date(selectedMonth) : new Date()

  const prev = () => setSelectedMonth(subMonths(date, 1).toISOString())
  const next = () => setSelectedMonth(addMonths(date, 1).toISOString())

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-[var(--text-primary)] capitalize">
        {format(date, 'MMMM yyyy', { locale: it })}
      </span>

      <div className="flex items-center bg-[var(--bg-elevated)] rounded-lg p-0.5 border border-[var(--border-subtle)]">
        <button
          onClick={prev}
          className="p-1 rounded-md text-[var(--text-muted)]
            hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]
            transition-colors duration-[var(--transition-fast)]"
          aria-label="Mese precedente"
        >
          <ChevronLeft size={14} />
        </button>

        <button
          onClick={next}
          className="p-1 rounded-md text-[var(--text-muted)]
            hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]
            transition-colors duration-[var(--transition-fast)]"
          aria-label="Mese successivo"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

export default MonthSelector
