import type { BudgetTotals, TodoListSummary } from '@/api/types'
import { isBudgetBalanced } from './utils'

/** Shared staleTime for todo queries — todos rarely change, 5 minutes is fine */
export const TODO_STALE_TIME = 5 * 60 * 1000

// =============================================================================
// SHARED LOCKED-STATE HELPER
// =============================================================================

interface LockedResolution {
  isComplete: boolean
  savingsRate: number
  expenseRate: number
  completed: number
  total: number
}

function resolveLockedState(
  totals: BudgetTotals,
  todoSummary: TodoListSummary,
): LockedResolution {
  const isComplete =
    todoSummary.totalItems === 0 ||
    todoSummary.completedItems === todoSummary.totalItems

  const savingsRate = totals.income > 0
    ? Math.round((totals.savings / totals.income) * 100)
    : 0

  const expenseRate = totals.income > 0
    ? Math.round((totals.expenses / totals.income) * 100)
    : 0

  return {
    isComplete,
    savingsRate,
    expenseRate,
    completed: todoSummary.completedItems,
    total: todoSummary.totalItems,
  }
}

// =============================================================================
// DETAIL PAGE — 6-stage lifecycle
// =============================================================================

export type DetailLifecycleState =
  | { type: 'draft-empty' }
  | { type: 'draft-building'; totals: BudgetTotals }
  | { type: 'draft-balanced'; totals: BudgetTotals }
  | { type: 'locked-in-progress'; totals: BudgetTotals; completed: number; total: number }
  | { type: 'locked-complete'; totals: BudgetTotals; savingsRate: number; expenseRate: number }
  | { type: 'locked-error-fallback'; totals: BudgetTotals }

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
      return { type: 'locked-error-fallback', totals }
    }
    return null // still loading
  }

  const resolved = resolveLockedState(totals, todoSummary)
  if (resolved.isComplete) {
    return { type: 'locked-complete', totals, savingsRate: resolved.savingsRate, expenseRate: resolved.expenseRate }
  }
  return { type: 'locked-in-progress', totals, completed: resolved.completed, total: resolved.total }
}

// =============================================================================
// CARD — 5-stage lifecycle
// =============================================================================

export type CardLifecycleState =
  | { type: 'draft-unbalanced'; balance: number }
  | { type: 'draft-balanced'; balance: number }
  | { type: 'locked-in-progress'; completed: number; total: number }
  | { type: 'locked-complete'; savingsRate: number }
  | { type: 'locked-error-fallback'; balance: number }

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
      return { type: 'locked-error-fallback', balance: totals.balance }
    }
    return null // still loading
  }

  const resolved = resolveLockedState(totals, todoSummary)
  if (resolved.isComplete) {
    return { type: 'locked-complete', savingsRate: resolved.savingsRate }
  }
  return { type: 'locked-in-progress', completed: resolved.completed, total: resolved.total }
}
