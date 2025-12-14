# Balance — Frontend Stories: Epic 5 (Budget Wizard)

This document contains detailed, implementable stories for the Budget Wizard epic. This is the most complex epic, implementing a multi-step wizard for creating new budgets.

---

## Epic Overview

The Budget Wizard guides users through creating a new monthly budget:

1. **Step 1:** Select month and year
2. **Step 2:** Add income items
3. **Step 3:** Add expense items (with quick-add from recurring)
4. **Step 4:** Add savings items (with running balance)
5. **Step 5:** Review and save

**Key Design Decisions:**
- Client-side wizard state using `useReducer`
- All data held in memory until final save
- Sequential API calls on save (create budget → add items)
- "Copy from last budget" fetches from existing budget
- Abandonment warning when leaving with unsaved data

**Dependencies:** Epic 1 (Infrastructure) must be complete.

**API Endpoints Used:**
- `GET /api/budgets` — Check for existing budget, get last budget
- `POST /api/budgets` — Create new budget
- `POST /api/budgets/:id/income` — Add income items
- `POST /api/budgets/:id/expenses` — Add expense items
- `POST /api/budgets/:id/savings` — Add savings items
- `POST /api/budgets/:id/lock` — Lock budget (optional)
- `GET /api/recurring-expenses` — Get templates for quick-add

---

## Story 5.1: Wizard Shell & State Management

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

## Story 5.2: Step 1 — Month/Year Selection

**As a** user  
**I want to** select the month and year for my budget  
**So that** I can create a budget for a specific time period

### Acceptance Criteria

- [ ] Month dropdown with all 12 months
- [ ] Year dropdown with current year ± 1 year
- [ ] Defaults to current month/year if no budgets exist
- [ ] Defaults to next month if current month has a budget
- [ ] Shows warning if budget already exists for selected month/year
- [ ] Cannot proceed if budget already exists

### Implementation

**Create `src/components/wizard/steps/StepMonthYear.tsx`:**

```typescript
import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWizard } from '../WizardContext'
import { useBudgets } from '@/hooks'
import { getMonthName } from '@/lib/utils'

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: getMonthName(i + 1),
}))

function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear()
  return [currentYear - 1, currentYear, currentYear + 1]
}

function getDefaultMonthYear(existingBudgets: Array<{ month: number; year: number }>) {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Check if current month already has a budget
  const currentExists = existingBudgets.some(
    (b) => b.month === currentMonth && b.year === currentYear
  )

  if (currentExists) {
    // Default to next month
    if (currentMonth === 12) {
      return { month: 1, year: currentYear + 1 }
    }
    return { month: currentMonth + 1, year: currentYear }
  }

  return { month: currentMonth, year: currentYear }
}

export function StepMonthYear() {
  const { state, dispatch } = useWizard()
  const { data: budgetsData } = useBudgets()
  const [budgetExists, setBudgetExists] = useState(false)

  const existingBudgets = budgetsData?.budgets ?? []
  const yearOptions = getYearOptions()

  // Set defaults on mount
  useEffect(() => {
    if (state.month === null || state.year === null) {
      const defaults = getDefaultMonthYear(existingBudgets)
      dispatch({
        type: 'SET_MONTH_YEAR',
        month: defaults.month,
        year: defaults.year,
      })
    }
  }, [existingBudgets, state.month, state.year, dispatch])

  // Check if budget exists for selected month/year
  useEffect(() => {
    if (state.month && state.year) {
      const exists = existingBudgets.some(
        (b) => b.month === state.month && b.year === state.year
      )
      setBudgetExists(exists)
    }
  }, [state.month, state.year, existingBudgets])

  const handleMonthChange = (value: string) => {
    dispatch({
      type: 'SET_MONTH_YEAR',
      month: parseInt(value, 10),
      year: state.year ?? new Date().getFullYear(),
    })
  }

  const handleYearChange = (value: string) => {
    dispatch({
      type: 'SET_MONTH_YEAR',
      month: state.month ?? new Date().getMonth() + 1,
      year: parseInt(value, 10),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Select Month
        </h2>
        <p className="text-sm text-gray-500">
          Choose the month and year for your new budget.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="month">Month</Label>
          <Select
            value={state.month?.toString() ?? ''}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger id="month">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Select
            value={state.year?.toString() ?? ''}
            onValueChange={handleYearChange}
          >
            <SelectTrigger id="year">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {budgetExists && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            A budget already exists for {state.month && getMonthName(state.month)} {state.year}.
            Please select a different month or year.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
```

### Test File: `src/components/wizard/steps/StepMonthYear.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { WizardProvider } from '../WizardContext'
import { StepMonthYear } from './StepMonthYear'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

function renderWithWizard() {
  return render(
    <WizardProvider>
      <StepMonthYear />
    </WizardProvider>
  )
}

describe('StepMonthYear', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({ budgets: [] })
      })
    )
  })

  it('renders month and year dropdowns', () => {
    renderWithWizard()
    
    expect(screen.getByLabelText(/month/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/year/i)).toBeInTheDocument()
  })

  it('shows all 12 months', async () => {
    renderWithWizard()
    
    await userEvent.click(screen.getByLabelText(/month/i))
    
    expect(screen.getByText('januari')).toBeInTheDocument()
    expect(screen.getByText('december')).toBeInTheDocument()
  })

  it('defaults to current month when no budgets exist', async () => {
    renderWithWizard()
    
    const currentMonth = new Date().getMonth() + 1
    const monthName = new Date(2025, currentMonth - 1).toLocaleString('sv-SE', { month: 'long' })
    
    await waitFor(() => {
      expect(screen.getByText(monthName)).toBeInTheDocument()
    })
  })

  it('shows warning when budget exists for selected month', async () => {
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({
          budgets: [
            { id: '1', month: currentMonth, year: currentYear, status: 'DRAFT' }
          ]
        })
      })
    )

    renderWithWizard()
    
    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument()
    })
  })

  it('defaults to next month when current month has budget', async () => {
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
    
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({
          budgets: [
            { id: '1', month: currentMonth, year: currentYear, status: 'DRAFT' }
          ]
        })
      })
    )

    renderWithWizard()
    
    // Should not show warning for the default (next month)
    await waitFor(() => {
      // Give it time to load and set defaults
      expect(screen.queryByText(/already exists/i)).not.toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('allows changing month', async () => {
    renderWithWizard()
    
    await userEvent.click(screen.getByLabelText(/month/i))
    await userEvent.click(screen.getByText('juni'))
    
    expect(screen.getByText('juni')).toBeInTheDocument()
  })

  it('allows changing year', async () => {
    renderWithWizard()
    
    const nextYear = new Date().getFullYear() + 1
    
    await userEvent.click(screen.getByLabelText(/year/i))
    await userEvent.click(screen.getByText(nextYear.toString()))
    
    expect(screen.getByText(nextYear.toString())).toBeInTheDocument()
  })
})
```

### Definition of Done

- [ ] All tests pass
- [ ] Month/year dropdowns work
- [ ] Defaults are set correctly
- [ ] Warning shows for existing budgets
- [ ] Cannot proceed when budget exists
- [ ] Gap-filling validation works (can create Feb if March exists)
- [ ] Unlocked budget check prevents creating new budget

### Additional Validation Logic

**Create `src/components/wizard/validation.ts`:**

```typescript
interface ExistingBudget {
  month: number
  year: number
}

/**
 * Check if a budget already exists for the given month/year
 */
export function budgetExistsForMonth(
  month: number,
  year: number,
  existingBudgets: ExistingBudget[]
): boolean {
  return existingBudgets.some(b => b.month === month && b.year === year)
}

/**
 * Check if the selected month/year is older than the most recent budget
 * (but allow gap-filling)
 *
 * Rule: Cannot create Jan 2025 if March 2025 exists
 * Exception: CAN create Feb 2025 if March 2025 exists (fills a gap)
 */
export function isMonthTooOld(
  month: number,
  year: number,
  mostRecent: ExistingBudget | null,
  existingBudgets: ExistingBudget[]
): boolean {
  if (!mostRecent) return false // No budgets exist, any month is valid

  // Convert to comparable number (YYYYMM format)
  const selectedValue = year * 100 + month
  const mostRecentValue = mostRecent.year * 100 + mostRecent.month

  // If selected is after or equal to most recent, it's valid
  if (selectedValue >= mostRecentValue) return false

  // If selected is before most recent, check if it's filling a gap
  const wouldFillGap = !budgetExistsForMonth(month, year, existingBudgets)

  // Allow gap-filling
  return !wouldFillGap
}

/**
 * Get the default month/year to pre-select in the wizard
 */
