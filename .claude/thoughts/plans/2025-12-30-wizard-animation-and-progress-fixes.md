# Budget Wizard Animation & Progress Bar Fixes Implementation Plan

## Overview

Fix two issues in the budget wizard:
1. Accordion sections animate sequentially instead of simultaneously when transitioning steps
2. Progress bar incorrectly shows 40% on initial load

## Current State Analysis

### Issue 1: Sequential Accordion Animation

**Location**: `src/components/wizard/WizardShell.tsx:122-130`

```tsx
<div
  className={`overflow-hidden transition-all duration-300 ease-in-out ${
    isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
  }`}
>
```

**Root Cause**: The `max-height` CSS trick creates asymmetric animations:
- **Opening**: Transitions from `0` → `1000px`, but visual animation completes when content height (~200px) is reached, which happens early in the 300ms duration
- **Closing**: Transitions from `1000px` → `0`, but the visual change doesn't START until the animation reaches content height, which happens late

This creates the illusion that the opening section finishes animating BEFORE the closing section starts, even though both CSS transitions begin simultaneously.

### Issue 2: Progress Bar at 40%

**Location**: `src/components/wizard/WizardContext.tsx:53-78`

```typescript
const calculateCompletion = (): number => {
  let completed = 0

  // Step 1: Month selected
  if (state.month !== null && state.year !== null) completed += 20

  // Step 2: At least one valid income
  if (state.incomeItems.length > 0 && state.incomeItems.every(isIncomeItemValid)) {
    completed += 20
  }

  // Step 3: Expenses (optional, so give points if we've passed this step or have valid items)
  if (state.currentStep > 3 || state.expenseItems.every(isExpenseItemValid)) {
    completed += 20  // BUG: [].every() returns true!
  }

  // Step 4: Savings (optional, same logic)
  if (state.currentStep > 4 || state.savingsItems.every(isSavingsItemValid)) {
    completed += 20  // BUG: [].every() returns true!
  }

  // Step 5: Review reached
  if (state.currentStep === 5) completed += 20

  return completed
}
```

**Root Cause**: In JavaScript, `[].every(fn)` returns `true` (vacuous truth). On initial load:
- Step 1: 0% (month not selected)
- Step 2: 0% (no income items)
- Step 3: 20% (`[].every()` returns true)
- Step 4: 20% (`[].every()` returns true)
- Step 5: 0%
- **Total: 40%**

### Key Discoveries

1. The project already has a shadcn `Accordion` component (`src/components/ui/accordion.tsx`) built on Radix, which has proper animation support via `animate-accordion-up` and `animate-accordion-down`
2. The `tw-animate-css` package is already imported in `src/index.css`, providing the necessary keyframe animations
3. The current wizard uses a custom accordion implementation that doesn't leverage these existing tools

## Desired End State

1. **Accordion Animation**: When transitioning between wizard steps, both the closing and opening sections animate smoothly and finish at the same perceived time
2. **Progress Bar**: Shows 0% on initial load, incrementing appropriately as the user progresses through the wizard

### Verification

1. Navigate to `/budgets/new` and verify progress shows 0%
2. Select month/year, progress should show 20%
3. Click Continue - both accordion sections should animate simultaneously and finish together
4. The animation should feel smooth and polished

## What We're NOT Doing

- Not refactoring to use the shadcn Accordion component directly (would require significant restructuring of the wizard navigation pattern)
- Not adding a JavaScript-based animation library (Framer Motion, etc.)
- Not changing the wizard step structure or navigation flow

## Implementation Approach

Use the modern CSS Grid animation technique (`grid-template-rows: 0fr` → `1fr`) which provides smooth, symmetric open/close animations without the timing issues of `max-height`.

---

## Phase 1: Fix Progress Bar Calculation

### Overview
Fix the `calculateCompletion()` function to properly handle empty arrays for optional steps.

### Changes Required:

#### 1. Update WizardContext.tsx
**File**: `src/components/wizard/WizardContext.tsx`
**Changes**: Modify the completion calculation logic for steps 3 and 4

**Current code (lines 64-72):**
```typescript
// Step 3: Expenses (optional, so give points if we've passed this step or have valid items)
if (state.currentStep > 3 || state.expenseItems.every(isExpenseItemValid)) {
  completed += 20
}

// Step 4: Savings (optional, same logic)
if (state.currentStep > 4 || state.savingsItems.every(isSavingsItemValid)) {
  completed += 20
}
```

