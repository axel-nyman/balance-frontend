# Story 5.1: Wizard Shell & State Management

**As a** user  
**I want to** see a clear multi-step wizard interface  
**So that** I can create a budget step by step

### Acceptance Criteria

- [ ] Page renders at `/budgets/new` route
- [ ] Shows step indicator (1-5) with current step highlighted
- [ ] Shows step title for current step
- [ ] Next/Back buttons for navigation
- [ ] Back button hidden on step 1
- [ ] Next button disabled until step is valid
- [ ] Abandonment warning when navigating away with data

### Wizard State Structure

```typescript
// src/components/wizard/types.ts

// =============================================================================
// WIZARD ITEM TYPES
// These mirror the API request types but include a client-side `id` for local
// state management and display-only fields for UX purposes.
// =============================================================================

export interface WizardIncomeItem {
  id: string                    // Client-side UUID for React keys and local operations
  name: string                  // Required: e.g., "Salary", "Freelance payment"
  amount: number                // Required: Must be positive
  bankAccountId: string         // Required: Target account for this income
  bankAccountName: string       // Display only: Shown in UI, not sent to API
}

export interface WizardExpenseItem {
  id: string                    // Client-side UUID
  name: string                  // Required: e.g., "Rent", "Groceries"
  amount: number                // Required: Must be positive
  bankAccountId: string         // Required: Account this expense comes from
  bankAccountName: string       // Display only: Shown in UI
  isManual: boolean             // Required: If true, generates PAYMENT todo item
  recurringExpenseId?: string   // Optional: Link to recurring expense template
  deductedAt?: string           // Optional: Date expense is deducted (ISO format)
}

export interface WizardSavingsItem {
  id: string                    // Client-side UUID
  name: string                  // Required: e.g., "Emergency Fund", "Vacation"
  amount: number                // Required: Must be positive
  bankAccountId: string         // Required: Target savings account
  bankAccountName: string       // Display only: Shown in UI
}

// =============================================================================
// WIZARD STATE
// =============================================================================

export interface WizardState {
  currentStep: number
  month: number | null
  year: number | null
  incomeItems: WizardIncomeItem[]
  expenseItems: WizardExpenseItem[]
  savingsItems: WizardSavingsItem[]
  isDirty: boolean
  isSubmitting: boolean
  error: string | null
}

// =============================================================================
// WIZARD ACTIONS
// =============================================================================

export type WizardAction =
  | { type: 'SET_MONTH_YEAR'; month: number; year: number }
  // Income actions
  | { type: 'SET_INCOME_ITEMS'; items: WizardIncomeItem[] }
  | { type: 'ADD_INCOME_ITEM'; item: WizardIncomeItem }
  | { type: 'UPDATE_INCOME_ITEM'; id: string; updates: Partial<WizardIncomeItem> }
  | { type: 'REMOVE_INCOME_ITEM'; id: string }
  // Expense actions
  | { type: 'SET_EXPENSE_ITEMS'; items: WizardExpenseItem[] }
  | { type: 'ADD_EXPENSE_ITEM'; item: WizardExpenseItem }
  | { type: 'UPDATE_EXPENSE_ITEM'; id: string; updates: Partial<WizardExpenseItem> }
  | { type: 'REMOVE_EXPENSE_ITEM'; id: string }
  // Savings actions
  | { type: 'SET_SAVINGS_ITEMS'; items: WizardSavingsItem[] }
  | { type: 'ADD_SAVINGS_ITEM'; item: WizardSavingsItem }
  | { type: 'UPDATE_SAVINGS_ITEM'; id: string; updates: Partial<WizardSavingsItem> }
  | { type: 'REMOVE_SAVINGS_ITEM'; id: string }
  // Navigation actions
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; step: number }
  // Submission actions
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' }

// =============================================================================
// CONSTANTS
// =============================================================================

export const STEP_TITLES = [
  'Select Month',
  'Income',
  'Expenses',
  'Savings',
  'Review',
] as const

export const TOTAL_STEPS = 5

// =============================================================================
// HELPER: Convert wizard items to API requests
// =============================================================================

import type {
  CreateBudgetIncomeRequest,
  CreateBudgetExpenseRequest,
  CreateBudgetSavingsRequest,
} from '@/api/types'

export function toIncomeRequest(item: WizardIncomeItem): CreateBudgetIncomeRequest {
  return {
    name: item.name,
    amount: item.amount,
    bankAccountId: item.bankAccountId,
  }
}

export function toExpenseRequest(item: WizardExpenseItem): CreateBudgetExpenseRequest {
  return {
    name: item.name,
    amount: item.amount,
    bankAccountId: item.bankAccountId,
    isManual: item.isManual,
    recurringExpenseId: item.recurringExpenseId,
    deductedAt: item.deductedAt,
  }
}

export function toSavingsRequest(item: WizardSavingsItem): CreateBudgetSavingsRequest {
  return {
    name: item.name,
    amount: item.amount,
    bankAccountId: item.bankAccountId,
  }
}
```