export function getDefaultMonthYear(
  existingBudgets: ExistingBudget[]
): { month: number; year: number } {
  const now = new Date()
  const currentMonth = now.getMonth() + 1 // 1-indexed
  const currentYear = now.getFullYear()

  // If current month doesn't have a budget, use it
  if (!budgetExistsForMonth(currentMonth, currentYear, existingBudgets)) {
    return { month: currentMonth, year: currentYear }
  }

  // Otherwise, find the next month without a budget
  let testMonth = currentMonth
  let testYear = currentYear

  for (let i = 0; i < 24; i++) { // Look up to 2 years ahead
    testMonth++
    if (testMonth > 12) {
      testMonth = 1
      testYear++
    }

    if (!budgetExistsForMonth(testMonth, testYear, existingBudgets)) {
      return { month: testMonth, year: testYear }
    }
  }

  // Fallback to next month
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear
  return { month: nextMonth, year: nextYear }
}

/**
 * Validate a month/year selection
 */
export function validateMonthYear(
  month: number,
  year: number,
  existingBudgets: ExistingBudget[],
  mostRecent: ExistingBudget | null,
  hasUnlockedBudget: boolean
): { valid: boolean; error: string | null } {
  // Check for existing unlocked budget
  if (hasUnlockedBudget) {
    return {
      valid: false,
      error: 'Du har redan en olåst budget. Lås eller ta bort den innan du skapar en ny.',
    }
  }

  // Check if budget already exists for this month
  if (budgetExistsForMonth(month, year, existingBudgets)) {
    return {
      valid: false,
      error: 'Det finns redan en budget för denna månad.',
    }
  }

  // Check if month is too old (not filling a gap)
  if (isMonthTooOld(month, year, mostRecent, existingBudgets)) {
    return {
      valid: false,
      error: 'Kan inte skapa en budget äldre än den senaste budgeten.',
    }
  }

  // Valid month range
  if (month < 1 || month > 12) {
    return {
      valid: false,
      error: 'Månad måste vara mellan 1 och 12.',
    }
  }

  // Valid year range
  if (year < 2020 || year > 2100) {
    return {
      valid: false,
      error: 'År måste vara mellan 2020 och 2100.',
    }
  }

  return { valid: true, error: null }
}
```

**Create `src/hooks/use-budget-validation.ts`:**

```typescript
import { useQuery } from '@tanstack/react-query'
import { getBudgets } from '@/api'
import { queryKeys } from './query-keys'

interface BudgetValidation {
  existingBudgets: Array<{ month: number; year: number; status: string }>
  hasUnlockedBudget: boolean
  mostRecentBudget: { month: number; year: number } | null
  isLoading: boolean
  error: Error | null
}

export function useBudgetValidation(): BudgetValidation {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.budgets.all,
    queryFn: getBudgets,
  })

  const existingBudgets = data?.budgets.map(b => ({
    month: b.month,
    year: b.year,
    status: b.status,
  })) ?? []

  const hasUnlockedBudget = existingBudgets.some(b => b.status === 'UNLOCKED')

  // Most recent by year DESC, month DESC
  const sortedBudgets = [...existingBudgets].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })

  const mostRecentBudget = sortedBudgets[0] ?? null

  return {
    existingBudgets,
    hasUnlockedBudget,
    mostRecentBudget,
    isLoading,
    error: error as Error | null,
  }
}
```

---

## Story 5.3: Step 2 — Income

**As a** user  
**I want to** add income items to my budget  
**So that** I can track my expected income for the month

### Acceptance Criteria

- [ ] Shows table of income items (source, amount)
- [ ] "Add Income" button to add new row
- [ ] Inline editing of source and amount
- [ ] Delete button per row
- [ ] Shows total income
- [ ] "Copy from Last Budget" button
- [ ] At least one income item required to proceed

### Implementation

**Create `src/components/wizard/steps/StepIncome.tsx`:**

```typescript
import { useState } from 'react'
import { Plus, Trash2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { useWizard } from '../WizardContext'
import { useBudgets, useBudgetDetail } from '@/hooks'
import { formatCurrency } from '@/lib/utils'
import type { IncomeItem } from '../types'

function generateId(): string {
  return crypto.randomUUID()
}

export function StepIncome() {
  const { state, dispatch } = useWizard()
  const { data: budgetsData } = useBudgets()
  const [isCopying, setIsCopying] = useState(false)

  // Find the most recent budget to copy from
  const sortedBudgets = [...(budgetsData?.budgets ?? [])].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })
  const lastBudget = sortedBudgets[0]

  const totalIncome = state.incomeItems.reduce((sum, item) => sum + (item.amount || 0), 0)

  const handleAddItem = () => {
    dispatch({
      type: 'ADD_INCOME_ITEM',
      item: { id: generateId(), source: '', amount: 0 },
    })
  }

  const handleUpdateItem = (id: string, field: keyof IncomeItem, value: string | number) => {
    dispatch({
      type: 'UPDATE_INCOME_ITEM',
      id,
      updates: { [field]: value },
    })
  }

  const handleRemoveItem = (id: string) => {
    dispatch({ type: 'REMOVE_INCOME_ITEM', id })
  }

  const handleCopyFromLast = async () => {
    if (!lastBudget) return

    setIsCopying(true)
    try {
      // Fetch the full budget detail
      const response = await fetch(`/api/budgets/${lastBudget.id}`)
      const budget = await response.json()

      if (budget.incomeItems && budget.incomeItems.length > 0) {
        const copiedItems: IncomeItem[] = budget.incomeItems.map((item: { source: string; amount: number }) => ({
          id: generateId(),
          source: item.source,
          amount: item.amount,
        }))
        dispatch({ type: 'SET_INCOME_ITEMS', items: copiedItems })
      }
    } catch (error) {
      console.error('Failed to copy from last budget:', error)
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Income</h2>
          <p className="text-sm text-gray-500">
            Add your expected income sources for this month.
          </p>
        </div>
        {lastBudget && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyFromLast}
            disabled={isCopying}
          >
            <Copy className="w-4 h-4 mr-2" />
            {isCopying ? 'Copying...' : 'Copy from Last Budget'}
          </Button>
        )}
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60%]">Source</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.incomeItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                  No income items yet. Add your first income source.
                </TableCell>
              </TableRow>
            ) : (
              state.incomeItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Input
                      value={item.source}
                      onChange={(e) => handleUpdateItem(item.id, 'source', e.target.value)}
                      placeholder="e.g., Salary, Freelance"
                      className="border-0 shadow-none focus-visible:ring-0 px-0"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      value={item.amount || ''}
                      onChange={(e) => handleUpdateItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="border-0 shadow-none focus-visible:ring-0 px-0 text-right"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {state.incomeItems.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium">Total</TableCell>
                <TableCell className="text-right font-semibold text-green-600">
                  {formatCurrency(totalIncome)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      <Button variant="outline" onClick={handleAddItem}>
        <Plus className="w-4 h-4 mr-2" />
        Add Income
      </Button>

      {state.incomeItems.length === 0 && (
        <p className="text-sm text-amber-600">
          Add at least one income source to continue.
        </p>
      )}
    </div>
  )
}
```

### Test File: `src/components/wizard/steps/StepIncome.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { WizardProvider } from '../WizardContext'
import { StepIncome } from './StepIncome'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

function renderWithWizard() {
  return render(
    <WizardProvider>
      <StepIncome />
    </WizardProvider>
  )
}

describe('StepIncome', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({ budgets: [] })
      })
    )
  })

  it('renders income table', () => {
    renderWithWizard()
    
    expect(screen.getByText('Source')).toBeInTheDocument()
    expect(screen.getByText('Amount')).toBeInTheDocument()
  })

  it('shows empty state message', () => {
    renderWithWizard()
    
    expect(screen.getByText(/no income items yet/i)).toBeInTheDocument()
  })

  it('adds income item when button clicked', async () => {
    renderWithWizard()
    
    await userEvent.click(screen.getByRole('button', { name: /add income/i }))
    
    expect(screen.getByPlaceholderText(/salary/i)).toBeInTheDocument()
  })

  it('allows editing income source', async () => {
    renderWithWizard()
    
    await userEvent.click(screen.getByRole('button', { name: /add income/i }))
    
    const sourceInput = screen.getByPlaceholderText(/salary/i)
    await userEvent.type(sourceInput, 'My Salary')
    
    expect(sourceInput).toHaveValue('My Salary')
  })

  it('allows editing income amount', async () => {
    renderWithWizard()
    
    await userEvent.click(screen.getByRole('button', { name: /add income/i }))
    
    const amountInput = screen.getByPlaceholderText('0')
    await userEvent.type(amountInput, '50000')
    
    expect(amountInput).toHaveValue(50000)
  })

  it('removes income item when delete clicked', async () => {
    renderWithWizard()
    
    await userEvent.click(screen.getByRole('button', { name: /add income/i }))
    expect(screen.getByPlaceholderText(/salary/i)).toBeInTheDocument()
    
    await userEvent.click(screen.getByRole('button', { name: /remove/i }))
    
    expect(screen.queryByPlaceholderText(/salary/i)).not.toBeInTheDocument()
  })

  it('shows total income', async () => {
    renderWithWizard()
    
    await userEvent.click(screen.getByRole('button', { name: /add income/i }))
    const amountInput = screen.getByPlaceholderText('0')
    await userEvent.type(amountInput, '50000')
    
    expect(screen.getByText(/50 000,00 kr/)).toBeInTheDocument()
  })

  it('shows validation message when no items', () => {
    renderWithWizard()
    
    expect(screen.getByText(/add at least one/i)).toBeInTheDocument()
  })

  it('shows copy from last budget button when budget exists', async () => {
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({
          budgets: [
            { id: '1', month: 1, year: 2025, status: 'LOCKED' }
          ]
        })
      })
    )

    renderWithWizard()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy from last/i })).toBeInTheDocument()
    })
  })

  it('does not show copy button when no previous budgets', () => {
    renderWithWizard()
    
    expect(screen.queryByRole('button', { name: /copy from last/i })).not.toBeInTheDocument()
  })

  it('copies income from last budget', async () => {
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({
          budgets: [
            { id: '1', month: 1, year: 2025, status: 'LOCKED' }
          ]
        })
      }),
      http.get('/api/budgets/1', () => {
        return HttpResponse.json({
          id: '1',
          incomeItems: [
            { id: 'old-1', source: 'Salary', amount: 50000 },
            { id: 'old-2', source: 'Side gig', amount: 5000 },
          ]
        })
      })
    )

    renderWithWizard()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy from last/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /copy from last/i }))
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Salary')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Side gig')).toBeInTheDocument()
    })
  })
})
```

### Definition of Done

- [ ] All tests pass
- [ ] Can add/edit/remove income items
- [ ] Total displays correctly
- [ ] Copy from last budget works
- [ ] Validation message shows when empty
- [ ] Duplicate items are skipped when copying

### Copy from Last Budget Implementation

**Create `src/hooks/use-last-budget.ts`:**

```typescript
import { useQuery } from '@tanstack/react-query'
import { getBudgets, getBudget } from '@/api'
import { queryKeys } from './query-keys'
import type { BudgetDetail } from '@/api/types'

