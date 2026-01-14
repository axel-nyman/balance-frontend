# Disable Continue Button When Budget Already Exists

## Overview

Fix the budget creation wizard to disable the "Continue" button on step 1 (month/year selection) when the selected month already has an existing budget. Currently, the wizard displays a warning alert but still allows the user to proceed through all steps, only to fail at the end.

## Current State Analysis

- `StepMonthYear.tsx:74` maintains a local `budgetExists` state
- `StepMonthYear.tsx:92-99` detects existing budgets via useEffect
- `StepMonthYear.tsx:163-171` shows a destructive Alert when duplicate detected
- `WizardContext.tsx:26` validates step 1 only checks `month !== null && year !== null`
- The Continue button remains enabled even when a budget already exists

### Key Discoveries:
- The duplicate detection logic already exists and works correctly (`StepMonthYear.tsx:92-99`)
- The Alert component correctly displays when `budgetExists` is true
- The issue is that `budgetExists` is local state, not visible to `isStepValid()` in the context

## Desired End State

When a user selects a month/year combination that already has a budget:
1. The warning Alert continues to display (existing behavior)
2. The "Continue" button becomes disabled
3. The user cannot proceed until they select a valid month/year

### Verification:
- Select a month/year that has an existing budget
- Confirm the warning Alert appears AND the Continue button is disabled
- Select a different month/year without an existing budget
- Confirm the warning disappears AND the Continue button is enabled

## What We're NOT Doing

- Not changing the Alert styling or messaging
- Not adding server-side validation (duplicate check happens client-side)
- Not changing the default month selection logic
- Not adding any new API calls

## Implementation Approach

Lift the `budgetExists` state from local component state into the wizard context state. This allows `isStepValid()` to access it and properly disable the Continue button.

## Phase 1: Add budgetExists to Wizard State

### Overview
Add the `budgetExists` boolean to the wizard state and create an action to update it.

### Changes Required:

#### 1. Update Types
**File**: `src/components/wizard/types.ts`
**Changes**: Add `budgetExists` to `WizardState` interface and add `SET_BUDGET_EXISTS` action type

In the `WizardState` interface (around line 42-52), add `budgetExists`:
```typescript
export interface WizardState {
  currentStep: number
  month: number | null
  year: number | null
  budgetExists: boolean  // ADD THIS LINE
  incomeItems: WizardIncomeItem[]
  expenseItems: WizardExpenseItem[]
  savingsItems: WizardSavingsItem[]
  isDirty: boolean
  isSubmitting: boolean
  error: string | null
}
```

In the `WizardAction` type union (around line 54-70), add the new action:
```typescript
| { type: 'SET_BUDGET_EXISTS'; exists: boolean }
```

#### 2. Update Reducer
**File**: `src/components/wizard/wizardReducer.ts`
**Changes**: Add `budgetExists: false` to initial state and handle the new action

In `initialWizardState`, add:
```typescript
budgetExists: false,
```

In the reducer switch statement, add case:
```typescript
case 'SET_BUDGET_EXISTS':
  return { ...state, budgetExists: action.exists }
```

#### 3. Update Step Validation
**File**: `src/components/wizard/WizardContext.tsx`
**Changes**: Update `isStepValid` for step 1 to also check `!state.budgetExists`

Change line 26 from:
```typescript
return state.month !== null && state.year !== null
```
to:
```typescript
return state.month !== null && state.year !== null && !state.budgetExists
```

#### 4. Update StepMonthYear Component
**File**: `src/components/wizard/steps/StepMonthYear.tsx`
**Changes**: Remove local `budgetExists` state and dispatch to context instead

Remove the local state declaration (line 74):
```typescript
// DELETE: const [budgetExists, setBudgetExists] = useState(false)
```

Remove the `useState` import from React if no longer needed.

Update the useEffect (lines 92-99) to dispatch instead of setting local state:
```typescript
useEffect(() => {
  if (state.month && state.year) {
    const exists = existingBudgets.some(
      (b) => b.month === state.month && b.year === state.year
    )
    dispatch({ type: 'SET_BUDGET_EXISTS', exists })
  }
}, [state.month, state.year, existingBudgets, dispatch])
```

Update the Alert conditional (line 163) to use context state:
```typescript
{state.budgetExists && (
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compilation passes: `npm run build`
- [x] Linting passes: `npm run lint`
- [x] All existing tests pass: `npm test`

#### Manual Verification:
- [x] When selecting a month/year with existing budget, the Continue button is disabled
- [x] When selecting a month/year without existing budget, the Continue button is enabled
- [x] The warning Alert still displays correctly when budget exists

**Implementation Note**: After completing this phase, pause for manual verification before proceeding.

---

## Phase 2: Add Tests

### Overview
Add tests to verify the Continue button is properly disabled when a budget exists for the selected month.

### Changes Required:

#### 1. Update StepMonthYear Tests
**File**: `src/components/wizard/steps/StepMonthYear.test.tsx`
**Changes**: Add test to verify `budgetExists` is dispatched to context

Add a test that verifies the context state is updated:
```typescript
it('dispatches SET_BUDGET_EXISTS when budget exists for selected month', async () => {
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear

  // Mock API to return a budget for next month
  server.use(
    http.get('/api/budgets', () => {
      return HttpResponse.json({
        budgets: [
          { id: '1', month: nextMonth, year: nextYear, status: 'DRAFT' }
        ]
      })
    })
  )

  renderWithWizard()

  // Warning should appear (existing test covers this)
  await waitFor(() => {
    expect(screen.getByText(/already exists/i)).toBeInTheDocument()
  })
})
```

#### 2. Add Integration Test for Disabled Button
**File**: `src/components/wizard/WizardNavigation.test.tsx` or create new integration test
**Changes**: Test that Continue button is disabled when budgetExists is true in context

This may require a more integrated test setup. Consider adding to an existing integration test file if one exists.

### Success Criteria:

#### Automated Verification:
- [x] New tests pass: `npm test`
- [x] Test coverage remains adequate

#### Manual Verification:
- [x] Tests accurately reflect the expected behavior

---

## Testing Strategy

### Unit Tests:
- Verify `isStepValid(1)` returns `false` when `budgetExists` is `true`
- Verify `SET_BUDGET_EXISTS` action correctly updates state
- Verify StepMonthYear dispatches the action when duplicate detected

### Integration Tests:
- Full wizard flow: select existing month, verify cannot proceed
- Full wizard flow: change to available month, verify can proceed

### Manual Testing Steps:
1. Start budget wizard at `/budgets/new`
2. If no budgets exist, create one for next month first
3. Return to wizard, manually select the month with existing budget
4. Verify: Warning Alert appears AND Continue button is disabled
5. Select a different month without a budget
6. Verify: Warning disappears AND Continue button is enabled
7. Complete wizard to ensure normal flow still works

## References

- StepMonthYear component: `src/components/wizard/steps/StepMonthYear.tsx`
- Wizard context: `src/components/wizard/WizardContext.tsx`
- Wizard types: `src/components/wizard/types.ts`
- Wizard reducer: `src/components/wizard/wizardReducer.ts`
- Navigation component: `src/components/wizard/WizardNavigation.tsx`
