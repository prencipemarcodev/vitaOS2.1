import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useFinanceStore } from '@/store/useFinanceStore'
import Card from '@/components/ui/Card'
import { formatCurrency } from '@/lib/formatters'
import { Target, AlertTriangle, Settings } from 'lucide-react'
import clsx from 'clsx'

const EXPENSE_COLORS = [
  '#ff851b', '#e05252', '#ff4136', '#ffdc00', '#85144b',
  '#f012be', '#0074d9', '#9b59b6', '#3d9970', '#2ecc40'
]

function BudgetBar({ spent, limit, color }) {
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
  const isOver = spent > limit && limit > 0
  const isWarning = pct >= 80 && !isOver

  return (
    <div className="w-full h-1.5 bg-[var(--bg-base)] rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{
          backgroundColor: isOver ? '#e05252' : isWarning ? '#ff851b' : color
        }}
      />
    </div>
  )
}

function BudgetRow({ item, color }) {
  const { spent, limit, name } = item
  const hasLimit = limit > 0
  const pct = hasLimit ? Math.min((spent / limit) * 100, 100) : 0
  const isOver = hasLimit && spent > limit
  const isWarning = hasLimit && pct >= 80 && !isOver

  return (
    <div className="group flex flex-col justify-between p-3.5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: color }} />
          <span className="text-xs font-bold text-[var(--text-primary)] truncate uppercase tracking-tight leading-none">{name}</span>
        </div>
        {isOver && <AlertTriangle size={12} className="text-[#e05252]" />}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <p className={clsx("text-sm font-black font-num tabular-nums", isOver ? 'text-[#e05252]' : 'text-[var(--text-primary)]')}>
            {formatCurrency(spent)}
          </p>
          {hasLimit && (
            <p className={clsx("text-[9px] font-bold uppercase tracking-wider", isOver ? 'text-[#e05252]' : isWarning ? 'text-[#ff851b]' : 'text-[var(--text-muted)]')}>
              {isOver ? `+${(spent - limit).toFixed(0)}€` : `${pct.toFixed(0)}%`}
            </p>
          )}
        </div>

        {hasLimit && (
          <div className="space-y-1">
            <BudgetBar spent={spent} limit={limit} color={color} />
            <div className="flex justify-between items-center px-0.5">
              <span className="text-[9px] text-[var(--text-muted)] font-medium">Budget: {formatCurrency(limit)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BudgetTracker({ transactions, categories }) {
  const navigate = useNavigate()
  
  const budgetData = useMemo(() => {
    const expenseCategories = categories.filter(c => c.type === 'expense')
    const expenses = transactions.filter(t => t.type === 'expense')
    const spentMap = expenses.reduce((acc, tx) => {
      const key = tx.category?.toString()
      acc[key] = (acc[key] || 0) + parseFloat(tx.amount || 0)
      return acc
    }, {})

    return expenseCategories
      .map((cat, i) => ({
        categoryId: cat.id,
        name: cat.name,
        spent: spentMap[cat.id?.toString()] || 0,
        limit: parseFloat(cat.budget_limit || 0),
        color: EXPENSE_COLORS[i % EXPENSE_COLORS.length]
      }))
      .filter(item => item.limit > 0 || item.spent > 0) // Mostra solo dove c'è attività
      .sort((a, b) => b.spent - a.spent)
  }, [transactions, categories])

  if (budgetData.length === 0) return null

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-ghost)] flex items-center justify-center">
            <Target size={16} className="text-[var(--color-primary)]" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] leading-none">Budget</h3>
          </div>
        </div>
        <button 
          onClick={() => navigate('/impostazioni')} 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)] transition-all"
        >
          <Settings size={12} />
          CONFIGURA
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
        {budgetData.map((item, i) => (
          <BudgetRow key={item.categoryId} item={item} color={item.color} />
        ))}
      </div>
    </Card>
  )
}

export default BudgetTracker