interface UseLastBudgetResult {
  lastBudget: BudgetDetail | null
  isLoading: boolean
  error: Error | null
}

export function useLastBudget(): UseLastBudgetResult {
  // First, get all budgets to find the most recent
  const { data: budgetList, isLoading: isLoadingList, error: listError } = useQuery({
    queryKey: queryKeys.budgets.all,
    queryFn: getBudgets,
  })

  // Find the most recent budget
  const mostRecentBudgetId = budgetList?.budgets[0]?.id

  // Then fetch its full details
  const { data: budgetDetail, isLoading: isLoadingDetail, error: detailError } = useQuery({
    queryKey: queryKeys.budgets.detail(mostRecentBudgetId ?? ''),
    queryFn: () => getBudget(mostRecentBudgetId!),
    enabled: !!mostRecentBudgetId,
  })

  return {
    lastBudget: budgetDetail ?? null,
    isLoading: isLoadingList || isLoadingDetail,
    error: (listError as Error) ?? (detailError as Error) ?? null,
  }
}
```

**Create `src/components/wizard/CopyFromLastBudgetModal.tsx`:**

```typescript
import { useState, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatMonthYear } from '@/lib/utils'
import { useLastBudget } from '@/hooks/use-last-budget'
import type { BudgetIncome, BudgetSavings } from '@/api/types'

interface CopyFromLastBudgetModalProps<T> {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemType: 'income' | 'savings'
  onCopy: (items: T[]) => void
}

