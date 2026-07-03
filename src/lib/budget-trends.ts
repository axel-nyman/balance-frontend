import { compareMonthYear } from '@/lib/utils'
import type { BudgetSummary } from '@/api/types'

/** The trends chart plots at most this many of the most recent locked budgets. */
export const MAX_TREND_MONTHS = 12

/** Locked budgets in chronological (year, month) order, capped to the most recent 12. */
export function selectTrendBudgets(budgets: BudgetSummary[]): BudgetSummary[] {
  return budgets
    .filter((budget) => budget.status === 'LOCKED')
    .sort(compareMonthYear)
    .slice(-MAX_TREND_MONTHS)
}
