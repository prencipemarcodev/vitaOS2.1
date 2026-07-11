import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Edit2, Trash2, Plus, Minus, AlertCircle, CheckCircle2 } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, Tooltip as RechartsTooltip } from 'recharts'
import { formatCurrency } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'
import { useSavingsStore } from '@/store/useSavingsStore'
import { useNotifications } from '@/hooks/useNotifications'
import { useAuthStore } from '@/store/useAuthStore'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { getIcon } from '@/lib/icons'
import { useConfirmStore } from '@/store/useConfirmStore'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useAppStore } from '@/store/useAppStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { differenceInMonths, parseISO, format } from 'date-fns'
import { it } from 'date-fns/locale'
import { getAccounts } from '@/lib/accounts'

function PlanCard({ plan, onEdit, advice = null }) {
  const confirm = useConfirmStore(s => s.confirm)
  const { updatePlan, removePlan, addMovement } = useSavingsStore()
  const { transactions, categories, addTransaction, setCumulativeBalance, cumulativeBalance } = useFinanceStore()
  const { userConfig } = useAppStore()
  const { addNotification } = useNotificationStore()
  const { pushError } = useNotifications()
  const { user } = useAuthStore()

  const progress = Math.min(100, (plan.current_amount / plan.target_amount) * 100)
  const Icon = getIcon(plan.icon)

  // Calcolo saldo totale disponibile per depositare
  const saldoDisponibile = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
    const accounts = getAccounts(userConfig)
    const baseBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.initial_balance || 0), 0)
    return baseBalance + income - expense
  }, [transactions, userConfig])

  // Trova previsioni dall'advice
  const forecast = useMemo(() => {
    return advice?.forecasts?.find(f => f.planId === plan.id)
  }, [advice, plan.id])

  const movements = useSavingsStore(s => s.movements || [])
  const depositedThisMonth = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-indexed
    
    return movements
      .filter(m => {
        if (m.plan_id !== plan.id || m.type !== 'deposit') return false
        const mDate = new Date(m.date)
        return mDate.getFullYear() === currentYear && mDate.getMonth() === currentMonth
      })
      .reduce((sum, m) => sum + parseFloat(m.amount || 0), 0)
  }, [movements, plan.id])

  // Quota mensile richiesta per l'obiettivo
  const requiredMonthly = useMemo(() => {
    if (plan.type === 'piggy_bank') return 0
    return forecast?.isAtRisk
      ? (parseFloat(plan.monthly_contribution || 0) + parseFloat(forecast?.extraContributionNeeded || 0))
      : parseFloat(plan.monthly_contribution || 0)
  }, [plan, forecast])

  const isQuotaCompletedThisMonth = useMemo(() => {
    return requiredMonthly > 0 && depositedThisMonth >= (requiredMonthly - 0.01)
  }, [requiredMonthly, depositedThisMonth])

  // Calcolo andamento storico cumulativo dei depositi
  const planMovements = useMemo(() => {
    const filtered = movements
      .filter(m => m.plan_id === plan.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const dataPoints = []
    let balance = 0

    // Punto iniziale a 0
    dataPoints.push({ label: 'Inizio', val: 0 })

    if (filtered.length === 0) {
      // Nessun movimento registrato: disegna linea piatta da 0 al valore corrente
      dataPoints.push({ label: 'Oggi', val: parseFloat(plan.current_amount || 0) })
      return dataPoints
    }

    filtered.forEach((m) => {
      const amt = parseFloat(m.amount || 0)
      if (m.type === 'deposit') {
        balance += amt
      } else if (m.type === 'withdrawal') {
        balance -= amt
      }
      const dateStr = new Date(m.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
      dataPoints.push({ label: dateStr, val: parseFloat(balance.toFixed(2)) })
    })

    // Se il valore cumulato differisce dal saldo effettivo attuale del piano, allinealo inserendo il punto finale
    const actualCurrent = parseFloat(plan.current_amount || 0)
    if (Math.abs(balance - actualCurrent) > 0.05) {
      dataPoints.push({ label: 'Oggi', val: actualCurrent })
    }

    return dataPoints
  }, [movements, plan.id, plan.current_amount])

  const [customAmount, setCustomAmount] = useState('')
  const [method, setMethod] = useState(() => {
    const accounts = getAccounts(userConfig)
    return accounts[0]?.id || 'bank'
  })
  const [isExpanded, setIsExpanded] = useState(false)

  const handleAdjust = async (type) => {
    const amount = parseFloat(customAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Inserisci una cifra valida')
      return
    }

    const multiplier = type === 'deposit' ? 1 : -1
    const adjustment = amount * multiplier
    const newAmount = Math.max(0, parseFloat(plan.current_amount || 0) + adjustment)
    
    if (type === 'deposit' && amount > saldoDisponibile) {
      toast.error('Saldo insufficiente per questo deposito')
      return
    }

    try {
      const { data: updated, error } = await supabase
        .from('saving_plans')
        .update({ current_amount: newAmount })
        .eq('id', plan.id)
        .select()
        .single()
      if (error) throw error
      
      updatePlan(plan.id, updated)
      
      const today = new Date().toISOString().split('T')[0]

      // 1. Inserisci il movimento in Supabase
      const { data: movement } = await supabase
        .from('saving_movements')
        .insert({
          user_id: user?.id,
          plan_id: plan.id,
          amount: adjustment,
          type: type,
          date: today
        })
        .select()
        .single()
      if (movement) addMovement(movement)

      // 2. Registra la transazione finanziaria correlata
      let savingsCategory = categories.find(c => c.name.toLowerCase().includes('risparmi'))
      
      const { data: tx } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          amount: amount,
          type: type === 'deposit' ? 'expense' : 'income',
          category: savingsCategory?.name || 'Risparmio',
          description: type === 'deposit' ? `Accantonamento: ${plan.name}` : `Prelievo da: ${plan.name}`,
          payment_method: method,
          date: today
        })
        .select()
        .single()
      
      if (tx) {
        addTransaction(tx)
        const delta = type === 'deposit' ? -amount : amount
        setCumulativeBalance(cumulativeBalance + delta)
      }
      
      toast.success(type === 'deposit' ? `Depositati ${formatCurrency(amount)}` : `Prelevati ${formatCurrency(amount)}`)
      setCustomAmount('')
      setIsExpanded(false)

      addNotification({
        title: type === 'deposit' ? 'Deposito Risparmi' : 'Prelievo Risparmi',
        message: type === 'deposit' 
          ? `Hai aggiunto ${formatCurrency(amount)} a "${plan.name}" e registrato l'uscita nelle finanze.`
          : `Hai prelevato ${formatCurrency(amount)} da "${plan.name}" e registrato l'entrata nelle finanze.`,
        type: type === 'deposit' ? 'success' : 'info',
        icon: 'PiggyBank'
      })
    } catch (err) {
      pushError('Errore nell\'aggiornamento')
    }
  }

  const handleDelete = async () => {
    const accumulated = parseFloat(plan.current_amount || 0)
    const ok = await confirm({
      title: 'Elimina piano',
      message: accumulated > 0
        ? `Vuoi eliminare l'obiettivo "${plan.name}"? Tutti i risparmi accantonati (${formatCurrency(accumulated)}) verranno riaccreditati sul tuo saldo.`
        : `Vuoi eliminare l'obiettivo "${plan.name}"?`,
      variant: 'danger',
      confirmText: 'Elimina',
      cancelText: 'Annulla'
    })
    if (!ok) return

    try {
      // 1. Elimina il piano dal DB
      const { error } = await supabase.from('saving_plans').delete().eq('id', plan.id).eq('user_id', user?.id)
      if (error) throw error

      // 2. Se c'era del saldo accumulato (> 0), creiamo una transazione di riaccredito (Entrata / "+")
      if (accumulated > 0) {
        const today = new Date().toISOString().split('T')[0]
        const savingsCategory = categories.find(c => c.name.toLowerCase().includes('risparmi'))
        
        const { data: tx } = await supabase
          .from('transactions')
          .insert({
            user_id: user?.id,
            amount: accumulated,
            type: 'income', // Riaccredito come entrata (+)
            category: savingsCategory?.name || 'Risparmio',
            description: `Riaccredito saldo per eliminazione piano: ${plan.name}`,
            payment_method: 'bank',
            date: today
          })
          .select()
          .single()

        if (tx) {
          addTransaction(tx)
          setCumulativeBalance(cumulativeBalance + accumulated)
        }
      }

      removePlan(plan.id)
      toast.success(accumulated > 0 ? 'Piano eliminato e saldo riaccreditato!' : 'Piano eliminato')
    } catch (err) {
      console.error(err)
      pushError("Errore nell'eliminazione del piano")
    }
  }

  // Configura il colore del cerchio di progresso e della nota
  const ringColor = useMemo(() => {
    if (progress >= 100) return 'var(--color-success)'
    if (forecast?.isAtRisk) return 'var(--color-danger)'
    return 'var(--color-primary)'
  }, [progress, forecast])

  return (
    <div className="group relative bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5 flex flex-col justify-between shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-md)]">
      {/* Edit/Delete overlay */}
      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button onClick={onEdit} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--color-primary)] transition-colors">
          <Edit2 size={13} />
        </button>
        <button onClick={handleDelete} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--color-danger)] transition-colors">
          <Trash2 size={13} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Info Top */}
        <div className="flex items-center gap-3">
          {/* Progress Ring */}
          <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
            <svg className="absolute inset-0" width="48" height="48" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="var(--border-subtle)" strokeWidth="4" />
              <motion.circle 
                cx="24" 
                cy="24" 
                r="20" 
                fill="none" 
                stroke={ringColor} 
                strokeWidth="4" 
                strokeDasharray={2 * Math.PI * 20}
                initial={{ strokeDashoffset: 2 * Math.PI * 20 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 20 - (progress / 100) * 2 * Math.PI * 20 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                strokeLinecap="round"
                transform="rotate(-90 24 24)"
              />
            </svg>
            <Icon size={16} className={clsx(progress >= 100 ? "text-[var(--color-success)]" : "text-[var(--text-secondary)]")} />
          </div>

          <div>
            <h4 className="text-sm font-bold text-[var(--text-primary)] leading-tight">{plan.name}</h4>
            <p className="text-[11px] font-medium text-[var(--text-secondary)] mt-0.5">
              {formatCurrency(plan.current_amount)} / <span className="text-[var(--text-muted)]">{formatCurrency(plan.target_amount)}</span>
            </p>
          </div>
        </div>

        {/* Dynamic Warning/Info note */}
        {plan.target_date && (
          <div className={clsx(
            "flex gap-2 items-start p-3 rounded-[var(--radius-sm)] text-[12px] leading-snug",
            progress >= 100 
              ? "bg-[rgba(61,153,112,0.08)] text-[var(--color-success)]"
              : isQuotaCompletedThisMonth
                ? "bg-[rgba(61,153,112,0.08)] text-[var(--color-success)] font-medium"
                : forecast?.isAtRisk 
                  ? "bg-[rgba(224,82,82,0.08)] text-[var(--color-danger)] font-medium"
                  : "bg-[var(--color-primary-ghost)] text-[var(--color-primary-dark)]"
          )}>
            {progress >= 100 ? (
              <>
                <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" />
                <span>Obiettivo completato con successo! 🎉</span>
              </>
            ) : isQuotaCompletedThisMonth ? (
              <>
                <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" />
                <span>
                  Quota di questo mese versata con successo! (<strong>{formatCurrency(depositedThisMonth)}</strong>).
                </span>
              </>
            ) : (
              <>
                <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                <span>
                  Scade a {format(parseISO(plan.target_date), 'MMMM yyyy', { locale: it })}. 
                  {depositedThisMonth > 0 ? (
                    <>
                      {' '}Hai versato {formatCurrency(depositedThisMonth)} questo mese. Servono ancora{' '}
                      <strong>{formatCurrency(requiredMonthly - depositedThisMonth)}</strong> per arrivare in tempo.
                    </>
                  ) : (
                    <>
                      {' '}Servono <strong>{formatCurrency(requiredMonthly)}/mese</strong> per arrivare in tempo.
                    </>
                  )}
                </span>
              </>
            )}
          </div>
        )}

        {/* Sparkline dell'andamento dei depositi */}
        <PlanSparkline data={planMovements} color={ringColor} />
      </div>

      {/* Goal actions */}
      <div className="mt-4 pt-2 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          {/* Method selector */}
          <div className="flex border border-[var(--border-subtle)] rounded-lg overflow-hidden flex-1 bg-[var(--bg-base)] p-[2px]">
            {getAccounts(userConfig).map(acc => (
              <button 
                key={acc.id}
                type="button"
                className={clsx(
                  "flex-1 text-center text-[10px] py-1 font-bold rounded-md transition-all uppercase whitespace-nowrap px-1",
                  method === acc.id 
                    ? "bg-white dark:bg-[var(--bg-elevated)] shadow-sm text-[var(--text-primary)]" 
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                )}
                style={{
                  color: method === acc.id ? acc.color : undefined
                }}
                onClick={() => setMethod(acc.id)}
              >
                {acc.name}
              </button>
            ))}
          </div>

          {/* Plus/Expand Button */}
          <button 
            type="button"
            className={clsx(
              "w-7 h-7 rounded-lg text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all flex-shrink-0",
              isExpanded ? "bg-[var(--text-secondary)]" : "bg-[var(--color-primary)]"
            )}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Plus size={14} className={clsx("transition-transform duration-200", isExpanded && "rotate-45")} />
          </button>
        </div>

        {/* Expandable input drawer */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mt-3 space-y-2.5"
            >
              <div className="flex items-center gap-2 bg-[var(--bg-base)] p-1 rounded-xl border border-[var(--border-subtle)]">
                <input 
                  type="number" 
                  placeholder="Quota €"
                  className="flex-1 bg-transparent border-0 text-xs font-bold px-2 focus:ring-0 placeholder:text-[var(--text-muted)] placeholder:font-normal"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
                {customAmount && (
                  <button 
                    type="button" 
                    onClick={() => setCustomAmount('')}
                    className="text-[9px] font-bold text-[var(--text-muted)] hover:text-[var(--text-secondary)] px-2"
                  >
                    Cancella
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => handleAdjust('withdrawal')}
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold border border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger-ghost)] transition-colors"
                >
                  Preleva
                </button>
                <button 
                  type="button"
                  onClick={() => handleAdjust('deposit')}
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
                >
                  Deposita
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default PlanCard

function PlanSparkline({ data, color = 'var(--color-primary)' }) {
  if (data.length <= 1) return null

  // Crea un gradiente ID unico per ciascun piano
  const gradientId = `colorSpark-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="h-11 w-full mt-3 -mb-1 opacity-70 hover:opacity-100 transition-opacity">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <RechartsTooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-lg shadow-md text-[9px] font-bold text-[var(--text-primary)]">
                    {payload[0].payload.label}: {formatCurrency(payload[0].value)}
                  </div>
                )
              }
              return null
            }}
          />
          <Area 
            type="monotone" 
            dataKey="val" 
            stroke={color} 
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 1 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