### Implementation

**Create `src/components/wizard/types.ts`:**

```typescript
import type {
  CreateBudgetIncomeRequest,
  CreateBudgetExpenseRequest,
  CreateBudgetSavingsRequest,
} from '@/api/types'

// =============================================================================
// WIZARD ITEM TYPES
// =============================================================================

export interface WizardIncomeItem {
  id: string                    // Client-side UUID
  name: string                  // Required: e.g., "Salary"
  amount: number                // Required: Must be positive
  bankAccountId: string         // Required: Target account
  bankAccountName: string       // Display only
}

export interface WizardExpenseItem {
  id: string                    // Client-side UUID
  name: string                  // Required: e.g., "Rent"
  amount: number                // Required: Must be positive
  bankAccountId: string         // Required: Source account
  bankAccountName: string       // Display only
  isManual: boolean             // Required: Generates PAYMENT todo if true
  recurringExpenseId?: string   // Optional: Link to template
  deductedAt?: string           // Optional: Deduction date (ISO)
}

export interface WizardSavingsItem {
  id: string                    // Client-side UUID
  name: string                  // Required: e.g., "Emergency Fund"
  amount: number                // Required: Must be positive
  bankAccountId: string         // Required: Target savings account
  bankAccountName: string       // Display only
}

// =============================================================================
// WIZARD STATE
// =============================================================================

export interface WizardState {
  currentStep: number
  month: number | null
  year: number | null
  incomeItems: WizardIncomeItem[]
  expenseItems: WizardExpenseItem[]
  savingsItems: WizardSavingsItem[]
  isDirty: boolean
  isSubmitting: boolean
  error: string | null
}

// =============================================================================
// WIZARD ACTIONS
// =============================================================================

export type WizardAction =
  | { type: 'SET_MONTH_YEAR'; month: number; year: number }
  | { type: 'SET_INCOME_ITEMS'; items: WizardIncomeItem[] }
  | { type: 'ADD_INCOME_ITEM'; item: WizardIncomeItem }
  | { type: 'UPDATE_INCOME_ITEM'; id: string; updates: Partial<WizardIncomeItem> }
  | { type: 'REMOVE_INCOME_ITEM'; id: string }
  | { type: 'SET_EXPENSE_ITEMS'; items: WizardExpenseItem[] }
  | { type: 'ADD_EXPENSE_ITEM'; item: WizardExpenseItem }
  | { type: 'UPDATE_EXPENSE_ITEM'; id: string; updates: Partial<WizardExpenseItem> }
  | { type: 'REMOVE_EXPENSE_ITEM'; id: string }
  | { type: 'SET_SAVINGS_ITEMS'; items: WizardSavingsItem[] }
  | { type: 'ADD_SAVINGS_ITEM'; item: WizardSavingsItem }
  | { type: 'UPDATE_SAVINGS_ITEM'; id: string; updates: Partial<WizardSavingsItem> }
  | { type: 'REMOVE_SAVINGS_ITEM'; id: string }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; step: number }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' }

export const STEP_TITLES = [
  'Select Month',
  'Income',
  'Expenses',
  'Savings',
  'Review',
] as const

export const TOTAL_STEPS = 5

// =============================================================================
// HELPER: Convert wizard items to API requests
// =============================================================================

export function toIncomeRequest(item: WizardIncomeItem): CreateBudgetIncomeRequest {
  return {
    name: item.name,
    amount: item.amount,
    bankAccountId: item.bankAccountId,
  }
}

export function toExpenseRequest(item: WizardExpenseItem): CreateBudgetExpenseRequest {
  return {
    name: item.name,
    amount: item.amount,
    bankAccountId: item.bankAccountId,
    isManual: item.isManual,
    recurringExpenseId: item.recurringExpenseId,
    deductedAt: item.deductedAt,
  }
}

export function toSavingsRequest(item: WizardSavingsItem): CreateBudgetSavingsRequest {
  return {
    name: item.name,
    amount: item.amount,
    bankAccountId: item.bankAccountId,
  }
}

// =============================================================================
// HELPER: Create empty items for new rows
// =============================================================================

export function createEmptyIncomeItem(): WizardIncomeItem {
  return {
    id: crypto.randomUUID(),
    name: '',
    amount: 0,
    bankAccountId: '',
    bankAccountName: '',
  }
}

export function createEmptyExpenseItem(): WizardExpenseItem {
  return {
    id: crypto.randomUUID(),
    name: '',
    amount: 0,
    bankAccountId: '',
    bankAccountName: '',
    isManual: false,
    recurringExpenseId: undefined,
    deductedAt: undefined,
  }
}

export function createEmptySavingsItem(): WizardSavingsItem {
  return {
    id: crypto.randomUUID(),
    name: '',
    amount: 0,
    bankAccountId: '',
    bankAccountName: '',
  }
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export function isIncomeItemValid(item: WizardIncomeItem): boolean {
  return (
    item.name.trim().length > 0 &&
    item.amount > 0 &&
    item.bankAccountId.length > 0
  )
}

export function isExpenseItemValid(item: WizardExpenseItem): boolean {
  return (
    item.name.trim().length > 0 &&
    item.amount > 0 &&
    item.bankAccountId.length > 0
  )
}

export function isSavingsItemValid(item: WizardSavingsItem): boolean {
  return (
    item.name.trim().length > 0 &&
    item.amount > 0 &&
    item.bankAccountId.length > 0
  )
}
```

