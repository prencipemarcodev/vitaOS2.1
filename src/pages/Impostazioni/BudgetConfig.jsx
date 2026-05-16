import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useFinanceStore } from '@/store/useFinanceStore'
import Card from '@/components/ui/Card'
import { formatCurrency } from '@/lib/formatters'
import { Target, Edit3, X, Check, PieChart as PieIcon } from 'lucide-react'
import { toast } from 'sonner'
import clsx from 'clsx'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const EXPENSE_COLORS = [
  '#ff851b', '#e05252', '#ff4136', '#ffdc00', '#85144b',
  '#f012be', '#0074d9', '#9b59b6', '#3d9970', '#2ecc40'
]

function BudgetEditPopover({ categoryId, currentLimit, onSave, onClose }) {
  const [value, setValue] = useState(currentLimit > 0 ? currentLimit.toString() : '')
  const handleSave = () => onSave(categoryId, parseFloat(value) || 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute inset-0 z-50 bg-[var(--bg-surface)]/90 backdrop-blur-sm flex items-center justify-center p-4 rounded-2xl"
    >
      <div className="bg-white shadow-2xl border border-[var(--border-subtle)] p-5 rounded-2xl w-full max-w-[240px]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-[var(--text-primary)]">Imposta Limite</p>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={14} /></button>
        </div>
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">€</span>
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            autoFocus
            className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
          />
        </div>
        <button
          onClick={handleSave}
          className="w-full py-2 bg-[var(--color-primary)] text-white text-xs font-bold rounded-xl active:scale-95 transition-transform"
        >
          Salva
        </button>
      </div>
    </motion.div>
  )
}

function BudgetConfig() {
  const { categories, setCategories } = useFinanceStore()
  const [editing, setEditing] = useState(null)

  const expenseCategories = useMemo(() => 
    categories.filter(c => c.type === 'expense')
      .map((cat, i) => ({
        ...cat,
        color: EXPENSE_COLORS[i % EXPENSE_COLORS.length]
      }))
  , [categories])

  const chartData = useMemo(() => 
    expenseCategories
      .filter(c => parseFloat(c.budget_limit || 0) > 0)
      .map(c => ({
        name: c.name,
        value: parseFloat(c.budget_limit),
        color: c.color
      }))
  , [expenseCategories])

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
      toast.success('Budget salvato')
    } catch (err) {
      toast.error('Errore salvataggio')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Target size={18} className="text-[var(--color-primary)]" />
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Gestione Budget</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart View */}
        <Card padding="lg" className="lg:col-span-5 flex flex-col items-center justify-center bg-gray-50/30">
          <div className="w-full h-48 relative">
            {chartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Totale</p>
                  <p className="text-xl font-black text-[var(--text-primary)] tabular-nums leading-tight">
                    {formatCurrency(totalBudget)}
                  </p>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-center p-6 text-[10px] font-bold text-gray-400 italic">
                Nessun limite impostato
              </div>
            )}
          </div>
          <p className="text-[10px] text-gray-400 font-medium text-center mt-2">
            Ripartizione percentuale dei tuoi limiti di spesa mensili
          </p>
        </Card>

        {/* Grid View */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {expenseCategories.map((cat) => (
            <div 
              key={cat.id} 
              className="group relative p-4 rounded-2xl bg-white border border-[var(--border-subtle)] hover:border-[var(--color-primary-ghost)] hover:bg-[var(--bg-elevated)] transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase truncate">{cat.name}</span>
                </div>
                <button 
                  onClick={() => setEditing(cat)}
                  className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all"
                >
                  <Edit3 size={12} className="text-gray-400" />
                </button>
              </div>

              <div className="flex items-end justify-between">
                <p className="text-sm font-black text-[var(--text-primary)]">
                  {parseFloat(cat.budget_limit || 0) > 0 ? formatCurrency(cat.budget_limit) : '---'}
                </p>
                {totalBudget > 0 && cat.budget_limit > 0 && (
                  <span className="text-[9px] font-bold text-gray-400">
                    {((cat.budget_limit / totalBudget) * 100).toFixed(0)}%
                  </span>
                )}
              </div>

              <AnimatePresence>
                {editing?.id === cat.id && (
                  <BudgetEditPopover
                    categoryId={cat.id}
                    currentLimit={parseFloat(cat.budget_limit || 0)}
                    onSave={handleSaveBudget}
                    onClose={() => setEditing(null)}
                  />
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BudgetConfig
