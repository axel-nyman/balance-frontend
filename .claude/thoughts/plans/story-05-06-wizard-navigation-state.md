# Story 5.6: Step 5 — Review

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