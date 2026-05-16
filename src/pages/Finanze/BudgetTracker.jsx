import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useFinanceStore } from '@/store/useFinanceStore'
import Card from '@/components/ui/Card'
import { formatCurrency } from '@/lib/formatters'
import { Target, AlertTriangle, CheckCircle, Edit3, X, Check } from 'lucide-react'
import { toast } from 'sonner'
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

function BudgetRow({ item, color, onEdit }) {
  const { spent, limit, name, categoryId } = item
  const hasLimit = limit > 0
  const pct = hasLimit ? Math.min((spent / limit) * 100, 100) : 0
  const isOver = hasLimit && spent > limit
  const isWarning = hasLimit && pct >= 80 && !isOver

  return (
    <div className="group flex flex-col justify-between p-3.5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-subtle)] hover:border-[var(--color-primary-ghost)] hover:bg-[var(--bg-elevated)] transition-all relative overflow-hidden">
      {/* Background Glow on Hover */}
      <div className="absolute -right-4 -top-4 w-12 h-12 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none" style={{ backgroundColor: color }} />

      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: color }} />
          <span className="text-xs font-bold text-[var(--text-primary)] truncate uppercase tracking-tight leading-none">{name}</span>
        </div>
        <button
          onClick={() => onEdit(categoryId, limit)}
          className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/50 transition-all shadow-sm bg-white/20 backdrop-blur-sm"
        >
          <Edit3 size={12} className="text-[var(--text-muted)]" />
        </button>
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

        {hasLimit ? (
          <div className="space-y-1">
            <BudgetBar spent={spent} limit={limit} color={color} />
            <div className="flex justify-between items-center px-0.5">
              <span className="text-[9px] text-[var(--text-muted)] font-medium">Budget: {formatCurrency(limit)}</span>
              {isOver && <AlertTriangle size={10} className="text-[#e05252]" />}
            </div>
          </div>
        ) : (
          <button
            onClick={() => onEdit(categoryId, 0)}
            className="w-full py-1.5 border border-dashed border-[var(--border-subtle)] rounded-lg text-[9px] font-bold text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary-ghost)] hover:bg-[var(--color-primary-ghost)] transition-all"
          >
            + IMPOSTA BUDGET
          </button>
        )}
      </div>
    </div>
  )
}

function BudgetEditPopover({ categoryId, currentLimit, onSave, onClose }) {
  const [value, setValue] = useState(currentLimit > 0 ? currentLimit.toString() : '')

  const handleSave = async () => {
    const limit = parseFloat(value) || 0
    onSave(categoryId, limit)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="absolute inset-x-0 top-0 z-10 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-[var(--text-primary)]">Imposta limite mensile</p>
        <button onClick={onClose} className="p-1 hover:bg-[var(--bg-base)] rounded-lg">
          <X size={14} className="text-[var(--text-muted)]" />
        </button>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-muted)]">€</span>
          <input
            type="number"
            min="0"
            step="10"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="0"
            autoFocus
            className="w-full pl-7 pr-3 py-2 text-sm font-bold bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ghost)]"
          />
        </div>
        <button
          onClick={handleSave}
          className="px-3 py-2 bg-[var(--color-primary)] text-white rounded-xl hover:opacity-90 transition-opacity"
        >
          <Check size={16} />
        </button>
      </div>
      {parseFloat(value) === 0 && value !== '' && (
        <p className="text-[9px] text-[var(--text-muted)] mt-2">Inserire 0 rimuoverà il limite di budget</p>
      )}
    </motion.div>
}

function BudgetTracker({ transactions, categories }) {
  const { setCategories } = useFinanceStore()
  const [editing, setEditing] = useState(null)

  const budgetData = useMemo(() => {
    const expenseCategories = categories.filter(c => c.type === 'expense')
    const expenses = transactions.filter(t => t.type === 'expense')
    const spentMap = expenses.reduce((acc, tx) => {
      const key = tx.category?.toString()
      acc[key] = (acc[key] || 0) + parseFloat(tx.amount || 0)
      return acc
    }, {})

    return expenseCategories.map((cat, i) => ({
      categoryId: cat.id,
      name: cat.name,
      spent: spentMap[cat.id?.toString()] || 0,
      limit: parseFloat(cat.budget_limit || 0),
      color: EXPENSE_COLORS[i % EXPENSE_COLORS.length]
    })).sort((a, b) => b.spent - a.spent)
  }, [transactions, categories])

  const summary = useMemo(() => {
    const withLimit = budgetData.filter(d => d.limit > 0)
    const totalBudget = withLimit.reduce((s, d) => s + d.limit, 0)
    const totalSpent = withLimit.reduce((s, d) => s + d.spent, 0)
    const overCount = withLimit.filter(d => d.spent > d.limit).length
    const warningCount = withLimit.filter(d => d.limit > 0 && (d.spent / d.limit) >= 0.8 && d.spent <= d.limit).length
    return { totalBudget, totalSpent, overCount, warningCount, hasAny: withLimit.length > 0 }
  }, [budgetData])

  const handleSaveBudget = async (categoryId, limit) => {
    try {
      const { error } = await supabase
        .from('finance_categories')
        .update({ budget_limit: limit })
        .eq('id', categoryId)
      if (error) throw error
      setCategories(categories.map(c => c.id === categoryId ? { ...c, budget_limit: limit } : c))
      setEditing(null)
      toast.success(limit > 0 ? `Budget impostato: ${formatCurrency(limit)}/mese` : 'Budget rimosso')
    } catch (err) {
      toast.error('Errore salvataggio')
      console.error(err)
    }
  }

  if (budgetData.length === 0) return null

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      {/* Header compact */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-ghost)] flex items-center justify-center">
            <Target size={16} className="text-[var(--color-primary)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] leading-none">Budget Mensile</h3>
            {summary.hasAny && (
              <p className="text-[10px] text-[var(--text-muted)] mt-1 font-medium">
                Gestisci i limiti di spesa per categoria
              </p>
            )}
          </div>
        </div>
        {summary.hasAny && (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[var(--text-primary)]">
                {formatCurrency(summary.totalSpent)} <span className="font-medium text-[var(--text-muted)]">/ {formatCurrency(summary.totalBudget)}</span>
              </span>
            </div>
            <div className="flex gap-1.5">
               {summary.overCount > 0 && (
                <span className="text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 bg-red-100 text-red-600 rounded-md">
                  {summary.overCount} Sforat{summary.overCount > 1 ? 'e' : 'a'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grid Layout */}
      <div className="relative">
        <AnimatePresence>
          {editing && (
            <BudgetEditPopover
              key="edit-popover"
              categoryId={editing.categoryId}
              currentLimit={editing.currentLimit}
              onSave={handleSaveBudget}
              onClose={() => setEditing(null)}
            />
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
          {budgetData.map((item, i) => (
            <BudgetRow
              key={item.categoryId}
              item={item}
              color={EXPENSE_COLORS[i % EXPENSE_COLORS.length]}
              onEdit={(categoryId, currentLimit) => setEditing({ categoryId, currentLimit })}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}

export default BudgetTracker
