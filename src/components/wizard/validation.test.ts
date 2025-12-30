import { describe, it, expect } from 'vitest'
import {
  budgetExistsForMonth,
  isMonthTooOld,
  getDefaultMonthYear,
  validateMonthYear,
} from './validation'

describe('budgetExistsForMonth', () => {
  it('returns true when budget exists for given month/year', () => {
    const budgets = [
      { month: 1, year: 2025 },
      { month: 3, year: 2025 },
    ]

    expect(budgetExistsForMonth(1, 2025, budgets)).toBe(true)
    expect(budgetExistsForMonth(3, 2025, budgets)).toBe(true)
  })

  it('returns false when no budget exists for given month/year', () => {
    const budgets = [
      { month: 1, year: 2025 },
      { month: 3, year: 2025 },
    ]

    expect(budgetExistsForMonth(2, 2025, budgets)).toBe(false)
    expect(budgetExistsForMonth(1, 2024, budgets)).toBe(false)
  })

  it('returns false for empty budget list', () => {
    expect(budgetExistsForMonth(1, 2025, [])).toBe(false)
  })
})

describe('isMonthTooOld', () => {
  it('returns false when no budgets exist', () => {
    expect(isMonthTooOld(1, 2025, null, [])).toBe(false)
  })

  it('returns false when selected is after most recent', () => {
    const mostRecent = { month: 3, year: 2025 }
    const budgets = [mostRecent]

    expect(isMonthTooOld(4, 2025, mostRecent, budgets)).toBe(false)
    expect(isMonthTooOld(1, 2026, mostRecent, budgets)).toBe(false)
  })

  it('returns false when selected equals most recent', () => {
    const mostRecent = { month: 3, year: 2025 }
    const budgets = [mostRecent]

    expect(isMonthTooOld(3, 2025, mostRecent, budgets)).toBe(false)
  })

  it('returns false when filling a gap (month does not exist)', () => {
    const mostRecent = { month: 3, year: 2025 }
    const budgets = [{ month: 1, year: 2025 }, mostRecent]

    // Feb 2025 fills a gap between Jan and March
    expect(isMonthTooOld(2, 2025, mostRecent, budgets)).toBe(false)
  })

  it('returns true when month already exists (not a valid gap fill)', () => {
    const mostRecent = { month: 3, year: 2025 }
    const budgets = [{ month: 1, year: 2025 }, mostRecent]

    // Jan 2025 already exists
    expect(isMonthTooOld(1, 2025, mostRecent, budgets)).toBe(true)
  })
})

describe('getDefaultMonthYear', () => {
  it('returns next month when no budgets exist', () => {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const expectedMonth = currentMonth === 12 ? 1 : currentMonth + 1
    const expectedYear = currentMonth === 12 ? currentYear + 1 : currentYear

    const result = getDefaultMonthYear([])

    expect(result.month).toBe(expectedMonth)
    expect(result.year).toBe(expectedYear)
  })

  it('returns month after next when next month has budget', () => {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear
    const budgets = [{ month: nextMonth, year: nextYear }]

    const result = getDefaultMonthYear(budgets)

    // Should skip to month after next
    expect(budgetExistsForMonth(result.month, result.year, budgets)).toBe(false)
  })

  it('finds first available month when multiple exist', () => {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear

    // Next month and month after next have budgets
    let monthAfterNext = nextMonth === 12 ? 1 : nextMonth + 1
    let yearAfterNext = nextMonth === 12 ? nextYear + 1 : nextYear

    const budgets = [
      { month: nextMonth, year: nextYear },
      { month: monthAfterNext, year: yearAfterNext },
    ]

    const result = getDefaultMonthYear(budgets)

    // Should skip to third month from now
    expect(budgetExistsForMonth(result.month, result.year, budgets)).toBe(false)
  })
})

describe('validateMonthYear', () => {
  it('returns invalid when unlocked budget exists', () => {
    const result = validateMonthYear(1, 2025, [], null, true)

    expect(result.valid).toBe(false)
    expect(result.error).toContain('unlocked budget')
  })

  it('returns invalid when budget already exists for month', () => {
    const budgets = [{ month: 1, year: 2025 }]
    const result = validateMonthYear(1, 2025, budgets, { month: 1, year: 2025 }, false)

    expect(result.valid).toBe(false)
    expect(result.error).toContain('already exists')
  })

  it('returns invalid when trying to create existing month before most recent', () => {
    // Scenario: March 2025 exists, Jan 2025 exists
    // Trying to create Jan 2025 again - fails because it already exists
    const mostRecent = { month: 3, year: 2025 }
    const budgets = [{ month: 1, year: 2025 }, mostRecent]
    const result = validateMonthYear(1, 2025, budgets, mostRecent, false)

    expect(result.valid).toBe(false)
    expect(result.error).toContain('already exists')
  })

  it('returns invalid for month outside 1-12 range', () => {
    const result = validateMonthYear(13, 2025, [], null, false)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('1 and 12')

    const result2 = validateMonthYear(0, 2025, [], null, false)
    expect(result2.valid).toBe(false)
  })

  it('returns invalid for year outside 2020-2100 range', () => {
    const result = validateMonthYear(1, 2019, [], null, false)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('2020 and 2100')

    const result2 = validateMonthYear(1, 2101, [], null, false)
    expect(result2.valid).toBe(false)
  })

  it('returns valid for valid month/year selection', () => {
    const result = validateMonthYear(6, 2025, [], null, false)

    expect(result.valid).toBe(true)
    expect(result.error).toBeNull()
  })

  it('allows gap-filling', () => {
    const mostRecent = { month: 3, year: 2025 }
    const budgets = [{ month: 1, year: 2025 }, mostRecent]
    const result = validateMonthYear(2, 2025, budgets, mostRecent, false)

    expect(result.valid).toBe(true)
  })
})