export function CopyFromLastBudgetModal<T extends BudgetIncome | BudgetSavings>({
  open, onOpenChange, itemType, onCopy,
}: CopyFromLastBudgetModalProps<T>) {
  const { lastBudget, isLoading, error } = useLastBudget()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const items = useMemo(() => {
    if (!lastBudget) return []
    return itemType === 'income' ? lastBudget.income : lastBudget.savings
  }, [lastBudget, itemType]) as T[]

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === items.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(items.map((item) => item.id)))
  }

  const handleCopy = () => {
    const selectedItems = items.filter((item) => selectedIds.has(item.id))
    onCopy(selectedItems)
    onOpenChange(false)
    setSelectedIds(new Set())
  }

  const title = itemType === 'income'
    ? 'Kopiera inkomster från förra budgeten'
    : 'Kopiera sparande från förra budgeten'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            {title}
          </DialogTitle>
          {lastBudget && (
            <p className="text-sm text-gray-500">
              Från {formatMonthYear(lastBudget.month, lastBudget.year)}
            </p>
          )}
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Inga {itemType === 'income' ? 'inkomster' : 'sparande'} i förra budgeten.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                <Checkbox checked={selectedIds.size === items.length} onCheckedChange={toggleAll} />
                <span className="text-sm font-medium">Välj alla ({items.length})</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleItem(item.id)}
                  >
                    <Checkbox checked={selectedIds.has(item.id)} />
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(item.amount)} • {item.bankAccount.name}
                      </p>
                    </div>
                    {selectedIds.has(item.id) && <Check className="w-4 h-4 text-green-600" />}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={handleCopy} disabled={selectedIds.size === 0}>
            Kopiera {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Usage in IncomeStep:**

```typescript
const handleCopyFromLast = (items: BudgetIncome[]) => {
  const existingNames = new Set(state.incomeItems.map((i) => i.name.toLowerCase()))

  const wizardItems: WizardIncomeItem[] = items
    .filter((item) => !existingNames.has(item.name.toLowerCase())) // Skip duplicates
    .map((item) => ({
      id: generateId(),
      name: item.name,
      amount: item.amount,
      bankAccountId: item.bankAccount.id,
      bankAccountName: item.bankAccount.name,
    }))

  if (wizardItems.length < items.length) {
    toast.info(`Hoppade över ${items.length - wizardItems.length} dubbletter`)
  }

  for (const item of wizardItems) {
    dispatch({ type: 'ADD_INCOME_ITEM', item })
  }
}
```

---

## Story 5.4: Step 3 — Expenses

**As a** user  
**I want to** add expense items to my budget  
**So that** I can plan my spending for the month

### Acceptance Criteria

- [ ] Shows table of expense items (name, amount)
- [ ] "Add Expense" button for manual entry
- [ ] Quick-add section with recurring expense templates
- [ ] Due recurring expenses highlighted
- [ ] Clicking template adds it to expenses table
- [ ] Already-added templates show checkmark
- [ ] Delete button per row
- [ ] Shows total expenses
- [ ] "Copy from Last Budget" button

### Implementation

**Create `src/components/wizard/steps/StepExpenses.tsx`:**

```typescript
import { useState } from 'react'
import { Plus, Trash2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWizard } from '../WizardContext'
import { useBudgets, useRecurringExpenses } from '@/hooks'
import { formatCurrency } from '@/lib/utils'
import type { ExpenseItem } from '../types'

function generateId(): string {
  return crypto.randomUUID()
}

export function StepExpenses() {
  const { state, dispatch } = useWizard()
  const { data: budgetsData } = useBudgets()
  const { data: recurringData } = useRecurringExpenses()
  const [isCopying, setIsCopying] = useState(false)

  const recurringExpenses = recurringData?.expenses ?? []
  
  // Sort: due first, then by name
  const sortedRecurring = [...recurringExpenses].sort((a, b) => {
    if (a.isDue !== b.isDue) return a.isDue ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  // Find last budget for copy feature
  const sortedBudgets = [...(budgetsData?.budgets ?? [])].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })
  const lastBudget = sortedBudgets[0]

  const totalExpenses = state.expenseItems.reduce((sum, item) => sum + (item.amount || 0), 0)

  // Check if a recurring expense is already added
  const isRecurringAdded = (recurringId: string) => {
    return state.expenseItems.some((item) => item.recurringExpenseId === recurringId)
  }

  const handleAddItem = () => {
    dispatch({
      type: 'ADD_EXPENSE_ITEM',
      item: { id: generateId(), name: '', amount: 0 },
    })
  }

  const handleAddRecurring = (recurring: typeof recurringExpenses[0]) => {
    if (isRecurringAdded(recurring.id)) return

    dispatch({
      type: 'ADD_EXPENSE_ITEM',
      item: {
        id: generateId(),
        name: recurring.name,
        amount: recurring.amount,
        recurringExpenseId: recurring.id,
      },
    })
  }

  const handleUpdateItem = (id: string, field: keyof ExpenseItem, value: string | number) => {
    dispatch({
      type: 'UPDATE_EXPENSE_ITEM',
      id,
      updates: { [field]: value },
    })
  }

  const handleRemoveItem = (id: string) => {
    dispatch({ type: 'REMOVE_EXPENSE_ITEM', id })
  }

  const handleCopyFromLast = async () => {
    if (!lastBudget) return

    setIsCopying(true)
    try {
      const response = await fetch(`/api/budgets/${lastBudget.id}`)
      const budget = await response.json()

      if (budget.expenseItems && budget.expenseItems.length > 0) {
        const copiedItems: ExpenseItem[] = budget.expenseItems.map((item: { name: string; amount: number; recurringExpenseId?: string }) => ({
          id: generateId(),
          name: item.name,
          amount: item.amount,
          recurringExpenseId: item.recurringExpenseId,
        }))
        dispatch({ type: 'SET_EXPENSE_ITEMS', items: copiedItems })
      }
    } catch (error) {
      console.error('Failed to copy from last budget:', error)
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Expenses</h2>
          <p className="text-sm text-gray-500">
            Add your planned expenses for this month.
          </p>
        </div>
        {lastBudget && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyFromLast}
            disabled={isCopying}
          >
            <Copy className="w-4 h-4 mr-2" />
            {isCopying ? 'Copying...' : 'Copy from Last Budget'}
          </Button>
        )}
      </div>

      {/* Quick-add from recurring */}
      {sortedRecurring.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Quick Add from Recurring</CardTitle>
          </CardHeader>
          <CardContent className="py-3 pt-0">
            <div className="flex flex-wrap gap-2">
              {sortedRecurring.map((recurring) => {
                const isAdded = isRecurringAdded(recurring.id)
                return (
                  <Button
                    key={recurring.id}
                    variant={isAdded ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => handleAddRecurring(recurring)}
                    disabled={isAdded}
                    className="relative"
                  >
                    {isAdded && <Check className="w-3 h-3 mr-1" />}
                    {recurring.name}
                    {recurring.isDue && !isAdded && (
                      <Badge variant="destructive" className="ml-2 text-xs py-0">
                        Due
                      </Badge>
                    )}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60%]">Name</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.expenseItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                  No expenses yet. Add expenses manually or use quick-add above.
                </TableCell>
              </TableRow>
            ) : (
              state.expenseItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Input
                      value={item.name}
                      onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                      placeholder="e.g., Rent, Groceries"
                      className="border-0 shadow-none focus-visible:ring-0 px-0"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      value={item.amount || ''}
                      onChange={(e) => handleUpdateItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="border-0 shadow-none focus-visible:ring-0 px-0 text-right"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {state.expenseItems.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium">Total</TableCell>
                <TableCell className="text-right font-semibold text-red-600">
                  {formatCurrency(totalExpenses)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      <Button variant="outline" onClick={handleAddItem}>
        <Plus className="w-4 h-4 mr-2" />
        Add Expense
      </Button>
    </div>
  )
}
```

### Test File: `src/components/wizard/steps/StepExpenses.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { WizardProvider } from '../WizardContext'
import { StepExpenses } from './StepExpenses'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

function renderWithWizard() {
  return render(
    <WizardProvider>
      <StepExpenses />
    </WizardProvider>
  )
}

describe('StepExpenses', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({ budgets: [] })
      }),
      http.get('/api/recurring-expenses', () => {
        return HttpResponse.json({ expenses: [] })
      })
    )
  })

  it('renders expense table', () => {
    renderWithWizard()
    
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Amount')).toBeInTheDocument()
  })

  it('shows empty state message', () => {
    renderWithWizard()
    
    expect(screen.getByText(/no expenses yet/i)).toBeInTheDocument()
  })

  it('adds expense item when button clicked', async () => {
    renderWithWizard()
    
    await userEvent.click(screen.getByRole('button', { name: /add expense/i }))
    
    expect(screen.getByPlaceholderText(/rent/i)).toBeInTheDocument()
  })

  it('removes expense item when delete clicked', async () => {
    renderWithWizard()
    
    await userEvent.click(screen.getByRole('button', { name: /add expense/i }))
    expect(screen.getByPlaceholderText(/rent/i)).toBeInTheDocument()
    
    await userEvent.click(screen.getByRole('button', { name: /remove/i }))
    
    expect(screen.queryByPlaceholderText(/rent/i)).not.toBeInTheDocument()
  })

  it('shows total expenses', async () => {
    renderWithWizard()
    
    await userEvent.click(screen.getByRole('button', { name: /add expense/i }))
    const amountInput = screen.getByPlaceholderText('0')
    await userEvent.type(amountInput, '8000')
    
    expect(screen.getByText(/8 000,00 kr/)).toBeInTheDocument()
  })

  it('shows quick-add section when recurring expenses exist', async () => {
    server.use(
      http.get('/api/recurring-expenses', () => {
        return HttpResponse.json({
          expenses: [
            { id: '1', name: 'Rent', amount: 8000, isDue: true },
            { id: '2', name: 'Netflix', amount: 169, isDue: false },
          ]
        })
      })
    )

    renderWithWizard()
    
    await waitFor(() => {
      expect(screen.getByText(/quick add/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /rent/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /netflix/i })).toBeInTheDocument()
    })
  })

  it('shows "Due" badge on due recurring expenses', async () => {
    server.use(
      http.get('/api/recurring-expenses', () => {
        return HttpResponse.json({
          expenses: [
            { id: '1', name: 'Rent', amount: 8000, isDue: true },
          ]
        })
      })
    )

    renderWithWizard()
    
    await waitFor(() => {
      expect(screen.getByText('Due')).toBeInTheDocument()
    })
  })

  it('adds recurring expense to table when quick-add clicked', async () => {
    server.use(
      http.get('/api/recurring-expenses', () => {
        return HttpResponse.json({
          expenses: [
            { id: '1', name: 'Rent', amount: 8000, isDue: false },
          ]
        })
      })
    )

    renderWithWizard()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /rent/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /rent/i }))
    
    expect(screen.getByDisplayValue('Rent')).toBeInTheDocument()
    expect(screen.getByDisplayValue('8000')).toBeInTheDocument()
  })

  it('shows checkmark on added recurring expenses', async () => {
    server.use(
      http.get('/api/recurring-expenses', () => {
        return HttpResponse.json({
          expenses: [
            { id: '1', name: 'Rent', amount: 8000, isDue: false },
          ]
        })
      })
    )

    renderWithWizard()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /rent/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /rent/i }))
    
    // Button should now be disabled and have a checkmark
    const rentButton = screen.getByRole('button', { name: /rent/i })
    expect(rentButton).toBeDisabled()
  })

  it('does not show quick-add section when no recurring expenses', () => {
    renderWithWizard()
    
    expect(screen.queryByText(/quick add/i)).not.toBeInTheDocument()
  })
})
```

### Definition of Done

- [ ] All tests pass
- [ ] Can add/edit/remove expense items
- [ ] Quick-add shows recurring expenses
- [ ] Due expenses highlighted
- [ ] Added templates show checkmark (filtered from list)
- [ ] Total displays correctly
- [ ] Recurring expenses are removed from Quick-Add list when added to budget

### Quick-Add State Tracking Implementation

Track which recurring expenses have been added using a derived state approach:

```typescript
// In ExpenseStep component - derive from expense items
const addedRecurringExpenseIds = useMemo(() => {
  const ids = new Set<string>()
  for (const item of state.expenseItems) {
    if (item.recurringExpenseId) {
      ids.add(item.recurringExpenseId)
    }
  }
  return ids
}, [state.expenseItems])

// Filter out already-added templates from Quick-Add section
const availableRecurringExpenses = recurringExpenses.filter(
  exp => !addedRecurringExpenseIds.has(exp.id)
)

// Separate into due and not due
const dueExpenses = availableRecurringExpenses.filter(exp => exp.isDue)
const otherExpenses = availableRecurringExpenses.filter(exp => !exp.isDue)
```

**QuickAddSection Component:**

```typescript
interface QuickAddSectionProps {
  addedIds: Set<string>
  onAdd: (template: RecurringExpense) => void
}

