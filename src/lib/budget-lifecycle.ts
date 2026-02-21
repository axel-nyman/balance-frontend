import type { BudgetTotals, TodoListSummary } from '@/api/types'
import { isBudgetBalanced } from './utils'

// =============================================================================
// DETAIL PAGE — 5-stage lifecycle
// =============================================================================

export type DetailLifecycleState =
  | { type: 'draft-empty' }
  | { type: 'draft-building'; totals: BudgetTotals }
  | { type: 'draft-balanced'; totals: BudgetTotals }
  | { type: 'locked-in-progress'; totals: BudgetTotals; completed: number; total: number }
  | { type: 'locked-complete'; totals: BudgetTotals; savingsRate: number }

export function deriveDetailLifecycleState(
  totals: BudgetTotals,
  isLocked: boolean,
  hasItems: boolean,
  todoSummary: TodoListSummary | undefined,
  todoError: boolean,
): DetailLifecycleState | null {
  if (!isLocked) {
    if (!hasItems) {
      return { type: 'draft-empty' }
    }
    if (isBudgetBalanced(totals.balance)) {
      return { type: 'draft-balanced', totals }
    }
    return { type: 'draft-building', totals }
  }

  // Locked — need todo data
  if (!todoSummary) {
    if (todoError) {
      return { type: 'draft-building', totals }
    }
    return null // still loading
  }

  const isComplete = todoSummary.totalItems === 0 || todoSummary.completedItems === todoSummary.totalItems
  if (isComplete) {
    const savingsRate = totals.income > 0 ? Math.round((totals.savings / totals.income) * 100) : 0
    return { type: 'locked-complete', totals, savingsRate }
  }

  return { type: 'locked-in-progress', totals, completed: todoSummary.completedItems, total: todoSummary.totalItems }
}

// =============================================================================
// CARD — 4-stage lifecycle
// =============================================================================

export type CardLifecycleState =
  | { type: 'draft-unbalanced'; balance: number }
  | { type: 'draft-balanced'; balance: number }
  | { type: 'locked-in-progress'; completed: number; total: number }
  | { type: 'locked-complete'; savingsRate: number }

export function deriveCardLifecycleState(
  totals: BudgetTotals,
  isLocked: boolean,
  todoSummary: TodoListSummary | undefined,
  todoError: boolean,
): CardLifecycleState | null {
  if (!isLocked) {
    if (isBudgetBalanced(totals.balance)) {
      return { type: 'draft-balanced', balance: totals.balance }
    }
    return { type: 'draft-unbalanced', balance: totals.balance }
  }

  // Locked — need todo data
  if (!todoSummary) {
    if (todoError) {
      return { type: 'draft-unbalanced', balance: totals.balance }
    }
    return null // still loading
  }

  const isComplete = todoSummary.totalItems === 0 || todoSummary.completedItems === todoSummary.totalItems
  if (isComplete) {
    const savingsRate = totals.income > 0 ? Math.round((totals.savings / totals.income) * 100) : 0
    return { type: 'locked-complete', savingsRate }
  }

  return { type: 'locked-in-progress', completed: todoSummary.completedItems, total: todoSummary.totalItems }
}
