import { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useFinanceStore } from '@/store/useFinanceStore'
import Card from '@/components/ui/Card'
import { formatCurrency } from '@/lib/formatters'
import { Target, AlertTriangle, Edit3, X, Check, ChevronLeft, ChevronRight, PieChart as PieIcon } from 'lucide-react'
import { toast } from 'sonner'
import clsx from 'clsx'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'

const EXPENSE_COLORS = [
  '#ff851b', '#e05252', '#ff4136', '#ffdc00', '#85144b',
  '#f012be', '#0074d9', '#9b59b6', '#3d9970', '#2ecc40'
]

function BudgetBar({ spent, limit, color }) {
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
  const isOver = spent > limit && limit > 0
  const isWarning = pct >= 80 && !isOver

  return (
    <div className="w-full h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
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

function BudgetEditPopover({ categoryId, currentLimit, onSave, onClose }) {
  const [value, setValue] = useState(currentLimit > 0 ? currentLimit.toString() : '')
  const handleSave = () => onSave(categoryId, parseFloat(value) || 0)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 z-50 bg-white/80 backdrop-blur-md flex items-center justify-center p-6 rounded-3xl"
    >
      <div className="bg-white shadow-2xl border border-black/5 p-6 rounded-3xl w-full max-w-[280px]">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-black text-[var(--text-primary)]">Limite Budget</p>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">€</span>
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="0"
            autoFocus
            className="w-full pl-8 pr-4 py-3 bg-gray-50 border-none rounded-2xl font-bold text-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
          />
        </div>
        <button
          onClick={handleSave}
          className="w-full py-3 bg-[var(--color-primary)] text-white font-bold rounded-2xl shadow-lg shadow-[var(--color-primary-ghost)] active:scale-95 transition-all"
        >
          Salva Limite
        </button>
      </div>
    </motion.div>
  )
}

function BudgetTracker({ transactions, categories }) {
  const { setCategories } = useFinanceStore()
  const [editing, setEditing] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)

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
    })).sort((a, b) => (b.limit > 0 ? 1 : -1) - (a.limit > 0 ? 1 : -1) || b.spent - a.spent)
  }, [transactions, categories])

  const chartData = useMemo(() => {
    const withLimit = budgetData.filter(d => d.limit > 0)
    return withLimit.map(d => ({
      name: d.name,
      value: d.limit,
      color: d.color
    }))
  }, [budgetData])

  const totalBudget = useMemo(() => chartData.reduce((s, d) => s + d.value, 0), [chartData])

  const handleSaveBudget = async (categoryId, limit) => {
    try {
      const { error } = await supabase
        .from('finance_categories')
        .update({ budget_limit: limit })
        .eq('id', categoryId)
      if (error) throw error
      setCategories(categories.map(c => c.id === categoryId ? { ...c, budget_limit: limit } : c))
      setEditing(null)
      toast.success('Budget aggiornato')
    } catch (err) {
      toast.error('Errore salvataggio')
    }
  }

  const currentItem = budgetData[activeIndex]

  const next = () => setActiveIndex((prev) => (prev + 1) % budgetData.length)
  const prev = () => setActiveIndex((prev) => (prev - 1 + budgetData.length) % budgetData.length)

  if (budgetData.length === 0) return null

  return (
    <Card padding="none" className="overflow-hidden bg-[var(--bg-surface)] border-none shadow-xl">
      <div className="flex flex-col lg:flex-row min-h-[360px]">
        
        {/* LEFT: Chart & Total */}
        <div className="lg:w-[45%] p-8 bg-gray-50/50 border-r border-black/5 flex flex-col items-center justify-center relative">
          <div className="absolute top-6 left-6 flex items-center gap-2">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-black/5">
              <PieIcon size={16} className="text-[var(--color-primary)]" />
            </div>
            <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">Ripartizione</h3>
          </div>

          <div className="w-full h-64 relative">
            {chartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={75}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      animationBegin={0}
                      animationDuration={1200}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Totale</p>
                  <p className="text-2xl font-black text-[var(--text-primary)] tabular-nums leading-tight">
                    {formatCurrency(totalBudget)}
                  </p>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-center p-12">
                <p className="text-xs font-bold text-gray-300 italic leading-relaxed">
                  Configura un limite di spesa per vedere la ripartizione del tuo budget
                </p>
              </div>
            )}
          </div>

          {totalBudget > 0 && (
             <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-6">
               {chartData.slice(0, 4).map(d => (
                 <div key={d.name} className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                   <span className="text-[9px] font-bold text-gray-500 uppercase">{d.name}</span>
                 </div>
               ))}
               {chartData.length > 4 && <span className="text-[9px] font-bold text-gray-400">+ altri</span>}
             </div>
          )}
        </div>

        {/* RIGHT: Carousel Deck */}
        <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center relative bg-white">
          <div className="absolute top-8 right-8 flex gap-2 z-10">
            <button 
              onClick={prev} 
              className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-[var(--text-primary)] rounded-full transition-all border border-black/5"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={next} 
              className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-[var(--text-primary)] rounded-full transition-all border border-black/5"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="relative h-64 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentItem.categoryId}
                initial={{ x: 20, opacity: 0, scale: 0.95 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: -20, opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="w-full max-w-[340px] p-8 rounded-[2.5rem] bg-white border border-black/[0.03] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.08)] relative"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div 
                    className="w-4 h-4 rounded-full shadow-inner" 
                    style={{ backgroundColor: currentItem.color }} 
                  />
                  <h4 className="text-base font-black text-[var(--text-primary)] uppercase tracking-tight truncate">
                    {currentItem.name}
                  </h4>
                </div>

                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Spesa Attuale</p>
                      <p className={clsx("text-2xl font-black tabular-nums leading-none", currentItem.spent > currentItem.limit && currentItem.limit > 0 ? 'text-[#e05252]' : 'text-[var(--text-primary)]')}>
                        {formatCurrency(currentItem.spent)}
                      </p>
                    </div>
                    {currentItem.limit > 0 && (
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Budget</p>
                        <p className="text-sm font-bold text-gray-600 leading-none">{formatCurrency(currentItem.limit)}</p>
                      </div>
                    )}
                  </div>

                  {currentItem.limit > 0 ? (
                    <div className="space-y-2">
                      <BudgetBar spent={currentItem.spent} limit={currentItem.limit} color={currentItem.color} />
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                        <span className="text-gray-400">
                          {Math.min(100, Math.round((currentItem.spent / currentItem.limit) * 100))}% Utilizzato
                        </span>
                        {currentItem.spent > currentItem.limit && (
                          <span className="text-[#e05252]">Sforato di {formatCurrency(currentItem.spent - currentItem.limit)}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 px-6 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center gap-2">
                       <p className="text-[10px] font-bold text-gray-400 text-center uppercase">Nessun limite impostato per questa categoria</p>
                    </div>
                  )}

                  <button 
                    onClick={() => setEditing(currentItem)}
                    className="w-full mt-2 py-3 border border-gray-100 rounded-2xl text-[10px] font-black text-gray-500 hover:bg-gray-50 hover:text-[var(--text-primary)] transition-all flex items-center justify-center gap-2"
                  >
                    <Edit3 size={12} />
                    GESTISCI BUDGET
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 mt-8">
            {budgetData.map((_, i) => (
              <div 
                key={i} 
                className={clsx(
                  "h-1 rounded-full transition-all duration-300",
                  i === activeIndex ? "w-6 bg-[var(--color-primary)]" : "w-1 bg-gray-200"
                )} 
              />
            ))}
          </div>
        </div>

        {/* Floating Edit Popover */}
        <AnimatePresence>
          {editing && (
            <BudgetEditPopover
              categoryId={editing.categoryId}
              currentLimit={editing.limit}
              onSave={handleSaveBudget}
              onClose={() => setEditing(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </Card>
  )
}

export default BudgetTracker
