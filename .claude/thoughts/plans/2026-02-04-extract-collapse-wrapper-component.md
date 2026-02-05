# Extract CollapseWrapper Component Implementation Plan

## Overview

Extract the repeated collapse animation wrapper pattern into a reusable `CollapseWrapper` component. This pattern appears in all three wizard step components for both individual card animations and section collapse animations.

## Current State Analysis

The same collapse animation wrapper structure is duplicated across wizard step components:

**Mobile quick-add card wrappers:**
- `StepIncome.tsx:368-390` - wraps each income card
- `StepSavings.tsx:442-467` - wraps each savings card
- `StepExpenses.tsx:190-196` - wraps each expense card (in `renderQuickAddItem`)

**Desktop quick-add row wrappers:**
- `StepIncome.tsx:249-256` - wraps table row content
- `StepSavings.tsx:323-330` - wraps table row content

**"From last budget" section wrappers:**
- `StepIncome.tsx:228-237` (desktop), 356-361 (mobile)
- `StepSavings.tsx:302-311` (desktop), 432-437 (mobile)

### Key Discoveries:
- All instances use identical CSS structure: outer `grid overflow-hidden` with conditional `animate-collapse-row`
- Inner wrapper always has `overflow-hidden min-h-0`
- Only difference is optional additional classes on outer wrapper (e.g., `rounded-xl shadow-card`)
- Animation controlled by single boolean (either `isCopying` or `isLastItemsCopying`)

### Current Pattern (repeated ~8 times):
```tsx
<div
  className={cn(
    'grid overflow-hidden',
    isCollapsing ? 'animate-collapse-row' : 'grid-rows-[1fr]'
  )}
>
  <div className="overflow-hidden min-h-0">
    {children}
  </div>
</div>
```

## Desired End State

A `CollapseWrapper` component encapsulates the collapse animation pattern, reducing duplication and providing a clear API for collapse animations throughout the wizard.

### Verification:
- `CollapseWrapper` component exists at `src/components/wizard/CollapseWrapper.tsx`
- Component accepts `isCollapsing` boolean and optional `className`
- At least one step component is migrated to use the new component
- All existing animations work identically

## What We're NOT Doing

- Migrating all step components (that can be incremental follow-up)
- Extracting the "From last budget" section header (separate concern)
- Changing animation timing or behavior

## Implementation Approach

Create a simple wrapper component with minimal props, then migrate one step component as proof of concept. Other components can be migrated incrementally.

## Phase 1: Create CollapseWrapper Component

### Overview
Create the reusable CollapseWrapper component with a clean API.

### Changes Required:

#### 1. Create CollapseWrapper Component
**File**: `src/components/wizard/CollapseWrapper.tsx` (new file)

```tsx
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface CollapseWrapperProps {
  /** Whether the content should be collapsing/collapsed */
  isCollapsing: boolean
  /** Additional classes for the outer wrapper (e.g., 'rounded-xl shadow-card') */
  className?: string
  /** Content to wrap with collapse animation */
  children: ReactNode
}

/**
 * Wraps content with a CSS Grid-based collapse animation.
 * When isCollapsing is true, animates from full height to zero with fade-out.
 *
 * Animation timing is defined in src/index.css (animate-collapse-row):
 * - 250ms delay before collapse starts
 * - 250ms collapse duration
 */
export function CollapseWrapper({
  isCollapsing,
  className,
  children,
}: CollapseWrapperProps) {
  return (
    <div
      className={cn(
        'grid overflow-hidden',
        isCollapsing ? 'animate-collapse-row' : 'grid-rows-[1fr]',
        className
      )}
    >
      <div className="overflow-hidden min-h-0">
        {children}
      </div>
    </div>
  )
}
```

### Success Criteria:

#### Automated Verification:
- [x] No linting errors: `npm run lint`
- [x] Type checking passes: `npm run typecheck`
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [x] Component file exists at expected path
- [x] Component exports correctly

---