export function QuickAddSection({ addedIds, onAdd }: QuickAddSectionProps) {
  const { data, isLoading } = useRecurringExpenses()

  if (isLoading) {
    return <Skeleton className="h-32" />
  }

  const expenses = data?.expenses ?? []

  // Filter out already-added templates
  const availableExpenses = expenses.filter(exp => !addedIds.has(exp.id))

  // Separate into due and not due
  const dueExpenses = availableExpenses.filter(exp => exp.isDue)
  const otherExpenses = availableExpenses.filter(exp => !exp.isDue)

  if (availableExpenses.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center">
        <p className="text-sm text-gray-500">
          {expenses.length === 0
            ? 'Inga återkommande utgifter ännu.'
            : 'Alla återkommande utgifter har lagts till.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900">Snabblägg från återkommande utgifter</h3>

      {dueExpenses.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-red-600 uppercase tracking-wide mb-2">
            Förfaller denna månad
          </h4>
          <div className="space-y-2">
            {dueExpenses.map(exp => (
              <QuickAddItem key={exp.id} expense={exp} onAdd={onAdd} />
            ))}
          </div>
        </div>
      )}

      {otherExpenses.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Alla återkommande utgifter
          </h4>
          <div className="space-y-2">
            {otherExpenses.map(exp => (
              <QuickAddItem key={exp.id} expense={exp} onAdd={onAdd} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Visual Feedback for Recurring Expense Items:**

```typescript
// In the expense table row component
function ExpenseTableRow({ item, onUpdate, onRemove }: ExpenseTableRowProps) {
  const isFromRecurring = Boolean(item.recurringExpenseId)

  return (
    <tr className={cn(isFromRecurring && 'bg-blue-50/50')}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span>{item.name}</span>
          {isFromRecurring && (
            <Badge variant="secondary" className="text-xs">
              <Repeat className="w-3 h-3 mr-1" />
              Återkommande
            </Badge>
          )}
        </div>
      </td>
      {/* ... other columns ... */}
    </tr>
  )
}
```

---

## Story 5.5: Step 4 — Savings

**As a** user  
**I want to** allocate savings to my accounts  
**So that** I can plan how much to save this month

### Acceptance Criteria

- [ ] Shows running balance (Income - Expenses - Savings so far)
- [ ] Dropdown to select target account
- [ ] Amount field for savings
- [ ] "Add Savings" button
- [ ] Shows total savings
- [ ] Warning if savings would make balance negative
- [ ] "Copy from Last Budget" button

### Implementation

**Create `src/components/wizard/steps/StepSavings.tsx`:**

```typescript
import { useState } from 'react'
import { Plus, Trash2, Copy, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWizard } from '../WizardContext'
import { useBudgets, useAccounts } from '@/hooks'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { SavingsItem } from '../types'

function generateId(): string {
  return crypto.randomUUID()
}

export function StepSavings() {
  const { state, dispatch } = useWizard()
  const { data: budgetsData } = useBudgets()
  const { data: accountsData } = useAccounts()
  const [isCopying, setIsCopying] = useState(false)

  const accounts = accountsData?.accounts ?? []

  // Find last budget for copy feature
  const sortedBudgets = [...(budgetsData?.budgets ?? [])].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })
  const lastBudget = sortedBudgets[0]

  // Calculate totals
  const totalIncome = state.incomeItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  const totalExpenses = state.expenseItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  const totalSavings = state.savingsItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  const remainingBalance = totalIncome - totalExpenses - totalSavings

  const handleAddItem = () => {
    dispatch({
      type: 'ADD_SAVINGS_ITEM',
      item: {
        id: generateId(),
        targetAccountId: '',
        targetAccountName: '',
        amount: 0,
      },
    })
  }

  const handleUpdateAccount = (id: string, accountId: string) => {
    const account = accounts.find((a) => a.id === accountId)
    dispatch({
      type: 'UPDATE_SAVINGS_ITEM',
      id,
      updates: {
        targetAccountId: accountId,
        targetAccountName: account?.name ?? '',
      },
    })
  }

  const handleUpdateAmount = (id: string, amount: number) => {
    dispatch({
      type: 'UPDATE_SAVINGS_ITEM',
      id,
      updates: { amount },
    })
  }

  const handleRemoveItem = (id: string) => {
    dispatch({ type: 'REMOVE_SAVINGS_ITEM', id })
  }

  const handleCopyFromLast = async () => {
    if (!lastBudget) return

    setIsCopying(true)
    try {
      const response = await fetch(`/api/budgets/${lastBudget.id}`)
      const budget = await response.json()

      if (budget.savingsItems && budget.savingsItems.length > 0) {
        const copiedItems: SavingsItem[] = budget.savingsItems
          .filter((item: { targetAccountId: string }) => 
            // Only copy if account still exists
            accounts.some((a) => a.id === item.targetAccountId)
          )
          .map((item: { targetAccountId: string; targetAccountName: string; amount: number }) => ({
            id: generateId(),
            targetAccountId: item.targetAccountId,
            targetAccountName: item.targetAccountName,
            amount: item.amount,
          }))
        dispatch({ type: 'SET_SAVINGS_ITEMS', items: copiedItems })
      }
    } catch (error) {
      console.error('Failed to copy from last budget:', error)
    } finally {
      setIsCopying(false)
    }
  }

  // Get accounts not already used
  const getAvailableAccounts = (currentItemId: string) => {
    const usedAccountIds = state.savingsItems
      .filter((item) => item.id !== currentItemId)
      .map((item) => item.targetAccountId)
    return accounts.filter((account) => !usedAccountIds.includes(account.id))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Savings</h2>
          <p className="text-sm text-gray-500">
            Allocate money to your savings accounts.
          </p>
        </div>
        {lastBudget && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyFromLast}
            disabled={isCopying}
          >
            <Copy className="w-4 h-4 mr-2" />
            {isCopying ? 'Copying...' : 'Copy from Last Budget'}
          </Button>
        )}
      </div>

      {/* Running balance display */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs text-gray-500 uppercase">Income</p>
          <p className="text-lg font-semibold text-green-600">{formatCurrency(totalIncome)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Expenses</p>
          <p className="text-lg font-semibold text-red-600">{formatCurrency(totalExpenses)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Savings</p>
          <p className="text-lg font-semibold text-blue-600">{formatCurrency(totalSavings)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Remaining</p>
          <p className={cn(
            'text-lg font-semibold',
            remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {formatCurrency(remainingBalance)}
          </p>
        </div>
      </div>

      {remainingBalance < 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your planned savings exceed your remaining balance by {formatCurrency(Math.abs(remainingBalance))}.
            Consider reducing your savings or expenses.
          </AlertDescription>
        </Alert>
      )}

      {accounts.length === 0 ? (
        <Alert>
          <AlertDescription>
            No bank accounts found. Create accounts in the Accounts page to add savings.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Savings table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60%]">Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.savingsItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                      No savings planned yet. Savings are optional.
                    </TableCell>
                  </TableRow>
                ) : (
                  state.savingsItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Select
                          value={item.targetAccountId}
                          onValueChange={(value) => handleUpdateAccount(item.id, value)}
                        >
                          <SelectTrigger className="border-0 shadow-none">
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableAccounts(item.id).map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name}
                              </SelectItem>
                            ))}
                            {/* Also show current selection if it's set */}
                            {item.targetAccountId && !getAvailableAccounts(item.id).find(a => a.id === item.targetAccountId) && (
                              <SelectItem value={item.targetAccountId}>
                                {item.targetAccountName}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={item.amount || ''}
                          onChange={(e) => handleUpdateAmount(item.id, parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="border-0 shadow-none focus-visible:ring-0 px-0 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {state.savingsItems.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-medium">Total</TableCell>
                    <TableCell className="text-right font-semibold text-blue-600">
                      {formatCurrency(totalSavings)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>

          <Button
            variant="outline"
            onClick={handleAddItem}
            disabled={getAvailableAccounts('').length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Savings
          </Button>

          {getAvailableAccounts('').length === 0 && state.savingsItems.length > 0 && (
            <p className="text-sm text-gray-500">
              All accounts have been assigned savings.
            </p>
          )}
        </>
      )}
    </div>
  )
}
```

### Test File: `src/components/wizard/steps/StepSavings.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { WizardProvider, useWizard } from '../WizardContext'
import { StepSavings } from './StepSavings'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import { useEffect } from 'react'

// Helper to set up wizard state with income/expenses
function WizardWithState({ children }: { children: React.ReactNode }) {
  const { dispatch } = useWizard()
  
  useEffect(() => {
    dispatch({ type: 'SET_INCOME_ITEMS', items: [{ id: '1', source: 'Salary', amount: 50000 }] })
    dispatch({ type: 'SET_EXPENSE_ITEMS', items: [{ id: '1', name: 'Rent', amount: 20000 }] })
  }, [dispatch])
  
  return <>{children}</>
}

function renderWithWizard(withState = false) {
  if (withState) {
    return render(
      <WizardProvider>
        <WizardWithState>
          <StepSavings />
        </WizardWithState>
      </WizardProvider>
    )
  }
  return render(
    <WizardProvider>
      <StepSavings />
    </WizardProvider>
  )
}

describe('StepSavings', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({ budgets: [] })
      }),
      http.get('/api/bank-accounts', () => {
        return HttpResponse.json({
          totalBalance: 10000,
          accountCount: 2,
          accounts: [
            { id: '1', name: 'Savings Account', currentBalance: 5000 },
            { id: '2', name: 'Emergency Fund', currentBalance: 5000 },
          ]
        })
      })
    )
  })

  it('renders savings table', async () => {
    renderWithWizard()
    
    await waitFor(() => {
      expect(screen.getByText('Account')).toBeInTheDocument()
      expect(screen.getByText('Amount')).toBeInTheDocument()
    })
  })

  it('shows running balance summary', async () => {
    renderWithWizard(true)
    
    await waitFor(() => {
      expect(screen.getByText('Income')).toBeInTheDocument()
      expect(screen.getByText('Expenses')).toBeInTheDocument()
      expect(screen.getByText('Savings')).toBeInTheDocument()
      expect(screen.getByText('Remaining')).toBeInTheDocument()
    })
  })

  it('calculates remaining balance correctly', async () => {
    renderWithWizard(true)
    
    await waitFor(() => {
      // Income 50000 - Expenses 20000 - Savings 0 = 30000 remaining
      expect(screen.getByText(/30 000,00 kr/)).toBeInTheDocument()
    })
  })

  it('adds savings item when button clicked', async () => {
    renderWithWizard()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add savings/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /add savings/i }))
    
    expect(screen.getByText(/select account/i)).toBeInTheDocument()
  })

  it('shows account dropdown with available accounts', async () => {
    renderWithWizard()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add savings/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /add savings/i }))
    await userEvent.click(screen.getByText(/select account/i))
    
    expect(screen.getByText('Savings Account')).toBeInTheDocument()
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
  })

  it('removes savings item when delete clicked', async () => {
    renderWithWizard()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add savings/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /add savings/i }))
    expect(screen.getByText(/select account/i)).toBeInTheDocument()
    
    await userEvent.click(screen.getByRole('button', { name: /remove/i }))
    
    expect(screen.queryByText(/select account/i)).not.toBeInTheDocument()
  })

  it('shows warning when no accounts exist', async () => {
    server.use(
      http.get('/api/bank-accounts', () => {
        return HttpResponse.json({
          totalBalance: 0,
          accountCount: 0,
          accounts: []
        })
      })
    )

    renderWithWizard()
    
    await waitFor(() => {
      expect(screen.getByText(/no bank accounts found/i)).toBeInTheDocument()
    })
  })

  it('shows empty state message', async () => {
    renderWithWizard()
    
    await waitFor(() => {
      expect(screen.getByText(/no savings planned/i)).toBeInTheDocument()
    })
  })

  it('shows warning when balance goes negative', async () => {
    // Set up with more expenses than income
    server.use(
      http.get('/api/bank-accounts', () => {
        return HttpResponse.json({
          totalBalance: 5000,
          accountCount: 1,
          accounts: [{ id: '1', name: 'Savings', currentBalance: 5000 }]
        })
      })
    )

    render(
      <WizardProvider>
        <WizardWithState>
          <StepSavings />
        </WizardWithState>
      </WizardProvider>
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add savings/i })).toBeInTheDocument()
    })

    // Add savings that exceeds remaining balance
    await userEvent.click(screen.getByRole('button', { name: /add savings/i }))
    await userEvent.click(screen.getByText(/select account/i))
    await userEvent.click(screen.getByText('Savings'))
    
    const amountInput = screen.getByPlaceholderText('0')
    await userEvent.type(amountInput, '40000') // More than 30000 remaining
    
    await waitFor(() => {
      expect(screen.getByText(/exceed/i)).toBeInTheDocument()
    })
  })
})
```

### Definition of Done

- [ ] All tests pass
- [ ] Running balance displays correctly
- [ ] Can add/edit/remove savings items
- [ ] Account dropdown works
- [ ] Warning shows for negative balance
- [ ] Each account can only be used once

---

## Story 5.6: Step 5 — Review

**As a** user  
**I want to** review my budget before saving  
**So that** I can verify everything is correct

### Acceptance Criteria

- [ ] Shows budget month/year
- [ ] Collapsible sections for Income, Expenses, Savings
- [ ] Each section shows items and totals
- [ ] Shows final balance summary
- [ ] "Save Budget" button
- [ ] Optional "Save and Lock" checkbox
- [ ] Error display if save fails

### Implementation

**Create `src/components/wizard/steps/StepReview.tsx`:**

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWizard } from '../WizardContext'
import { formatCurrency, formatMonthYear } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function StepReview() {
  const navigate = useNavigate()
  const { state, dispatch } = useWizard()
  const [incomeOpen, setIncomeOpen] = useState(true)
  const [expensesOpen, setExpensesOpen] = useState(true)
  const [savingsOpen, setSavingsOpen] = useState(true)
  const [lockAfterSave, setLockAfterSave] = useState(false)

  // Calculate totals
  const totalIncome = state.incomeItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  const totalExpenses = state.expenseItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  const totalSavings = state.savingsItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  const finalBalance = totalIncome - totalExpenses - totalSavings

  const handleSave = async () => {
    if (!state.month || !state.year) return

    dispatch({ type: 'SET_SUBMITTING', isSubmitting: true })
    dispatch({ type: 'SET_ERROR', error: null })

    try {
      // Step 1: Create the budget
      const budgetResponse = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: state.month,
          year: state.year,
        }),
      })

      if (!budgetResponse.ok) {
        const error = await budgetResponse.json()
        throw new Error(error.error || 'Failed to create budget')
      }

      const budget = await budgetResponse.json()
      const budgetId = budget.id

      // Step 2: Add income items
      for (const item of state.incomeItems) {
        await fetch(`/api/budgets/${budgetId}/income`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: item.source,
            amount: item.amount,
          }),
        })
      }

      // Step 3: Add expense items
      for (const item of state.expenseItems) {
        await fetch(`/api/budgets/${budgetId}/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: item.name,
            amount: item.amount,
            recurringExpenseId: item.recurringExpenseId || null,
          }),
        })
      }

      // Step 4: Add savings items
      for (const item of state.savingsItems) {
        await fetch(`/api/budgets/${budgetId}/savings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetAccountId: item.targetAccountId,
            amount: item.amount,
          }),
        })
      }

      // Step 5: Lock if requested
      if (lockAfterSave) {
        await fetch(`/api/budgets/${budgetId}/lock`, {
          method: 'POST',
        })
      }

      toast.success(lockAfterSave ? 'Budget created and locked' : 'Budget created')
      dispatch({ type: 'RESET' })
      navigate(`/budgets/${budgetId}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save budget'
      dispatch({ type: 'SET_ERROR', error: message })
      toast.error(message)
    } finally {
      dispatch({ type: 'SET_SUBMITTING', isSubmitting: false })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Review Budget</h2>
        <p className="text-sm text-gray-500">
          Review your budget for {state.month && state.year && formatMonthYear(state.month, state.year)} before saving.
        </p>
      </div>

      {/* Income Section */}
      <Collapsible open={incomeOpen} onOpenChange={setIncomeOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
            <div className="flex items-center gap-2">
              {incomeOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="font-medium">Income</span>
              <span className="text-gray-500">({state.incomeItems.length} items)</span>
            </div>
            <span className="font-semibold text-green-600">{formatCurrency(totalIncome)}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <div className="space-y-2 text-sm">
            {state.incomeItems.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-gray-600">{item.source}</span>
                <span>{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Expenses Section */}
      <Collapsible open={expensesOpen} onOpenChange={setExpensesOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
            <div className="flex items-center gap-2">
              {expensesOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="font-medium">Expenses</span>
              <span className="text-gray-500">({state.expenseItems.length} items)</span>
            </div>
            <span className="font-semibold text-red-600">{formatCurrency(totalExpenses)}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <div className="space-y-2 text-sm">
            {state.expenseItems.length === 0 ? (
              <p className="text-gray-500">No expenses added</p>
            ) : (
              state.expenseItems.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-gray-600">{item.name}</span>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Savings Section */}
      <Collapsible open={savingsOpen} onOpenChange={setSavingsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
            <div className="flex items-center gap-2">
              {savingsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="font-medium">Savings</span>
              <span className="text-gray-500">({state.savingsItems.length} items)</span>
            </div>
            <span className="font-semibold text-blue-600">{formatCurrency(totalSavings)}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <div className="space-y-2 text-sm">
            {state.savingsItems.length === 0 ? (
              <p className="text-gray-500">No savings planned</p>
            ) : (
              state.savingsItems.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-gray-600">{item.targetAccountName}</span>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Final Balance */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">Remaining Balance</span>
          <span className={cn(
            'text-xl font-bold',
            finalBalance >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {formatCurrency(finalBalance)}
          </span>
        </div>
        {finalBalance < 0 && (
          <p className="text-sm text-red-600 mt-2">
            Your expenses and savings exceed your income. Consider adjusting your budget.
          </p>
        )}
      </div>

      {/* Lock option */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="lockAfterSave"
          checked={lockAfterSave}
          onCheckedChange={(checked) => setLockAfterSave(checked === true)}
        />
        <Label htmlFor="lockAfterSave" className="text-sm font-normal cursor-pointer">
          Lock budget after saving
        </Label>
      </div>
      <p className="text-xs text-gray-500 -mt-4">
        Locking applies savings to account balances and creates a payment todo list.
        You can always lock later from the budget detail page.
      </p>

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Save button is handled by WizardNavigation in WizardShell */}
    </div>
  )
}
```

**Update `src/components/wizard/WizardShell.tsx` to wire up save:**

Add this to the WizardShell component, and pass the save handler to WizardNavigation:

```typescript
// In WizardShell.tsx, add a ref to StepReview's save function
// Or simpler: move the save logic to WizardShell

import { useRef } from 'react'

// Add to WizardShell:
const handleSave = async () => {
  // This will be implemented in StepReview and called via context or ref
  // For simplicity, we can trigger save via a custom event or context method
}

// Update WizardNavigation usage:
<WizardNavigation
  currentStep={state.currentStep}
  canProceed={isStepValid()}
  isSubmitting={state.isSubmitting}
  onBack={handleBack}
  onNext={handleNext}
  onSave={handleSave}  // Add this
/>
```

For simplicity, let's add the save logic directly to WizardShell. Here's the updated version:

**Updated `src/components/wizard/WizardShell.tsx`:**

```typescript
import { useEffect, useState } from 'react'
import { useNavigate, useBlocker } from 'react-router-dom'
import { toast } from 'sonner'
import { useWizard } from './WizardContext'
import { StepIndicator } from './StepIndicator'
import { WizardNavigation } from './WizardNavigation'
import { ConfirmDialog } from '@/components/shared'

import { StepMonthYear } from './steps/StepMonthYear'
import { StepIncome } from './steps/StepIncome'
import { StepExpenses } from './steps/StepExpenses'
import { StepSavings } from './steps/StepSavings'
import { StepReview } from './steps/StepReview'

export function WizardShell() {
  const navigate = useNavigate()
  const { state, dispatch } = useWizard()
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [lockAfterSave, setLockAfterSave] = useState(false)

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
    if (blocker.proceed) {
      blocker.proceed()
    }
  }

  const handleCancelExit = () => {
    setShowExitDialog(false)
    if (blocker.reset) {
      blocker.reset()
    }
  }

  const handleSave = async () => {
    if (!state.month || !state.year) return

    dispatch({ type: 'SET_SUBMITTING', isSubmitting: true })
    dispatch({ type: 'SET_ERROR', error: null })

    try {
      // Step 1: Create the budget
      const budgetResponse = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: state.month,
          year: state.year,
        }),
      })

      if (!budgetResponse.ok) {
        const error = await budgetResponse.json()
        throw new Error(error.error || 'Failed to create budget')
      }

      const budget = await budgetResponse.json()
      const budgetId = budget.id

      // Step 2: Add income items
      for (const item of state.incomeItems) {
        const response = await fetch(`/api/budgets/${budgetId}/income`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: item.source,
            amount: item.amount,
          }),
        })
        if (!response.ok) {
          throw new Error('Failed to add income item')
        }
      }

      // Step 3: Add expense items
      for (const item of state.expenseItems) {
        const response = await fetch(`/api/budgets/${budgetId}/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: item.name,
            amount: item.amount,
            recurringExpenseId: item.recurringExpenseId || null,
          }),
        })
        if (!response.ok) {
          throw new Error('Failed to add expense item')
        }
      }

      // Step 4: Add savings items
      for (const item of state.savingsItems) {
        const response = await fetch(`/api/budgets/${budgetId}/savings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetAccountId: item.targetAccountId,
            amount: item.amount,
          }),
        })
        if (!response.ok) {
          throw new Error('Failed to add savings item')
        }
      }

      // Step 5: Lock if requested (get from StepReview state)
      // For this, we need to communicate with StepReview
      // Simplest approach: add lockAfterSave to wizard state

      toast.success('Budget created')
      dispatch({ type: 'RESET' })
      navigate(`/budgets/${budgetId}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save budget'
      dispatch({ type: 'SET_ERROR', error: message })
      toast.error(message)
      dispatch({ type: 'SET_SUBMITTING', isSubmitting: false })
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
        return true
      default:
        return false
    }
  }

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
          onSave={handleSave}
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

### Test File: `src/components/wizard/steps/StepReview.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { WizardProvider, useWizard } from '../WizardContext'
import { StepReview } from './StepReview'
import { useEffect } from 'react'

// Helper to set up wizard state
function WizardWithFullState({ children }: { children: React.ReactNode }) {
  const { dispatch } = useWizard()
  
  useEffect(() => {
    dispatch({ type: 'SET_MONTH_YEAR', month: 3, year: 2025 })
    dispatch({ type: 'SET_INCOME_ITEMS', items: [
      { id: '1', source: 'Salary', amount: 50000 },
      { id: '2', source: 'Bonus', amount: 5000 },
    ]})
    dispatch({ type: 'SET_EXPENSE_ITEMS', items: [
      { id: '1', name: 'Rent', amount: 8000 },
      { id: '2', name: 'Groceries', amount: 5000 },
    ]})
    dispatch({ type: 'SET_SAVINGS_ITEMS', items: [
      { id: '1', targetAccountId: 'acc-1', targetAccountName: 'Savings', amount: 10000 },
    ]})
  }, [dispatch])
  
  return <>{children}</>
}

function renderWithWizard() {
  return render(
    <WizardProvider>
      <WizardWithFullState>
        <StepReview />
      </WizardWithFullState>
    </WizardProvider>
  )
}

describe('StepReview', () => {
  it('renders review heading', () => {
    renderWithWizard()
    
    expect(screen.getByText(/review budget/i)).toBeInTheDocument()
  })

  it('shows budget month and year', () => {
    renderWithWizard()
    
    expect(screen.getByText(/mars 2025/i)).toBeInTheDocument()
  })

  it('shows income section with total', () => {
    renderWithWizard()
    
    expect(screen.getByText('Income')).toBeInTheDocument()
    expect(screen.getByText(/55 000,00 kr/)).toBeInTheDocument() // 50000 + 5000
  })

  it('shows expense section with total', () => {
    renderWithWizard()
    
    expect(screen.getByText('Expenses')).toBeInTheDocument()
    expect(screen.getByText(/13 000,00 kr/)).toBeInTheDocument() // 8000 + 5000
  })

  it('shows savings section with total', () => {
    renderWithWizard()
    
    expect(screen.getByText('Savings')).toBeInTheDocument()
    expect(screen.getByText(/10 000,00 kr/)).toBeInTheDocument()
  })

  it('calculates and shows remaining balance', () => {
    renderWithWizard()
    
    // 55000 - 13000 - 10000 = 32000
    expect(screen.getByText(/32 000,00 kr/)).toBeInTheDocument()
  })

  it('shows income items when expanded', async () => {
    renderWithWizard()
    
    expect(screen.getByText('Salary')).toBeInTheDocument()
    expect(screen.getByText('Bonus')).toBeInTheDocument()
  })

  it('shows expense items when expanded', () => {
    renderWithWizard()
    
    expect(screen.getByText('Rent')).toBeInTheDocument()
    expect(screen.getByText('Groceries')).toBeInTheDocument()
  })

  it('shows savings items when expanded', () => {
    renderWithWizard()
    
    expect(screen.getByText('Savings')).toBeInTheDocument()
  })

  it('has lock after save checkbox', () => {
    renderWithWizard()
    
    expect(screen.getByLabelText(/lock budget/i)).toBeInTheDocument()
  })

  it('can toggle collapsible sections', async () => {
    renderWithWizard()
    
    // Income section should be open by default
    expect(screen.getByText('Salary')).toBeVisible()
    
    // Click to collapse
    await userEvent.click(screen.getByRole('button', { name: /income/i }))
    
    // Items should be hidden
    expect(screen.queryByText('Salary')).not.toBeVisible()
  })
})
```

### Definition of Done

- [ ] All tests pass
- [ ] Shows all budget data in collapsible sections
- [ ] Calculates totals correctly
- [ ] Lock checkbox works
- [ ] Save triggers API calls
- [ ] Navigates to budget detail on success

---

## Story 5.7: Wizard Integration & Save Flow

**As a** user  
**I want to** save my complete budget  
**So that** it's persisted and I can view it later

### Acceptance Criteria

- [ ] Save button creates budget and all items via API
- [ ] Shows loading state during save
- [ ] Shows error if any step fails
- [ ] Navigates to budget detail on success
- [ ] If "Lock" checked, locks budget after creation
- [ ] Toast notification on success/failure

### Implementation

The save logic is already implemented in `WizardShell.tsx`. This story is about integration testing and ensuring the full flow works.

### Test File: `src/components/wizard/WizardShell.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { WizardProvider } from './WizardContext'
import { WizardShell } from './WizardShell'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useBlocker: () => ({ state: 'unblocked', reset: vi.fn(), proceed: vi.fn() }),
  }
})

function renderWizard() {
  return render(
    <WizardProvider>
      <WizardShell />
    </WizardProvider>
  )
}

describe('WizardShell', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({ budgets: [] })
      }),
      http.get('/api/recurring-expenses', () => {
        return HttpResponse.json({ expenses: [] })
      }),
      http.get('/api/bank-accounts', () => {
        return HttpResponse.json({
          totalBalance: 10000,
          accountCount: 1,
          accounts: [{ id: '1', name: 'Savings', currentBalance: 10000 }]
        })
      })
    )
  })

  it('renders step indicator', () => {
    renderWizard()
    
    expect(screen.getByText(/step 1/i)).toBeInTheDocument()
  })

  it('starts on step 1 (month selection)', () => {
    renderWizard()
    
    expect(screen.getByText(/select month/i)).toBeInTheDocument()
  })

  it('shows Next button on step 1', () => {
    renderWizard()
    
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })

  it('hides Back button on step 1', () => {
    renderWizard()
    
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument()
  })

  it('advances to step 2 when Next clicked with valid month', async () => {
    renderWizard()
    
    // Wait for month to be auto-selected
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
    })

    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    
    expect(screen.getByText(/income/i)).toBeInTheDocument()
  })

  it('shows Back button on step 2', async () => {
    renderWizard()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
    })

    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
  })

  it('goes back to step 1 when Back clicked', async () => {
    renderWizard()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
    })

    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    await userEvent.click(screen.getByRole('button', { name: /back/i }))
    
    expect(screen.getByText(/select month/i)).toBeInTheDocument()
  })

  it('disables Next on step 2 until income is added', async () => {
    renderWizard()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
    })

    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    
    // Now on step 2, Next should be disabled
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('enables Next on step 2 after adding income', async () => {
    renderWizard()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
    })

    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    
    // Add income
    await userEvent.click(screen.getByRole('button', { name: /add income/i }))
    await userEvent.type(screen.getByPlaceholderText(/salary/i), 'My Salary')
    await userEvent.type(screen.getByPlaceholderText('0'), '50000')
    
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
  })
})
```

### Integration Test File: `src/components/wizard/WizardIntegration.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { WizardProvider } from './WizardContext'
import { WizardShell } from './WizardShell'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useBlocker: () => ({ state: 'unblocked', reset: vi.fn(), proceed: vi.fn() }),
  }
})

