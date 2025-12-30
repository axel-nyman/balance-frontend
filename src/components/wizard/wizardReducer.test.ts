import { describe, it, expect } from 'vitest'
import { wizardReducer, initialWizardState } from './wizardReducer'
import type { WizardState, WizardIncomeItem, WizardExpenseItem, WizardSavingsItem } from './types'

describe('wizardReducer', () => {
  describe('SET_MONTH_YEAR', () => {
    it('sets month and year', () => {
      const state = wizardReducer(initialWizardState, {
        type: 'SET_MONTH_YEAR',
        month: 3,
        year: 2025,
      })

      expect(state.month).toBe(3)
      expect(state.year).toBe(2025)
      expect(state.isDirty).toBe(true)
    })
  })

  describe('income items', () => {
    it('adds income item', () => {
      const item: WizardIncomeItem = {
        id: '1',
        name: 'Salary',
        amount: 50000,
        bankAccountId: 'acc-1',
        bankAccountName: 'Main Account',
      }
      const state = wizardReducer(initialWizardState, {
        type: 'ADD_INCOME_ITEM',
        item,
      })

      expect(state.incomeItems).toHaveLength(1)
      expect(state.incomeItems[0]).toEqual(item)
      expect(state.isDirty).toBe(true)
    })

    it('updates income item', () => {
      const startState: WizardState = {
        ...initialWizardState,
        incomeItems: [{
          id: '1',
          name: 'Salary',
          amount: 50000,
          bankAccountId: 'acc-1',
          bankAccountName: 'Main Account',
        }],
      }

      const state = wizardReducer(startState, {
        type: 'UPDATE_INCOME_ITEM',
        id: '1',
        updates: { amount: 55000 },
      })

      expect(state.incomeItems[0].amount).toBe(55000)
      expect(state.incomeItems[0].name).toBe('Salary')
    })

    it('removes income item', () => {
      const startState: WizardState = {
        ...initialWizardState,
        incomeItems: [
          { id: '1', name: 'Salary', amount: 50000, bankAccountId: 'acc-1', bankAccountName: 'Main' },
          { id: '2', name: 'Bonus', amount: 5000, bankAccountId: 'acc-1', bankAccountName: 'Main' },
        ],
      }

      const state = wizardReducer(startState, {
        type: 'REMOVE_INCOME_ITEM',
        id: '1',
      })

      expect(state.incomeItems).toHaveLength(1)
      expect(state.incomeItems[0].id).toBe('2')
    })

    it('sets all income items', () => {
      const items: WizardIncomeItem[] = [
        { id: '1', name: 'Salary', amount: 50000, bankAccountId: 'acc-1', bankAccountName: 'Main' },
        { id: '2', name: 'Bonus', amount: 5000, bankAccountId: 'acc-1', bankAccountName: 'Main' },
      ]

      const state = wizardReducer(initialWizardState, {
        type: 'SET_INCOME_ITEMS',
        items,
      })

      expect(state.incomeItems).toEqual(items)
    })
  })

  describe('expense items', () => {
    it('adds expense item', () => {
      const item: WizardExpenseItem = {
        id: '1',
        name: 'Rent',
        amount: 8000,
        bankAccountId: 'acc-1',
        bankAccountName: 'Main',
        isManual: false,
      }
      const state = wizardReducer(initialWizardState, {
        type: 'ADD_EXPENSE_ITEM',
        item,
      })

      expect(state.expenseItems).toHaveLength(1)
      expect(state.expenseItems[0]).toEqual(item)
    })

    it('updates expense item', () => {
      const startState: WizardState = {
        ...initialWizardState,
        expenseItems: [{
          id: '1',
          name: 'Rent',
          amount: 8000,
          bankAccountId: 'acc-1',
          bankAccountName: 'Main',
          isManual: false,
        }],
      }

      const state = wizardReducer(startState, {
        type: 'UPDATE_EXPENSE_ITEM',
        id: '1',
        updates: { amount: 8500 },
      })

      expect(state.expenseItems[0].amount).toBe(8500)
    })

    it('removes expense item', () => {
      const startState: WizardState = {
        ...initialWizardState,
        expenseItems: [{
          id: '1',
          name: 'Rent',
          amount: 8000,
          bankAccountId: 'acc-1',
          bankAccountName: 'Main',
          isManual: false,
        }],
      }

      const state = wizardReducer(startState, {
        type: 'REMOVE_EXPENSE_ITEM',
        id: '1',
      })

      expect(state.expenseItems).toHaveLength(0)
    })
  })

  describe('savings items', () => {
    it('adds savings item', () => {
      const item: WizardSavingsItem = {
        id: '1',
        name: 'Emergency Fund',
        amount: 5000,
        bankAccountId: 'acc-2',
        bankAccountName: 'Savings',
      }
      const state = wizardReducer(initialWizardState, {
        type: 'ADD_SAVINGS_ITEM',
        item,
      })

      expect(state.savingsItems).toHaveLength(1)
      expect(state.savingsItems[0]).toEqual(item)
    })

    it('updates savings item', () => {
      const startState: WizardState = {
        ...initialWizardState,
        savingsItems: [{
          id: '1',
          name: 'Emergency Fund',
          amount: 5000,
          bankAccountId: 'acc-2',
          bankAccountName: 'Savings',
        }],
      }

      const state = wizardReducer(startState, {
        type: 'UPDATE_SAVINGS_ITEM',
        id: '1',
        updates: { amount: 6000 },
      })

      expect(state.savingsItems[0].amount).toBe(6000)
    })

    it('removes savings item', () => {
      const startState: WizardState = {
        ...initialWizardState,
        savingsItems: [{
          id: '1',
          name: 'Emergency Fund',
          amount: 5000,
          bankAccountId: 'acc-2',
          bankAccountName: 'Savings',
        }],
      }

      const state = wizardReducer(startState, {
        type: 'REMOVE_SAVINGS_ITEM',
        id: '1',
      })

      expect(state.savingsItems).toHaveLength(0)
    })
  })

  describe('navigation', () => {
    it('goes to next step', () => {
      const state = wizardReducer(initialWizardState, { type: 'NEXT_STEP' })
      expect(state.currentStep).toBe(2)
    })

    it('does not exceed max steps', () => {
      const startState: WizardState = { ...initialWizardState, currentStep: 5 }
      const state = wizardReducer(startState, { type: 'NEXT_STEP' })
      expect(state.currentStep).toBe(5)
    })

    it('goes to previous step', () => {
      const startState: WizardState = { ...initialWizardState, currentStep: 3 }
      const state = wizardReducer(startState, { type: 'PREV_STEP' })
      expect(state.currentStep).toBe(2)
    })

    it('does not go below step 1', () => {
      const state = wizardReducer(initialWizardState, { type: 'PREV_STEP' })
      expect(state.currentStep).toBe(1)
    })

    it('goes to specific step', () => {
      const state = wizardReducer(initialWizardState, { type: 'GO_TO_STEP', step: 4 })
      expect(state.currentStep).toBe(4)
    })

    it('clamps step to valid range', () => {
      const state1 = wizardReducer(initialWizardState, { type: 'GO_TO_STEP', step: 10 })
      expect(state1.currentStep).toBe(5)

      const state2 = wizardReducer(initialWizardState, { type: 'GO_TO_STEP', step: 0 })
      expect(state2.currentStep).toBe(1)
    })
  })

  describe('submission state', () => {
    it('sets submitting state', () => {
      const state = wizardReducer(initialWizardState, {
        type: 'SET_SUBMITTING',
        isSubmitting: true,
      })
      expect(state.isSubmitting).toBe(true)
    })

    it('sets error', () => {
      const state = wizardReducer(initialWizardState, {
        type: 'SET_ERROR',
        error: 'Something went wrong',
      })
      expect(state.error).toBe('Something went wrong')
    })

    it('clears error', () => {
      const startState: WizardState = {
        ...initialWizardState,
        error: 'Previous error',
      }

      const state = wizardReducer(startState, {
        type: 'SET_ERROR',
        error: null,
      })
      expect(state.error).toBeNull()
    })
  })

  describe('reset', () => {
    it('resets to initial state', () => {
      const dirtyState: WizardState = {
        ...initialWizardState,
        currentStep: 3,
        month: 5,
        year: 2025,
        incomeItems: [{
          id: '1',
          name: 'Test',
          amount: 100,
          bankAccountId: 'acc-1',
          bankAccountName: 'Main',
        }],
        isDirty: true,
      }

      const state = wizardReducer(dirtyState, { type: 'RESET' })
      expect(state).toEqual(initialWizardState)
    })
  })
})
