import { describe, it, expect } from 'vitest'
import { calculateSmartAdvice } from './smartSavings'

describe('calculateSmartAdvice', () => {
  const userConfig = {
    monthly_net_income: 2000,
    savings_target_pct: 20,
    liquidity_safety_threshold: 500
  }

  const plans = [
    { id: 1, name: 'Test Plan 1', target_amount: 1000, current_amount: 100, monthly_contribution: 100, is_active: true, type: 'goal', target_date: '2026-12-31' },
    { id: 2, name: 'Emergency Fund', current_amount: 500, type: 'piggy_bank', is_active: true }
  ]

  const transactions = [
    { type: 'income', amount: 2000, date: '2026-07-05' },
    { type: 'expense', amount: 1000, date: '2026-07-10' }
  ]

  const selectedMonth = '2026-07-01'

  it('calculates suggested savings correctly under normal conditions (safe)', () => {
    // Surplus is 2000 - 1000 = 1000
    // Suggested budget is 20% of 1000 = 200
    const result = calculateSmartAdvice({
      userConfig,
      transactions,
      plans,
      selectedMonth,
      totalBalance: 2000
    })

    expect(result.surplus).toBe(1000)
    expect(result.suggestedBudget).toBe(200)
    expect(result.liquidityStatus.level).toBe('safe')
    expect(result.allocations.length).toBeGreaterThan(0)
  })

  it('restricts suggested budget when liquidity is low (warning)', () => {
    // Safety threshold is max(500, expenses * 1.2 = 1200) = 1200
    // Total balance is 600 (< 1200), so liquidity is warning/low
    // Suggested budget is reduced to 5% of surplus (5% of 1000 = 50)
    const result = calculateSmartAdvice({
      userConfig,
      transactions,
      plans,
      selectedMonth,
      totalBalance: 600
    })

    expect(result.liquidityStatus.level).toBe('warning')
    expect(result.suggestedBudget).toBe(50)
  })
})