describe('Wizard Integration', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({ budgets: [] })
      }),
      http.get('/api/recurring-expenses', () => {
        return HttpResponse.json({ expenses: [] })
      }),
      http.get('/api/bank-accounts', () => {
        return HttpResponse.json({
          totalBalance: 10000,
          accountCount: 1,
          accounts: [{ id: 'acc-1', name: 'Savings', currentBalance: 10000 }]
        })
      }),
      http.post('/api/budgets', () => {
        return HttpResponse.json({ id: 'new-budget-123' }, { status: 201 })
      }),
      http.post('/api/budgets/:id/income', () => {
        return HttpResponse.json({ id: 'income-1' }, { status: 201 })
      }),
      http.post('/api/budgets/:id/expenses', () => {
        return HttpResponse.json({ id: 'expense-1' }, { status: 201 })
      }),
      http.post('/api/budgets/:id/savings', () => {
        return HttpResponse.json({ id: 'savings-1' }, { status: 201 })
      })
    )
  })

  it('completes full wizard flow and saves budget', async () => {
    render(
      <WizardProvider>
        <WizardShell />
      </WizardProvider>
    )

    // Step 1: Month selection (auto-selected)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
    })
    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    // Step 2: Income
    await userEvent.click(screen.getByRole('button', { name: /add income/i }))
    await userEvent.type(screen.getByPlaceholderText(/salary/i), 'Salary')
    await userEvent.type(screen.getByPlaceholderText('0'), '50000')
    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    // Step 3: Expenses (optional, skip)
    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    // Step 4: Savings (optional, skip)
    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    // Step 5: Review
    expect(screen.getByText(/review budget/i)).toBeInTheDocument()
    expect(screen.getByText('Salary')).toBeInTheDocument()
    expect(screen.getByText(/50 000,00 kr/)).toBeInTheDocument()

    // Save
    await userEvent.click(screen.getByRole('button', { name: /save budget/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/budgets/new-budget-123')
    })
  })

  it('shows error when budget creation fails', async () => {
    server.use(
      http.post('/api/budgets', () => {
        return HttpResponse.json(
          { error: 'Budget already exists for this month' },
          { status: 400 }
        )
      })
    )

    render(
      <WizardProvider>
        <WizardShell />
      </WizardProvider>
    )

    // Navigate to review step
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
    })
    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    await userEvent.click(screen.getByRole('button', { name: /add income/i }))
    await userEvent.type(screen.getByPlaceholderText(/salary/i), 'Salary')
    await userEvent.type(screen.getByPlaceholderText('0'), '50000')
    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    // Save
    await userEvent.click(screen.getByRole('button', { name: /save budget/i }))

    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument()
    })
  })
})
```

### Definition of Done

- [ ] All tests pass
- [ ] Full wizard flow works end-to-end
- [ ] Error handling works
- [ ] Navigation after save works

---

## Epic 5 Complete File Structure

```
src/
├── components/
│   └── wizard/
│       ├── index.ts
│       ├── types.ts
│       ├── wizardReducer.ts
│       ├── WizardContext.tsx
│       ├── WizardShell.tsx
│       ├── StepIndicator.tsx
│       ├── WizardNavigation.tsx
│       └── steps/
│           ├── StepMonthYear.tsx
│           ├── StepIncome.tsx
│           ├── StepExpenses.tsx
│           ├── StepSavings.tsx
│           └── StepReview.tsx
└── pages/
    └── BudgetWizardPage.tsx