## Phase 2: Migrate StepExpenses Quick-Add Cards

### Overview
Migrate the `renderQuickAddItem` function in StepExpenses to use CollapseWrapper as proof of concept.

### Changes Required:

#### 1. Update StepExpenses renderQuickAddItem
**File**: `src/components/wizard/steps/StepExpenses.tsx`
**Lines**: 186-212

```tsx
// Before:
const renderQuickAddItem = (recurring: RecurringExpense) => {
  const isCopying = copyingIds.has(recurring.id)

  return (
    <div
      key={recurring.id}
      className={cn(
        'grid overflow-hidden rounded-xl shadow-card',
        isCopying ? 'animate-collapse-row' : 'grid-rows-[1fr]'
      )}
    >
      <div className="overflow-hidden min-h-0">
        <WizardItemCard
          variant="quick-add"
          // ... props
        />
      </div>
    </div>
  )
}

// After:
import { CollapseWrapper } from '../CollapseWrapper'

const renderQuickAddItem = (recurring: RecurringExpense) => {
  const isCopying = copyingIds.has(recurring.id)

  return (
    <CollapseWrapper
      key={recurring.id}
      isCollapsing={isCopying}
      className="rounded-xl shadow-card"
    >
      <WizardItemCard
        variant="quick-add"
        // ... props
      />
    </CollapseWrapper>
  )
}
```

### Success Criteria:

#### Automated Verification:
- [x] No linting errors: `npm run lint`
- [x] Type checking passes: `npm run typecheck`
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [x] Navigate to Expenses step in wizard
- [x] Click "Add" on a recurring expense quick-add item
- [x] Verify check animation plays, then item collapses smoothly
- [x] Animation timing and appearance identical to before

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation that the animation works correctly before proceeding.

---

## Phase 3: Migrate Remaining Quick-Add Cards (Optional)

### Overview
Apply the same pattern to StepIncome and StepSavings mobile quick-add cards.

### Changes Required:

#### 1. Update StepIncome Mobile Cards
**File**: `src/components/wizard/steps/StepIncome.tsx`
**Lines**: 368-390

```tsx
// Before (inside availableItems.map):
<div
  key={`available-mobile-${item.id}`}
  className={cn(
    'grid overflow-hidden rounded-xl shadow-card',
    isCopying ? 'animate-collapse-row' : 'grid-rows-[1fr]'
  )}
>
  <div className="overflow-hidden min-h-0">
    <WizardItemCard ... />
  </div>
</div>

// After:
<CollapseWrapper
  key={`available-mobile-${item.id}`}
  isCollapsing={isCopying}
  className="rounded-xl shadow-card"
>
  <WizardItemCard ... />
</CollapseWrapper>
```

#### 2. Update StepSavings Mobile Cards
**File**: `src/components/wizard/steps/StepSavings.tsx`
**Lines**: 442-467

Same transformation as StepIncome.

### Success Criteria:

#### Automated Verification:
- [x] No linting errors: `npm run lint`
- [x] Type checking passes: `npm run typecheck`
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [x] Test Income step mobile quick-add animation
- [x] Test Savings step mobile quick-add animation
- [x] Both animations work identically to before

---

## Testing Strategy

### Automated Tests:
- No new tests required (no behavior changes)
- Existing tests should pass

### Manual Testing Steps:
1. Open budget wizard on mobile viewport
2. Navigate to Income step, add quick-add item - verify collapse animation
3. Navigate to Expenses step, add quick-add item - verify collapse animation
4. Navigate to Savings step, add quick-add item - verify collapse animation
5. All animations should have same timing and visual appearance

## Performance Considerations

None - this is a pure refactoring with no runtime changes. The same CSS classes and DOM structure are used.

## References

- Research document: `.claude/thoughts/research/2026-02-04-visual-redesign-branch-quality-review.md`
- Animation keyframes: `src/index.css:220-241`
- Animation constants: `src/components/wizard/constants/animations.ts`
