import { differenceInMonths, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'

/**
 * Calcola il suggerimento intelligente per la distribuzione del risparmio.
 * Seguendo le specifiche tecniche della sezione 5.5.
 */
export function calculateSmartAdvice({ 
  userConfig, 
  transactions, 
  plans, 
  selectedMonth 
}) {
  if (!userConfig || !plans || plans.length === 0) return null

  const monthStart = startOfMonth(parseISO(selectedMonth))
  const monthEnd = endOfMonth(monthStart)

  // 1. CALCOLO SURPLUS
  // Entrate effettive registrate nel mese
  const actualIncome = transactions
    .filter(t => t.type === 'income' && isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd }))
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  // Uscite effettive registrate nel mese
  const actualExpenses = transactions
    .filter(t => t.type === 'expense' && isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd }))
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  // Reddito netto mensile configurato (fallback se non ci sono transazioni income ancora)
  const baseIncome = parseFloat(userConfig.monthly_net_income || 0)
  
  // Mensilità aggiuntive (13a a Dicembre, 14a a Giugno per default)
  let extraIncome = 0
  const monthIdx = monthStart.getMonth() + 1 // 1-12
  if (userConfig.has_thirteenth && monthIdx === (userConfig.thirteenth_month || 12)) extraIncome += baseIncome
  if (userConfig.has_fourteenth && monthIdx === (userConfig.fourteenth_month || 6)) extraIncome += baseIncome

  const estimatedTotalIncome = Math.max(actualIncome, baseIncome + extraIncome)
  
  // Surplus stimato
  const surplus = estimatedTotalIncome - actualExpenses
  
  if (surplus <= 0) {
    return {
      surplus: surplus,
      suggestedBudget: 0,
      allocations: [],
      warning: "Surplus negativo o nullo: le uscite superano le entrate. Valuta di ridurre le spese."
    }
  }

  // Budget risparmio: min(surplus * target%, surplus * 50%)
  const targetPct = parseFloat(userConfig.savings_target_pct || 20) / 100
  const suggestedBudget = Math.min(surplus * targetPct, surplus * 0.50)

  // 2. PRIORITIZZAZIONE PIANI
  const activePlans = plans.filter(p => p.is_active !== false)
  const plansWithUrgency = activePlans.map(plan => {
    const targetAmount = parseFloat(plan.target_amount)
    const currentAmount = parseFloat(plan.current_amount || 0)
    const missing = Math.max(0, targetAmount - currentAmount)
    
    let urgency = 0
    let minMonthly = 0

    if (plan.target_date) {
      const monthsLeft = Math.max(1, differenceInMonths(parseISO(plan.target_date), new Date()))
      minMonthly = missing / monthsLeft
      urgency = missing / monthsLeft
    } else {
      urgency = (plan.priority || 2) * 10 // Urgenza basata su priorità se non c'è data
    }

    return { ...plan, missing, urgency, minMonthly }
  })

  // Ordina per urgenza decrescente
  plansWithUrgency.sort((a, b) => b.urgency - a.urgency)

  // 3. DISTRIBUZIONE BUDGET
  let remainingBudget = suggestedBudget
  const allocations = []

  // Prima fase: garantiamo il contributo minimo ai piani con scadenza (se possibile)
  plansWithUrgency.forEach(plan => {
    if (plan.minMonthly > 0 && remainingBudget > 0) {
      const amount = Math.min(remainingBudget, plan.minMonthly)
      allocations.push({
        plan_id: plan.id,
        plan_name: plan.name,
        amount: amount,
        reason: plan.missing <= amount ? 'Completamento obiettivo' : 'Contributo minimo richiesto'
      })
      remainingBudget -= amount
    }
  })

  // Seconda fase: distribuiamo il rimanente proporzionalmente alla priorità/urgenza
  if (remainingBudget > 0 && plansWithUrgency.length > 0) {
    const totalUrgency = plansWithUrgency.reduce((s, p) => s + p.urgency, 0)
    plansWithUrgency.forEach(plan => {
      if (remainingBudget <= 0) return
      
      const share = plan.urgency / totalUrgency
      const extra = remainingBudget * share
      
      // Cerca se c'è già un'allocazione per questo piano
      const existing = allocations.find(a => a.plan_id === plan.id)
      if (existing) {
        existing.amount += extra
      } else {
        allocations.push({
          plan_id: plan.id,
          plan_name: plan.name,
          amount: extra,
          reason: 'Distribuzione surplus'
        })
      }
    })
  }

  return {
    surplus,
    suggestedBudget,
    allocations: allocations.filter(a => a.amount > 0),
    warning: null
  }
}