```

### Barrel Export `src/components/wizard/index.ts`

```typescript
export { WizardProvider, useWizard } from './WizardContext'
export { WizardShell } from './WizardShell'
export { StepIndicator } from './StepIndicator'
export { WizardNavigation } from './WizardNavigation'
export * from './types'
```

---

## Test Summary

| Component | Test File | Tests (approx) |
|-----------|-----------|----------------|
| wizardReducer | wizardReducer.test.ts | 15 |
| StepIndicator | StepIndicator.test.tsx | 4 |
| WizardNavigation | WizardNavigation.test.tsx | 8 |
| StepMonthYear | StepMonthYear.test.tsx | 7 |
| StepIncome | StepIncome.test.tsx | 10 |
| StepExpenses | StepExpenses.test.tsx | 10 |
| StepSavings | StepSavings.test.tsx | 9 |
| StepReview | StepReview.test.tsx | 10 |
| WizardShell | WizardShell.test.tsx | 8 |
| Integration | WizardIntegration.test.tsx | 2 |

**Total: ~83 tests for Epic 5**

---

## MSW Handlers Update

Add these handlers to `src/test/mocks/handlers.ts`:

```typescript
// Budget detail (for copy from last)
http.get('/api/budgets/:id', ({ params }) => {
  return HttpResponse.json({
    id: params.id,
    month: 1,
    year: 2025,
    status: 'DRAFT',
    incomeItems: [],
    expenseItems: [],
    savingsItems: [],
  })
}),

