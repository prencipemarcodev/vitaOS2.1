import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useFinanceStore } from '@/store/useFinanceStore'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { formatCurrency } from '@/lib/formatters'
import { Target, Edit3, PieChart as PieIcon } from 'lucide-react'
import { toast } from 'sonner'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const EXPENSE_COLORS = [
  '#ff851b', '#e05252', '#ff4136', '#ffdc00', '#85144b',
  '#f012be', '#0074d9', '#9b59b6', '#3d9970', '#2ecc40'
]

function BudgetConfig() {
  const { categories, setCategories } = useFinanceStore()
  const [editing, setEditing] = useState(null)
  const [editValue, setEditValue] = useState('')

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

  const handleOpenEdit = (cat) => {
    setEditing(cat)
    setEditValue(cat.budget_limit > 0 ? cat.budget_limit.toString() : '')
  }

  const handleSaveBudget = async () => {
    if (!editing) return
    const limit = parseFloat(editValue) || 0
    try {
      const { error } = await supabase
        .from('finance_categories')
        .update({ budget_limit: limit })
        .eq('id', editing.id)
      if (error) throw error
      setCategories(categories.map(c => c.id === editing.id ? { ...c, budget_limit: limit } : c))
      setEditing(null)
      toast.success('Budget salvato')
    } catch (err) {
      toast.error('Errore salvataggio')
    }
  }

  return (
    <div className="space-y-4">

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
                      animationBegin={0}
                      animationDuration={1000}
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
              className="group relative p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--color-primary-ghost)] hover:bg-[var(--bg-elevated)] transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase truncate">{cat.name}</span>
                </div>
                <button 
                  onClick={() => handleOpenEdit(cat)}
                  className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-hover)] transition-all"
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
            </div>
          ))}
        </div>
      </div>

      <Modal 
        isOpen={!!editing} 
        onClose={() => setEditing(null)} 
        title={`Budget ${editing?.name}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Annulla</Button>
            <Button variant="primary" onClick={handleSaveBudget}>Salva Limite</Button>
          </>
        }
      >
        <div className="py-2">
          <Input 
            label="Limite Mensile"
            type="number"
            prefix="€"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="0"
            autoFocus
          />
          <p className="text-[10px] text-[var(--text-muted)] mt-2">
            Imposta 0 per rimuovere il limite di budget per questa categoria.
          </p>
        </div>
      </Modal>
    </div>
  )
}

export default BudgetConfig
