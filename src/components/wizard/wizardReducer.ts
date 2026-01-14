import type { WizardState, WizardAction } from './types'
import { TOTAL_STEPS } from './types'

export const initialWizardState: WizardState = {
  currentStep: 1,
  month: null,
  year: null,
  budgetExists: false,
  incomeItems: [],
  expenseItems: [],
  savingsItems: [],
  isDirty: false,
  isSubmitting: false,
  error: null,
}

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_MONTH_YEAR':
      return {
        ...state,
        month: action.month,
        year: action.year,
        isDirty: true,
      }

    case 'SET_BUDGET_EXISTS':
      return { ...state, budgetExists: action.exists }

    case 'SET_INCOME_ITEMS':
      return {
        ...state,
        incomeItems: action.items,
        isDirty: true,
      }

    case 'ADD_INCOME_ITEM':
      return {
        ...state,
        incomeItems: [...state.incomeItems, action.item],
        isDirty: true,
      }

    case 'UPDATE_INCOME_ITEM':
      return {
        ...state,
        incomeItems: state.incomeItems.map((item) =>
          item.id === action.id ? { ...item, ...action.updates } : item
        ),
        isDirty: true,
      }

    case 'REMOVE_INCOME_ITEM':
      return {
        ...state,
        incomeItems: state.incomeItems.filter((item) => item.id !== action.id),
        isDirty: true,
      }

    case 'SET_EXPENSE_ITEMS':
      return {
        ...state,
        expenseItems: action.items,
        isDirty: true,
      }

    case 'ADD_EXPENSE_ITEM':
      return {
        ...state,
        expenseItems: [...state.expenseItems, action.item],
        isDirty: true,
      }

    case 'UPDATE_EXPENSE_ITEM':
      return {
        ...state,
        expenseItems: state.expenseItems.map((item) =>
          item.id === action.id ? { ...item, ...action.updates } : item
        ),
        isDirty: true,
      }

    case 'REMOVE_EXPENSE_ITEM':
      return {
        ...state,
        expenseItems: state.expenseItems.filter((item) => item.id !== action.id),
        isDirty: true,
      }

    case 'SET_SAVINGS_ITEMS':
      return {
        ...state,
        savingsItems: action.items,
        isDirty: true,
      }

    case 'ADD_SAVINGS_ITEM':
      return {
        ...state,
        savingsItems: [...state.savingsItems, action.item],
        isDirty: true,
      }

    case 'UPDATE_SAVINGS_ITEM':
      return {
        ...state,
        savingsItems: state.savingsItems.map((item) =>
          item.id === action.id ? { ...item, ...action.updates } : item
        ),
        isDirty: true,
      }

    case 'REMOVE_SAVINGS_ITEM':
      return {
        ...state,
        savingsItems: state.savingsItems.filter((item) => item.id !== action.id),
        isDirty: true,
      }

    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS),
      }

    case 'PREV_STEP':
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 1),
      }

    case 'GO_TO_STEP':
      return {
        ...state,
        currentStep: Math.max(1, Math.min(action.step, TOTAL_STEPS)),
      }

    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.isSubmitting,
      }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
      }

    case 'RESET':
      return initialWizardState

    default:
      return state
  }
}