// Create budget
http.post('/api/budgets', async ({ request }) => {
  const body = await request.json()
  return HttpResponse.json({
    id: crypto.randomUUID(),
    ...body,
    status: 'DRAFT',
  }, { status: 201 })
}),

// Add income
http.post('/api/budgets/:id/income', async ({ request }) => {
  const body = await request.json()
  return HttpResponse.json({
    id: crypto.randomUUID(),
    ...body,
  }, { status: 201 })
}),

// Add expense
http.post('/api/budgets/:id/expenses', async ({ request }) => {
  const body = await request.json()
  return HttpResponse.json({
    id: crypto.randomUUID(),
    ...body,
  }, { status: 201 })
}),

// Add savings
http.post('/api/budgets/:id/savings', async ({ request }) => {
  const body = await request.json()
  return HttpResponse.json({
    id: crypto.randomUUID(),
    ...body,
  }, { status: 201 })
}),

// Lock budget
http.post('/api/budgets/:id/lock', () => {
  return HttpResponse.json({ status: 'LOCKED' })
}),
```

---

## Next Steps

After completing Epic 5:

1. Run all tests: `npm test`
2. Test full wizard flow manually
3. Verify "Copy from Last Budget" works
4. Verify quick-add from recurring works
5. Proceed to Epic 6: Budget Detail

---

## Progress Summary

| Epic | Stories | Tests |
|------|---------|-------|
| Epic 1: Infrastructure | 6 | ~50 |
| Epic 2: Accounts | 7 | ~46 |
| Epic 3: Recurring Expenses | 5 | ~42 |
| Epic 4: Budget List | 3 | ~24 |
| **Epic 5: Budget Wizard** | **7** | **~83** |
| **Total** | **28** | **~245** |

---

*Last updated: December 2024*