**Create `src/components/wizard/wizardReducer.ts`:**

```typescript
import type { WizardState, WizardAction } from './types'
import { TOTAL_STEPS } from './types'

export const initialWizardState: WizardState = {
  currentStep: 1,
  month: null,
  year: null,
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
```

**Create `src/components/wizard/WizardContext.tsx`:**

```typescript
import { createContext, useContext, useReducer, type ReactNode } from 'react'
import { wizardReducer, initialWizardState } from './wizardReducer'
import type { WizardState, WizardAction } from './types'

interface WizardContextValue {
  state: WizardState
  dispatch: React.Dispatch<WizardAction>
}

const WizardContext = createContext<WizardContextValue | null>(null)

interface WizardProviderProps {
  children: ReactNode
}

export function WizardProvider({ children }: WizardProviderProps) {
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState)

  return (
    <WizardContext.Provider value={{ state, dispatch }}>
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
```

**Create `src/components/wizard/StepIndicator.tsx`:**

```typescript
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { STEP_TITLES, TOTAL_STEPS } from './types'

interface StepIndicatorProps {
  currentStep: number
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      {/* Mobile: Just show current step */}
      <div className="md:hidden text-center">
        <span className="text-sm text-gray-500">
          Step {currentStep} of {TOTAL_STEPS}
        </span>
        <h2 className="text-lg font-semibold text-gray-900">
          {STEP_TITLES[currentStep - 1]}
        </h2>
      </div>

      {/* Desktop: Full step indicator */}
      <div className="hidden md:flex items-center justify-center">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => (
          <div key={step} className="flex items-center">
            {/* Step circle */}
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm transition-colors',
                step < currentStep && 'bg-green-600 text-white',
                step === currentStep && 'bg-blue-600 text-white',
                step > currentStep && 'bg-gray-200 text-gray-500'
              )}
            >
              {step < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                step
              )}
            </div>

            {/* Step label */}
            <span
              className={cn(
                'ml-2 text-sm font-medium',
                step === currentStep ? 'text-gray-900' : 'text-gray-500'
              )}
            >
              {STEP_TITLES[step - 1]}
            </span>

            {/* Connector line */}
            {step < TOTAL_STEPS && (
              <div
                className={cn(
                  'w-12 h-0.5 mx-4',
                  step < currentStep ? 'bg-green-600' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Create `src/components/wizard/WizardNavigation.tsx`:**

```typescript
import { Button } from '@/components/ui/button'
import { TOTAL_STEPS } from './types'

interface WizardNavigationProps {
  currentStep: number
  canProceed: boolean
  isSubmitting?: boolean
  onBack: () => void
  onNext: () => void
  onSave?: () => void
}

