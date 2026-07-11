import { differenceInMonths, parseISO, startOfMonth, endOfMonth, isWithinInterval, addMonths, format } from 'date-fns'
import { it } from 'date-fns/locale'

/**
 * Calcola il suggerimento intelligente per la distribuzione del risparmio.
 * Fornisce spiegazioni dettagliate sulla gestione del saldo, soglie di sicurezza e previsioni.
 */
export function calculateSmartAdvice({ 
  userConfig, 
  transactions, 
  plans, 
  selectedMonth,
  totalBalance = 0
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
  // Se il saldo totale è < userThreshold o < spese mensili, siamo in zona rischio
  const userThreshold = userConfig.liquidity_safety_threshold !== undefined ? parseFloat(userConfig.liquidity_safety_threshold) : 200
  const safetyThreshold = Math.max(userThreshold, actualExpenses * 1.2)
  const isLiquidityLow = totalBalance < safetyThreshold

  let liquidityStatus = {
    level: isLiquidityLow ? (totalBalance < safetyThreshold * 0.5 ? 'critical' : 'warning') : 'safe',
    message: '',
    color: 'success', // success = green, warning = yellow, danger = red
  }

  if (liquidityStatus.level === 'critical') {
    liquidityStatus.message = `La tua liquidità (${totalBalance.toFixed(2)}€) è estremamente critica. È inferiore al 50% della soglia di sicurezza consigliata (${safetyThreshold.toFixed(2)}€). Taglia subito le spese non necessarie e sospendi i depositi.`
    liquidityStatus.color = 'danger'
  } else if (liquidityStatus.level === 'warning') {
    liquidityStatus.message = `La tua liquidità (${totalBalance.toFixed(2)}€) è sotto la soglia di sicurezza (${safetyThreshold.toFixed(2)}€). Si consiglia cautela: riduci i risparmi questo mese per consolidare la riserva.`
    liquidityStatus.color = 'warning'
  } else {
    liquidityStatus.message = `La tua liquidità (${totalBalance.toFixed(2)}€) è in ottima salute, al di sopra della soglia di sicurezza consigliata di ${safetyThreshold.toFixed(2)}€.`
    liquidityStatus.color = 'success'
  }

  // 2. PREVISIONI E COMPLETAMENTO OBIETTIVI (FORECASTS)
  const activePlans = plans.filter(p => p.is_active !== false)
  const forecasts = activePlans.map(plan => {
    const targetAmount = parseFloat(plan.target_amount) || 0
    const currentAmount = parseFloat(plan.current_amount || 0)
    const missing = Math.max(0, targetAmount - currentAmount)
    const monthlyContrib = parseFloat(plan.monthly_contribution || 0)

    if (plan.type === 'piggy_bank') {
      return {
        planId: plan.id,
        planName: plan.name,
        type: 'piggy_bank',
        isCompleted: false,
        isAtRisk: false,
        monthsToComplete: null,
        estimatedCompletionDate: 'N/A (Fondo libero)',
        extraContributionNeeded: 0,
        statusLabel: 'Fondo Libero'
      }
    }

    if (missing === 0) {
      return {
        planId: plan.id,
        planName: plan.name,
        type: 'goal',
        isCompleted: true,
        isAtRisk: false,
        monthsToComplete: 0,
        estimatedCompletionDate: 'Completato! 🎉',
        extraContributionNeeded: 0,
        statusLabel: 'Completato'
      }
    }

    if (monthlyContrib <= 0) {
      const monthsLeft = plan.target_date 
        ? Math.max(1, differenceInMonths(parseISO(plan.target_date), new Date()))
        : 12
      return {
        planId: plan.id,
        planName: plan.name,
        type: 'goal',
        isCompleted: false,
        isAtRisk: plan.target_date ? true : false,
        monthsToComplete: Infinity,
        estimatedCompletionDate: 'Mai (Nessun contributo impostato)',
        extraContributionNeeded: plan.target_date ? (missing / monthsLeft) : 0,
        statusLabel: plan.target_date ? 'A Rischio (Quota €0)' : 'Nessun Contributo'
      }
    }

    const monthsToComplete = missing / monthlyContrib
    const estCompletionDate = addMonths(new Date(), Math.ceil(monthsToComplete))
    const estDateStr = format(estCompletionDate, 'MMMM yyyy', { locale: it })

    let isAtRisk = false
    let extraContributionNeeded = 0
    let statusLabel = 'In Linea'

    if (plan.target_date) {
      const monthsLeft = Math.max(1, differenceInMonths(parseISO(plan.target_date), new Date()))
      if (monthsToComplete > monthsLeft) {
        isAtRisk = true
        const requiredMonthly = missing / monthsLeft
        extraContributionNeeded = requiredMonthly - monthlyContrib
        statusLabel = `A Rischio (-${extraContributionNeeded.toFixed(0)}€/mese)`
      }
    }

    return {
      planId: plan.id,
      planName: plan.name,
      type: 'goal',
      isCompleted: false,
      isAtRisk,
      monthsToComplete,
      estimatedCompletionDate: estDateStr,
      extraContributionNeeded,
      statusLabel
    }
  })

  // Budget risparmio: se liquidità bassa, riduciamo il budget per proteggere il cash
  const baseTargetPct = parseFloat(userConfig.savings_target_pct || 20) / 100
  const adjustedTargetPct = isLiquidityLow ? Math.min(baseTargetPct, 0.05) : baseTargetPct
  const suggestedBudget = surplus > 0 ? surplus * adjustedTargetPct : 0

  // 3. PRIORITIZZAZIONE PIANI E DISTRIBUZIONE BUDGET
  const plansWithUrgency = forecasts.map(f => {
    const plan = activePlans.find(p => p.id === f.planId)
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

  let remainingBudget = suggestedBudget
  const allocations = []

  plansWithUrgency.forEach(plan => {
    if (remainingBudget <= 0) return
    if (plan.type === 'goal' && plan.missing <= 0) return
    
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
    coachAdvice = `La tua liquidità (${totalBalance.toFixed(2)}€) è sotto la soglia di sicurezza (${safetyThreshold.toFixed(2)}€). Ho ridotto il budget di risparmio consigliato per proteggere le tue riserve attive.`
  } else if (surplus > baseIncome * 0.3) {
    coachAdvice = "Hai un surplus eccezionale questo mese! Considera di aumentare i depositi sui piani a priorità alta per raggiungere prima i tuoi obiettivi."
  } else if (surplus <= 0) {
    coachAdvice = isLiquidityLow 
      ? "Situazione critica: non hai liquidità sufficiente e sei in deficit. Stop a ogni risparmio, taglia le spese subito."
      : "Sei in leggero deficit questo mese, ma la tua liquidità ti protegge. Evita nuovi depositi e monitora le uscite."
  }

  return {
    surplus,
    suggestedBudget,
    allocations: allocations.filter(a => a.amount > 0),
    warning: isLiquidityLow ? "Liquidità limitata" : null,
    coachAdvice,
    safetyThreshold,
    liquidityStatus,
    forecasts
  }
}
