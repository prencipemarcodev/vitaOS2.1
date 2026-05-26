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
    <div className="flex items-center justify-between w-[165px] sm:w-[200px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-full shadow-sm hover:border-[var(--color-primary-ghost)] transition-all duration-[var(--transition-fast)]">
      <button
        onClick={prev}
        className="p-1 sm:p-1.5 rounded-full text-[var(--text-muted)]
          hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]
          transition-colors duration-[var(--transition-fast)] shrink-0 active:scale-90"
        aria-label="Mese precedente"
      >
        <ChevronLeft size={14} strokeWidth={3} />
      </button>

      <span 
        className="text-[10px] sm:text-xs font-black text-[var(--text-primary)] capitalize whitespace-nowrap text-center select-none flex-1 truncate px-1"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {format(date, 'MMMM yyyy', { locale: it })}
      </span>

      <button
        onClick={next}
        className="p-1 sm:p-1.5 rounded-full text-[var(--text-muted)]
          hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]
          transition-colors duration-[var(--transition-fast)] shrink-0 active:scale-90"
        aria-label="Mese successivo"
      >
        <ChevronRight size={14} strokeWidth={3} />
      </button>
    </div>
  )
}

export default MonthSelector