export function WizardNavigation({
  currentStep,
  canProceed,
  isSubmitting = false,
  onBack,
  onNext,
  onSave,
}: WizardNavigationProps) {
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === TOTAL_STEPS

  return (
    <div className="flex justify-between pt-6 border-t border-gray-200 mt-6">
      <div>
        {!isFirstStep && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Back
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        {isLastStep ? (
          <Button
            type="button"
            onClick={onSave}
            disabled={!canProceed || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Budget'}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNext}
            disabled={!canProceed}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  )
}
```

**Create `src/components/wizard/WizardShell.tsx`:**

```typescript
import { useEffect } from 'react'
import { useNavigate, useBlocker } from 'react-router-dom'
import { useWizard } from './WizardContext'
import { StepIndicator } from './StepIndicator'
import { WizardNavigation } from './WizardNavigation'
import { ConfirmDialog } from '@/components/shared'
import { useState } from 'react'

// Step components will be imported here
import { StepMonthYear } from './steps/StepMonthYear'
import { StepIncome } from './steps/StepIncome'
import { StepExpenses } from './steps/StepExpenses'
import { StepSavings } from './steps/StepSavings'
import { StepReview } from './steps/StepReview'

export function WizardShell() {
  const navigate = useNavigate()
  const { state, dispatch } = useWizard()
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  // Block navigation when dirty
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      state.isDirty &&
      !state.isSubmitting &&
      currentLocation.pathname !== nextLocation.pathname
  )

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowExitDialog(true)
      setPendingNavigation(blocker.location.pathname)
    }
  }, [blocker.state])

  const handleBack = () => {
    dispatch({ type: 'PREV_STEP' })
  }

  const handleNext = () => {
    dispatch({ type: 'NEXT_STEP' })
  }

  const handleConfirmExit = () => {
    setShowExitDialog(false)
    if (pendingNavigation && blocker.proceed) {
      blocker.proceed()
    }
  }

  const handleCancelExit = () => {
    setShowExitDialog(false)
    setPendingNavigation(null)
    if (blocker.reset) {
      blocker.reset()
    }
  }

  // Step validation
  const isStepValid = (): boolean => {
    switch (state.currentStep) {
      case 1:
        return state.month !== null && state.year !== null
      case 2:
        return state.incomeItems.length > 0 &&
          state.incomeItems.every((item) => item.source && item.amount > 0)
      case 3:
        return state.expenseItems.every((item) => item.name && item.amount > 0)
      case 4:
        return state.savingsItems.every((item) => item.targetAccountId && item.amount > 0)
      case 5:
        return true // Review step is always valid if we got here
      default:
        return false
    }
  }

  // Render current step
  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return <StepMonthYear />
      case 2:
        return <StepIncome />
      case 3:
        return <StepExpenses />
      case 4:
        return <StepSavings />
      case 5:
        return <StepReview />
      default:
        return null
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <StepIndicator currentStep={state.currentStep} />

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {renderStep()}

        <WizardNavigation
          currentStep={state.currentStep}
          canProceed={isStepValid()}
          isSubmitting={state.isSubmitting}
          onBack={handleBack}
          onNext={handleNext}
        />
      </div>

      <ConfirmDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        title="Discard changes?"
        description="You have unsaved changes. Are you sure you want to leave? Your budget will not be saved."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        variant="destructive"
        onConfirm={handleConfirmExit}
      />
    </div>
  )
}
```

**Update `src/pages/BudgetWizardPage.tsx`:**

```typescript
import { PageHeader } from '@/components/shared'
import { WizardProvider, WizardShell } from '@/components/wizard'

