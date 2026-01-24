import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useWizard } from './WizardContext'
import { ProgressHeader } from './ProgressHeader'
import { SectionHeader } from './SectionHeader'
import { WizardNavigation } from './WizardNavigation'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { WIZARD_STEPS, toIncomeRequest, toExpenseRequest, toSavingsRequest } from './types'
import { createBudget, addIncome, addExpense, addSavings, lockBudget } from '@/api/budgets'
import { calculateBudgetTotals, isBudgetBalanced } from '@/lib/utils'

// Step components
import { StepMonthYear } from './steps/StepMonthYear'
import { StepIncome } from './steps/StepIncome'
import { StepExpenses } from './steps/StepExpenses'
import { StepSavings } from './steps/StepSavings'
import { StepReview } from './steps/StepReview'

export function WizardShell() {
  const navigate = useNavigate()
  const { state, dispatch, isStepValid, getStepStatus, completionPercentage } = useWizard()
  const [lockAfterSave, setLockAfterSave] = useState(false)

  // Calculate if budget is balanced
  const { balance } = calculateBudgetTotals(
    state.incomeItems,
    state.expenseItems,
    state.savingsItems
  )
  const isBalanced = isBudgetBalanced(balance)

  // Reset lockAfterSave if budget becomes unbalanced
  useEffect(() => {
    if (!isBalanced && lockAfterSave) {
      setLockAfterSave(false)
    }
  }, [isBalanced, lockAfterSave])

  // Warn before leaving the page with unsaved changes (browser navigation/refresh)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.isDirty && !state.isSubmitting) {
        e.preventDefault()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [state.isDirty, state.isSubmitting])

  const handleBack = () => {
    dispatch({ type: 'PREV_STEP' })
  }

  const handleNext = () => {
    dispatch({ type: 'NEXT_STEP' })
  }

  const handleGoToStep = (step: number) => {
    // Only allow going to completed steps or current step
    if (step <= state.currentStep) {
      dispatch({ type: 'GO_TO_STEP', step })
    }
  }

  const handleSave = async () => {
    if (!state.month || !state.year) return

    dispatch({ type: 'SET_SUBMITTING', isSubmitting: true })
    dispatch({ type: 'SET_ERROR', error: null })

    try {
      // Step 1: Create the budget
      const budget = await createBudget({ month: state.month, year: state.year })
      const budgetId = budget.id

      // Step 2: Add income items
      for (const item of state.incomeItems) {
        await addIncome(budgetId, toIncomeRequest(item))
      }

      // Step 3: Add expense items
      for (const item of state.expenseItems) {
        await addExpense(budgetId, toExpenseRequest(item))
      }

      // Step 4: Add savings items
      for (const item of state.savingsItems) {
        await addSavings(budgetId, toSavingsRequest(item))
      }

      // Step 5: Lock if requested
      if (lockAfterSave) {
        await lockBudget(budgetId)
        toast.success('Budget created and locked')
      } else {
        toast.success('Budget created')
      }

      dispatch({ type: 'RESET' })
      navigate(`/budgets/${budgetId}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save budget'
      dispatch({ type: 'SET_ERROR', error: message })
      toast.error(message)
      dispatch({ type: 'SET_SUBMITTING', isSubmitting: false })
    }
  }

  const getSectionSummary = (step: number): string | undefined => {
    switch (step) {
      case 1:
        if (state.month && state.year) {
          const monthName = new Date(state.year, state.month - 1).toLocaleString('en-US', {
            month: 'long',
          })
          return `${monthName} ${state.year}`
        }
        return undefined
      case 2:
        if (state.incomeItems.length > 0) {
          return `${state.incomeItems.length} income source${state.incomeItems.length > 1 ? 's' : ''}`
        }
        return undefined
      case 3:
        if (state.expenseItems.length > 0) {
          return `${state.expenseItems.length} expense${state.expenseItems.length > 1 ? 's' : ''}`
        }
        return undefined
      case 4:
        if (state.savingsItems.length > 0) {
          return `${state.savingsItems.length} savings goal${state.savingsItems.length > 1 ? 's' : ''}`
        }
        return undefined
      default:
        return undefined
    }
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 1:
        return <StepMonthYear />
      case 2:
        return <StepIncome />
      case 3:
        return <StepExpenses />
      case 4:
        return <StepSavings />
      case 5:
        return (
          <StepReview
            lockAfterSave={lockAfterSave}
            onLockAfterSaveChange={setLockAfterSave}
            isBalanced={isBalanced}
          />
        )
      default:
        return null
    }
  }

  const currentStepData = WIZARD_STEPS.find((s) => s.id === state.currentStep)

  return (
    <div className="max-w-2xl mx-auto">
      <ProgressHeader
        percentage={completionPercentage}
        currentStepTitle={currentStepData?.title ?? ''}
      />

      {/* Sections */}
      <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
        {WIZARD_STEPS.map((step) => {
          const status = getStepStatus(step.id)
          const isExpanded = step.id === state.currentStep

          return (
            <div
              key={step.id}
              className={step.id < WIZARD_STEPS.length ? 'border-b border-border' : ''}
            >
              <SectionHeader
                title={step.title}
                description={step.description}
                status={status}
                summary={getSectionSummary(step.id)}
                isExpanded={isExpanded}
                onClick={() => handleGoToStep(step.id)}
              />

              {/* Expandable content with Radix Collapsible animation */}
              <Collapsible open={isExpanded}>
                <CollapsibleContent>
                  <div className="px-4 pb-4">
                    {renderStepContent(step.id)}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )
        })}
      </div>

      {/* Navigation */}
      <WizardNavigation
        currentStep={state.currentStep}
        canProceed={isStepValid(state.currentStep)}
        isSubmitting={state.isSubmitting}
        isBalanced={isBalanced}
        onBack={handleBack}
        onNext={handleNext}
        onSave={handleSave}
      />
    </div>
  )
}
