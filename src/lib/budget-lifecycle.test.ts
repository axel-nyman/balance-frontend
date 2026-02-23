import { describe, it, expect } from 'vitest'
import {
  deriveDetailLifecycleState,
  deriveCardLifecycleState,
} from './budget-lifecycle'
import type { BudgetTotals, TodoListSummary } from '@/api/types'

// ---- Test helpers ----

const baseTotals: BudgetTotals = {
  income: 50000,
  expenses: 35000,
  savings: 15000,
  balance: 0,
}

const unbalancedTotals: BudgetTotals = {
  income: 50000,
  expenses: 30000,
  savings: 10000,
  balance: 10000,
}

const zeroTotals: BudgetTotals = {
  income: 0,
  expenses: 0,
  savings: 0,
  balance: 0,
}

const completeSummary: TodoListSummary = {
  totalItems: 5,
  completedItems: 5,
  pendingItems: 0,
}

const inProgressSummary: TodoListSummary = {
  totalItems: 5,
  completedItems: 3,
  pendingItems: 2,
}

const emptySummary: TodoListSummary = {
  totalItems: 0,
  completedItems: 0,
  pendingItems: 0,
}

// ---- Detail Lifecycle ----

describe('deriveDetailLifecycleState', () => {
  describe('draft states', () => {
    it('returns draft-empty when unlocked with no items', () => {
      const result = deriveDetailLifecycleState(zeroTotals, false, false, undefined, false)
      expect(result).toEqual({ type: 'draft-empty' })
    })

    it('returns draft-building when unlocked and unbalanced', () => {
      const result = deriveDetailLifecycleState(unbalancedTotals, false, true, undefined, false)
      expect(result).toEqual({ type: 'draft-building', totals: unbalancedTotals })
    })

    it('returns draft-balanced when unlocked and balanced', () => {
      const result = deriveDetailLifecycleState(baseTotals, false, true, undefined, false)
      expect(result).toEqual({ type: 'draft-balanced', totals: baseTotals })
    })

    it('treats near-zero balance as balanced (epsilon)', () => {
      const almostBalanced = { ...baseTotals, balance: 0.005 }
      const result = deriveDetailLifecycleState(almostBalanced, false, true, undefined, false)
      expect(result?.type).toBe('draft-balanced')
    })
  })

  describe('locked states', () => {
    it('returns null when loading (no summary, no error)', () => {
      const result = deriveDetailLifecycleState(baseTotals, true, true, undefined, false)
      expect(result).toBeNull()
    })

    it('returns locked-error-fallback on todo fetch error', () => {
      const result = deriveDetailLifecycleState(baseTotals, true, true, undefined, true)
      expect(result).toEqual({ type: 'locked-error-fallback', totals: baseTotals })
    })

    it('returns locked-in-progress when todos incomplete', () => {
      const result = deriveDetailLifecycleState(baseTotals, true, true, inProgressSummary, false)
      expect(result).toEqual({
        type: 'locked-in-progress',
        totals: baseTotals,
        completed: 3,
        total: 5,
      })
    })

    it('returns locked-complete when all todos done', () => {
      const result = deriveDetailLifecycleState(baseTotals, true, true, completeSummary, false)
      expect(result).toEqual({
        type: 'locked-complete',
        totals: baseTotals,
        savingsRate: 30,
        expenseRate: 70,
      })
    })

    it('returns locked-complete when todo list is empty', () => {
      const result = deriveDetailLifecycleState(baseTotals, true, true, emptySummary, false)
      expect(result?.type).toBe('locked-complete')
    })

    it('handles zero income gracefully (0% rates)', () => {
      const result = deriveDetailLifecycleState(zeroTotals, true, false, completeSummary, false)
      expect(result).toMatchObject({ savingsRate: 0, expenseRate: 0 })
    })
  })
})

// ---- Card Lifecycle ----

describe('deriveCardLifecycleState', () => {
  describe('draft states', () => {
    it('returns draft-balanced when unlocked and balanced', () => {
      const result = deriveCardLifecycleState(baseTotals, false, undefined, false)
      expect(result).toEqual({ type: 'draft-balanced', balance: 0 })
    })

    it('returns draft-unbalanced when unlocked and unbalanced', () => {
      const result = deriveCardLifecycleState(unbalancedTotals, false, undefined, false)
      expect(result).toEqual({ type: 'draft-unbalanced', balance: 10000 })
    })
  })

  describe('locked states', () => {
    it('returns null when loading', () => {
      const result = deriveCardLifecycleState(baseTotals, true, undefined, false)
      expect(result).toBeNull()
    })

    it('returns locked-error-fallback on error', () => {
      const result = deriveCardLifecycleState(baseTotals, true, undefined, true)
      expect(result).toEqual({ type: 'locked-error-fallback', balance: 0 })
    })

    it('returns locked-in-progress with counts', () => {
      const result = deriveCardLifecycleState(baseTotals, true, inProgressSummary, false)
      expect(result).toEqual({ type: 'locked-in-progress', completed: 3, total: 5 })
    })

    it('returns locked-complete with savings rate', () => {
      const result = deriveCardLifecycleState(baseTotals, true, completeSummary, false)
      expect(result).toEqual({ type: 'locked-complete', savingsRate: 30 })
    })
  })
})
