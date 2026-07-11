import { describe, it, expect } from 'vitest'
import { calculateOvertime } from './workCalculations'

describe('calculateOvertime', () => {
  const schedule = {
    monday: { active: true, start: '09:00', end: '18:00' },
    sunday: { active: false, start: '09:00', end: '18:00' }
  }

  it('calculates overtime correctly on a regular work day (no overtime)', () => {
    // Mon Jul 13 2026 is a Monday
    const result = calculateOvertime('2026-07-13', '09:00', '18:00', schedule)
    expect(result.ordinary).toBe(9 * 60)
    expect(result.overtime).toBe(0)
  })

  it('calculates overtime correctly when working extra hours', () => {
    // 8:00 to 19:00 is 1 hour before and 1 hour after schedule
    const result = calculateOvertime('2026-07-13', '08:00', '19:00', schedule)
    expect(result.ordinary).toBe(9 * 60)
    expect(result.overtime).toBe(2 * 60)
  })

  it('treats all hours as overtime on a non-working day', () => {
    // Jul 12 2026 is Sunday
    const result = calculateOvertime('2026-07-12', '09:00', '12:00', schedule)
    expect(result.ordinary).toBe(0)
    expect(result.overtime).toBe(3 * 60)
  })
})