export function BudgetWizardPage() {
  return (
    <div>
      <PageHeader
        title="Create Budget"
        description="Create a new monthly budget"
      />

      <WizardProvider>
        <WizardShell />
      </WizardProvider>
    </div>
  )
}
```

### Test File: `src/components/wizard/wizardReducer.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { wizardReducer, initialWizardState } from './wizardReducer'
import type { WizardState, IncomeItem, ExpenseItem, SavingsItem } from './types'

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
      const item: IncomeItem = { id: '1', source: 'Salary', amount: 50000 }
      const state = wizardReducer(initialWizardState, {
        type: 'ADD_INCOME_ITEM',
        item,
      })

      expect(state.incomeItems).toHaveLength(1)
      expect(state.incomeItems[0]).toEqual(item)
    })

    it('updates income item', () => {
      const startState: WizardState = {
        ...initialWizardState,
        incomeItems: [{ id: '1', source: 'Salary', amount: 50000 }],
      }

      const state = wizardReducer(startState, {
        type: 'UPDATE_INCOME_ITEM',
        id: '1',
        updates: { amount: 55000 },
      })

      expect(state.incomeItems[0].amount).toBe(55000)
      expect(state.incomeItems[0].source).toBe('Salary')
    })

    it('removes income item', () => {
      const startState: WizardState = {
        ...initialWizardState,
        incomeItems: [
          { id: '1', source: 'Salary', amount: 50000 },
          { id: '2', source: 'Bonus', amount: 5000 },
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
      const items: IncomeItem[] = [
        { id: '1', source: 'Salary', amount: 50000 },
        { id: '2', source: 'Bonus', amount: 5000 },
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
      const item: ExpenseItem = { id: '1', name: 'Rent', amount: 8000 }
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
        expenseItems: [{ id: '1', name: 'Rent', amount: 8000 }],
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
        expenseItems: [{ id: '1', name: 'Rent', amount: 8000 }],
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
      const item: SavingsItem = {
        id: '1',
        targetAccountId: 'acc-1',
        targetAccountName: 'Savings',
        amount: 5000,
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
          targetAccountId: 'acc-1',
          targetAccountName: 'Savings',
          amount: 5000,
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
          targetAccountId: 'acc-1',
          targetAccountName: 'Savings',
          amount: 5000,
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
  })

  describe('reset', () => {
    it('resets to initial state', () => {
      const dirtyState: WizardState = {
        ...initialWizardState,
        currentStep: 3,
        month: 5,
        year: 2025,
        incomeItems: [{ id: '1', source: 'Test', amount: 100 }],
        isDirty: true,
      }

      const state = wizardReducer(dirtyState, { type: 'RESET' })
      expect(state).toEqual(initialWizardState)
    })
  })
})
```

### Test File: `src/components/wizard/StepIndicator.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { StepIndicator } from './StepIndicator'

describe('StepIndicator', () => {
  it('shows current step number on mobile', () => {
    render(<StepIndicator currentStep={2} />)
    
    expect(screen.getByText(/step 2 of 5/i)).toBeInTheDocument()
  })

  it('shows current step title', () => {
    render(<StepIndicator currentStep={2} />)
    
    expect(screen.getByText('Income')).toBeInTheDocument()
  })

  it('highlights current step', () => {
    const { container } = render(<StepIndicator currentStep={3} />)
    
    // The current step should have blue background
    const currentStepCircle = container.querySelector('.bg-blue-600')
    expect(currentStepCircle).toBeInTheDocument()
    expect(currentStepCircle).toHaveTextContent('3')
  })

  it('shows checkmark for completed steps', () => {
    render(<StepIndicator currentStep={3} />)
    
    // Steps 1 and 2 should be completed
    const checkmarks = document.querySelectorAll('.bg-green-600')
    expect(checkmarks).toHaveLength(2)
  })
})
```

### Test File: `src/components/wizard/WizardNavigation.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { WizardNavigation } from './WizardNavigation'

describe('WizardNavigation', () => {
  const defaultProps = {
    currentStep: 2,
    canProceed: true,
    onBack: vi.fn(),
    onNext: vi.fn(),
  }

  it('shows Back button when not on first step', () => {
    render(<WizardNavigation {...defaultProps} currentStep={2} />)
    
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
  })

  it('hides Back button on first step', () => {
    render(<WizardNavigation {...defaultProps} currentStep={1} />)
    
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument()
  })

  it('shows Next button when not on last step', () => {
    render(<WizardNavigation {...defaultProps} currentStep={2} />)
    
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })

  it('shows Save button on last step', () => {
    render(<WizardNavigation {...defaultProps} currentStep={5} onSave={vi.fn()} />)
    
    expect(screen.getByRole('button', { name: /save budget/i })).toBeInTheDocument()
  })

  it('disables Next when canProceed is false', () => {
    render(<WizardNavigation {...defaultProps} canProceed={false} />)
    
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('calls onBack when Back clicked', async () => {
    const onBack = vi.fn()
    render(<WizardNavigation {...defaultProps} onBack={onBack} />)
    
    await userEvent.click(screen.getByRole('button', { name: /back/i }))
    
    expect(onBack).toHaveBeenCalled()
  })

  it('calls onNext when Next clicked', async () => {
    const onNext = vi.fn()
    render(<WizardNavigation {...defaultProps} onNext={onNext} />)
    
    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    
    expect(onNext).toHaveBeenCalled()
  })

  it('shows loading state when submitting', () => {
    render(
      <WizardNavigation
        {...defaultProps}
        currentStep={5}
        isSubmitting={true}
        onSave={vi.fn()}
      />
    )
    
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
  })
})
```

### Definition of Done

- [ ] All tests pass
- [ ] Reducer handles all actions correctly
- [ ] Step indicator shows progress
- [ ] Navigation works correctly
- [ ] Abandonment dialog appears when leaving with unsaved data

---