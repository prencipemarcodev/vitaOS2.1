import { differenceInMonths, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'

/**
 * Calcola il suggerimento intelligente per la distribuzione del risparmio.
 * Seguendo le specifiche tecniche della sezione 5.5.
 */
export function calculateSmartAdvice({ 
  userConfig, 
  transactions, 
  plans, 
  selectedMonth,
  totalBalance = 0 // Nuovo parametro: saldo reale totale
}) {
  if (!userConfig || !plans || plans.length === 0) return null

  const monthStart = startOfMonth(parseISO(selectedMonth))
  const monthEnd = endOfMonth(monthStart)

  // 1. CALCOLO SURPLUS E STATO LIQUIDITÀ
  const actualIncome = transactions
    .filter(t => t.type === 'income' && isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd }))
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  const actualExpenses = transactions
    .filter(t => t.type === 'expense' && isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd }))
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  const baseIncome = parseFloat(userConfig.monthly_net_income || 0)
  const surplus = Math.max(actualIncome, baseIncome) - actualExpenses
  
  // SOGLIA DI SICUREZZA (Commercialista Mode)
  // Se il saldo totale è < 500€ o < spese mensili, siamo in zona rischio
  const safetyThreshold = Math.max(500, actualExpenses * 1.2)
  const isLiquidityLow = totalBalance < safetyThreshold

  if (surplus <= 0) {
    return {
      surplus,
      suggestedBudget: 0,
      allocations: [],
      warning: "Surplus negativo: le uscite superano le entrate.",
      coachAdvice: isLiquidityLow 
        ? "Situazione critica: non hai liquidità sufficiente e sei in deficit. Stop a ogni risparmio, taglia le spese subito."
        : "Sei in leggero deficit questo mese, ma la tua liquidità ti protegge. Evita nuovi depositi per ora."
    }
  }

  // Budget risparmio: se liquidità bassa, riduciamo il budget per proteggere il cash
  const baseTargetPct = parseFloat(userConfig.savings_target_pct || 20) / 100
  const adjustedTargetPct = isLiquidityLow ? Math.min(baseTargetPct, 0.05) : baseTargetPct
  const suggestedBudget = surplus * adjustedTargetPct

  // 2. PRIORITIZZAZIONE PIANI
  const activePlans = plans.filter(p => p.is_active !== false)
  const plansWithUrgency = activePlans.map(plan => {
    const targetAmount = parseFloat(plan.target_amount) || 0
    const currentAmount = parseFloat(plan.current_amount || 0)
    const missing = Math.max(0, targetAmount - currentAmount)
    
    let urgency = 0
    let minMonthly = 0

    if (plan.type === 'piggy_bank') {
      urgency = isLiquidityLow ? 100 : 5 // Se liquidità bassa, il salvadanaio (fondo emergenza) diventa priorità max
    } else if (plan.target_date) {
      const monthsLeft = Math.max(1, differenceInMonths(parseISO(plan.target_date), new Date()))
      minMonthly = missing / monthsLeft
      urgency = missing / monthsLeft
    } else {
      urgency = (plan.priority || 2) * 5
    }

    return { ...plan, missing, urgency, minMonthly }
  })

  plansWithUrgency.sort((a, b) => b.urgency - a.urgency)

  // 3. DISTRIBUZIONE BUDGET
  let remainingBudget = suggestedBudget
  const allocations = []

  plansWithUrgency.forEach(plan => {
    if (remainingBudget <= 0) return
    let amount = 0
    
    if (plan.type === 'piggy_bank' && isLiquidityLow) {
      amount = remainingBudget // Tutto nel salvadanaio se siamo a corto di cash
    } else if (plan.minMonthly > 0) {
      amount = Math.min(remainingBudget, plan.minMonthly)
    } else {
      amount = Math.min(remainingBudget, remainingBudget * 0.3)
    }

    if (amount > 0) {
      allocations.push({
        plan_id: plan.id,
        plan_name: plan.name,
        amount: amount,
        reason: plan.type === 'piggy_bank' ? 'Fondo emergenza' : 'Accumulo programmato'
      })
      remainingBudget -= amount
    }
  })

  // Coach Advice finale
  let coachAdvice = "Ottimo lavoro! Stai seguendo il tuo piano di accumulo correttamente."
  if (isLiquidityLow) {
    coachAdvice = `La tua liquidità (${totalBalance.toFixed(2)}€) è sotto la soglia di sicurezza (${safetyThreshold.toFixed(2)}€). Ho ridotto il budget di risparmio per proteggere il tuo contante.`
  } else if (surplus > baseIncome * 0.3) {
    coachAdvice = "Hai un surplus eccezionale questo mese! Considera di aumentare i depositi sui piani a priorità alta."
  }

  return {
    surplus,
    suggestedBudget,
    allocations: allocations.filter(a => a.amount > 0),
    warning: isLiquidityLow ? "Liquidità limitata" : null,
    coachAdvice
  }
}
