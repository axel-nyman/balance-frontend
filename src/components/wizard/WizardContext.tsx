import { createContext, useContext, useReducer, type ReactNode } from 'react'
import { wizardReducer, initialWizardState } from './wizardReducer'
import type { WizardState, WizardAction } from './types'
import { isIncomeItemValid, isExpenseItemValid, isSavingsItemValid } from './types'

interface WizardContextValue {
  state: WizardState
  dispatch: React.Dispatch<WizardAction>
  isStepValid: (step: number) => boolean
  getStepStatus: (step: number) => 'complete' | 'current' | 'upcoming'
  completionPercentage: number
}

const WizardContext = createContext<WizardContextValue | null>(null)

interface WizardProviderProps {
  children: ReactNode
}

export function WizardProvider({ children }: WizardProviderProps) {
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState)

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return state.month !== null && state.year !== null
      case 2:
        return (
          state.incomeItems.length > 0 &&
          state.incomeItems.every(isIncomeItemValid)
        )
      case 3:
        // Expenses are optional, but if added they must be valid
        return state.expenseItems.every(isExpenseItemValid)
      case 4:
        // Savings are optional, but if added they must be valid
        return state.savingsItems.every(isSavingsItemValid)
      case 5:
        // Review step is valid if we got here
        return true
      default:
        return false
    }
  }

  const getStepStatus = (step: number): 'complete' | 'current' | 'upcoming' => {
    if (step < state.currentStep) return 'complete'
    if (step === state.currentStep) return 'current'
    return 'upcoming'
  }

  // Calculate completion based on steps completed (moved past)
  const calculateCompletion = (): number => {
    let completed = 0

    // Step 1: Month - only count when moved past
    if (state.currentStep > 1) completed += 20

    // Step 2: Income - only count when moved past
    if (state.currentStep > 2) completed += 20

    // Step 3: Expenses - only count when moved past
    if (state.currentStep > 3) completed += 20

    // Step 4: Savings - only count when moved past
    if (state.currentStep > 4) completed += 20

    // Step 5: Review reached
    if (state.currentStep === 5) completed += 20

    return completed
  }

  const value: WizardContextValue = {
    state,
    dispatch,
    isStepValid,
    getStepStatus,
    completionPercentage: calculateCompletion(),
  }

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  )
}

export function useWizard() {
  const context = useContext(WizardContext)
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider')
  }
  return context
}
