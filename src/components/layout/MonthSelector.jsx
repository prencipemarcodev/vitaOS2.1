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
    <div className="flex items-center gap-1">
      <button
        onClick={prev}
        className="p-1.5 rounded-[var(--radius-md)] text-[var(--text-muted)]
          hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]
          transition-colors duration-[var(--transition-fast)]"
        aria-label="Mese precedente"
      >
        <ChevronLeft size={15} />
      </button>

      <span className="text-sm font-medium text-[var(--text-primary)] min-w-[120px] text-center capitalize">
        {format(date, 'MMMM yyyy', { locale: it })}
      </span>

      <button
        onClick={next}
        className="p-1.5 rounded-[var(--radius-md)] text-[var(--text-muted)]
          hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]
          transition-colors duration-[var(--transition-fast)]"
        aria-label="Mese successivo"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  )
}

export default MonthSelector