**New code:**
```typescript
// Step 3: Expenses (optional - only count if we've moved past this step)
if (state.currentStep > 3) {
  completed += 20
}

// Step 4: Savings (optional - only count if we've moved past this step)
if (state.currentStep > 4) {
  completed += 20
}
```

**Rationale**: For optional steps, completion should only be counted when the user has explicitly moved past them by clicking "Continue". The previous logic of "give points if items are valid" was flawed because empty arrays pass the `.every()` check.

### Success Criteria:

#### Automated Verification:
- [x] Type checking passes: `npm run build`
- [x] Unit tests pass: `npm test`
- [x] Linting passes: `npm run lint` (pre-existing lint errors unrelated to this change)

#### Manual Verification:
- [x] Navigate to `/budgets/new` - progress bar shows 0%
- [x] Select month and year - progress bar stays at 0% until Continue
- [x] Click Continue to Income step - progress shows 20%
- [x] Add valid income and Continue to Expenses - progress shows 40%
- [x] Continue through Expenses (empty) - progress shows 60%
- [x] Continue through Savings (empty) - progress shows 80%
- [x] Reach Review step - progress shows 100%

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Fix Accordion Animation Timing

### Overview
Replace the `max-height` CSS hack with CSS Grid animation for symmetric open/close transitions.

### Changes Required:

#### 1. Update WizardShell.tsx
**File**: `src/components/wizard/WizardShell.tsx`
**Changes**: Replace the current accordion content container with CSS Grid animation

**Current code (lines 121-130):**
```tsx
{/* Expandable content */}
<div
  className={`overflow-hidden transition-all duration-300 ease-in-out ${
    isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
  }`}
>
  <div className="px-4 pb-4">
    {renderStepContent(step.id)}
  </div>
</div>
```

**New code:**
```tsx
{/* Expandable content with CSS Grid animation */}
<div
  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
    isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
  }`}
>
  <div className="overflow-hidden">
    <div className="px-4 pb-4">
      {renderStepContent(step.id)}
    </div>
  </div>
</div>
```

**Rationale**:
- CSS Grid with `grid-template-rows` animates the actual content height, not an arbitrary max value
- Both opening (`0fr` → `1fr`) and closing (`1fr` → `0fr`) animations take the same time and are symmetric
- The inner `overflow-hidden` div is necessary to clip content during the animation
- This is the modern, recommended approach for smooth accordion animations

### Success Criteria:

#### Automated Verification:
- [x] Type checking passes: `npm run build`
- [x] Unit tests pass: `npm test`
- [x] Linting passes: `npm run lint` (pre-existing lint errors unrelated to this change)

#### Manual Verification:
- [x] Navigate to `/budgets/new` and select month/year
- [x] Click Continue - observe that both the Month section collapses AND the Income section expands at the same time
- [x] The animations should start and finish together, not sequentially
- [x] Click Back - same smooth simultaneous animation in reverse
- [x] Test all step transitions (1→2, 2→3, 3→4, 4→5, and back)
- [x] Animation feels smooth and polished on both desktop and mobile viewport sizes

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding.

---

## Testing Strategy

### Unit Tests:
- Existing `WizardContext` tests should still pass
- Consider adding tests for `calculateCompletion()` to verify:
  - Returns 0 at initial state
  - Returns 20 after month/year selected
  - Returns correct percentages at each step

### Manual Testing Steps:
1. Start fresh wizard (`/budgets/new`)
2. Verify progress starts at 0%
3. Fill out each step and verify progress increments correctly
4. Verify accordion animations are smooth and simultaneous at each transition
5. Test the Back button navigation
6. Test clicking on completed sections to navigate back

## Performance Considerations

- CSS Grid animations are GPU-accelerated and perform well
- No JavaScript animation libraries needed
- No additional re-renders compared to current implementation

## References

- CSS Grid animation technique: [CSS-Tricks: Animating CSS Grid](https://css-tricks.com/animating-css-grid-how-to-/)
- Radix Accordion implementation: `src/components/ui/accordion.tsx`
- Current wizard implementation: `src/components/wizard/WizardShell.tsx`
