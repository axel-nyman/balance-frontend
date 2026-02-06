---
date: 2026-02-05T20:30:00Z
author: Claude
git_commit: 7111ddb12c726b1e023cb7d29c044cf08b0b8416
branch: feat/visual-redesign
repository: balance-frontend
topic: "Animate margin during quick-add collapse for smooth transitions"
tags: [plan, animation, wizard, quick-add, collapse, css, margin]
status: draft
last_updated: 2026-02-05
last_updated_by: Claude
---

# Animate Margin During Quick-Add Collapse

## Overview

After fixing the timing discrepancy in the quick-add collapse animation, a visible "jump" still occurs in some contexts. The root cause is that the 12px gap between items (from parent's `space-y-3` class) is not animated - it disappears instantly when the element is removed from the DOM. This plan adds margin animation to create a completely smooth transition.

## Current State Analysis

The collapse animation uses CSS Grid to animate `grid-template-rows: 1fr → 0fr`, but the spacing between items comes from the parent container's `space-y-3` class, which applies `margin-top: 0.75rem` to each CollapseWrapper element. This margin is **outside the animation scope** - it remains at full height even after the content collapses to 0, causing a visible gap until React removes the element from the DOM.

### Key Discoveries:

- `src/index.css:220-229` - `collapse-row` animation only animates `grid-template-rows` and `opacity`
- `src/components/wizard/CollapseWrapper.tsx:26-37` - CollapseWrapper has no margin, relies on parent spacing
- `src/components/wizard/steps/StepIncome.tsx:363` - Parent uses `space-y-3` for item spacing
- `src/components/wizard/steps/StepExpenses.tsx:282` - Same pattern with `space-y-3`
- `src/components/wizard/steps/StepSavings.tsx:439` - Same pattern with `space-y-3`

## Desired End State

When a quick-add item collapses:
1. The content height animates smoothly from full height to 0
2. The spacing between items **also animates** smoothly to 0
3. No visible "jump" or gap when the item is removed from the DOM
4. The transition is completely smooth with no jarring movements

### Verification:
- Test all three wizard steps (Income, Expenses, Savings) on mobile view
- Click quick-add buttons and observe the collapse animation
- The collapsing item should shrink to nothing with no remaining gap
- Sibling items should slide up smoothly, not jump

## What We're NOT Doing

- Changing the animation timing constants (already fixed in prior work)
- Modifying the pop-check animation or other unrelated animations
- Changing the desktop table view animations (separate pattern)
- Refactoring the useCopyAnimation hook

## Implementation Approach

The solution is to:
1. Move spacing responsibility from parent (`space-y-3`) to each CollapseWrapper
2. Add a `withSpacing` prop to CollapseWrapper that applies `mt-3` to items
3. Create a new CSS animation variant that animates both `grid-template-rows` AND `margin-top`
4. Update parent containers to use `flex flex-col` without automatic spacing

This ensures the margin animates to 0 alongside the content height.

---

## Phase 1: Update CSS Animation

### Overview
Create a new CSS animation that animates both the grid rows and margin-top simultaneously.

### Changes Required:

#### 1. Add margin-collapsing animation variant
**File**: `src/index.css`
**Changes**: Add a new animation that includes margin-top in the collapse

After the existing `collapse-row` keyframe (around line 229), add:

```css
@keyframes collapse-row-with-spacing {
  0% {
    grid-template-rows: 1fr;
    opacity: 1;
    margin-top: 0.75rem; /* 12px = space-y-3 */
  }
  100% {
    grid-template-rows: 0fr;
    opacity: 0;
    margin-top: 0;
  }
}

.animate-collapse-row-with-spacing {
  animation: collapse-row-with-spacing 250ms ease-out 250ms forwards;
}
```

### Success Criteria:

#### Automated Verification:
- [x] Build passes: `npm run build`
- [x] Type checking passes: `npm run typecheck`

#### Manual Verification:
- [ ] CSS file contains the new animation
- [ ] No syntax errors in the CSS

---

## Phase 2: Update CollapseWrapper Component

### Overview
Add a `withSpacing` prop to CollapseWrapper that controls whether the component should have top margin and use the margin-collapsing animation variant.

### Changes Required:

#### 1. Update CollapseWrapper props and logic
**File**: `src/components/wizard/CollapseWrapper.tsx`
**Changes**: Add `withSpacing` prop, conditionally apply margin and animation variant

```tsx
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface CollapseWrapperProps {
  /** Whether the content should be collapsing/collapsed */
  isCollapsing: boolean
  /** Whether this item should have top spacing (true for all items except first) */
  withSpacing?: boolean
  /** Additional classes for the outer wrapper (e.g., 'rounded-xl shadow-card') */
  className?: string
  /** Content to wrap with collapse animation */
  children: ReactNode
}

/**
 * Wraps content with a CSS Grid-based collapse animation.
 * When isCollapsing is true, animates from full height to zero with fade-out.
 *
 * Animation timing is defined in src/index.css:
 * - 250ms delay before collapse starts
 * - 250ms collapse duration
 *
 * When withSpacing is true:
 * - Applies mt-3 margin for spacing between items
 * - Uses collapse-row-with-spacing animation that also animates margin to 0
 */
export function CollapseWrapper({
  isCollapsing,
  withSpacing = false,
  className,
  children,
}: CollapseWrapperProps) {
  // Determine which animation class to use
  const animationClass = isCollapsing
    ? withSpacing
      ? 'animate-collapse-row-with-spacing'
      : 'animate-collapse-row'
    : 'grid-rows-[1fr]'

  return (
    <div
      className={cn(
        'grid overflow-hidden',
        animationClass,
        // Apply margin only when not collapsing (animation handles the margin when collapsing)
        withSpacing && !isCollapsing && 'mt-3',
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
- [x] Build passes: `npm run build`
- [x] Type checking passes: `npm run typecheck`

#### Manual Verification:
- [ ] Component accepts new `withSpacing` prop
- [ ] Backwards compatible (existing usage without `withSpacing` works the same)

---

## Phase 3: Update StepIncome Mobile Quick-Add Section

### Overview
Update the Income step's mobile quick-add section to use the new spacing approach.

### Changes Required:

#### 1. Update parent container and CollapseWrapper usage
**File**: `src/components/wizard/steps/StepIncome.tsx`
**Changes**:
- Change parent container from `space-y-3` to `flex flex-col`
- Pass `withSpacing` to CollapseWrapper for all items

Find the mobile quick-add section (around line 363):

**Before:**
```tsx
<div className="overflow-hidden min-h-0 space-y-3 pb-1">
  <div className="py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
    From last budget
  </div>
  {availableItems.map((item) => {
    const isCopying = copyingIds.has(item.id)
    return (
      <CollapseWrapper
        key={`available-mobile-${item.id}`}
        isCollapsing={isCopying}
        className="rounded-xl shadow-card"
      >
```

**After:**
```tsx
<div className="overflow-hidden min-h-0 flex flex-col pb-1">
  <div className="py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
    From last budget
  </div>
  {availableItems.map((item) => {
    const isCopying = copyingIds.has(item.id)
    return (
      <CollapseWrapper
        key={`available-mobile-${item.id}`}
        isCollapsing={isCopying}
        withSpacing
        className="rounded-xl shadow-card"
      >
```

Note: All CollapseWrapper items get `withSpacing` because they all need spacing from the header/previous item.

### Success Criteria:

#### Automated Verification:
- [x] Build passes: `npm run build`
- [x] Type checking passes: `npm run typecheck`

#### Manual Verification:
- [ ] Income step mobile view shows correct spacing (12px gaps between items)
- [ ] Collapsing an item animates smoothly with no gap/jump
- [ ] Visual appearance matches before (same spacing amounts)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: Update StepExpenses Mobile Quick-Add Section

### Overview
Update the Expenses step's mobile quick-add section. This has a more complex structure with "Due this month" and "Other recurring" subsections.

### Changes Required:

#### 1. Update renderQuickAddItem function
**File**: `src/components/wizard/steps/StepExpenses.tsx`
**Changes**: Add `withSpacing` parameter

Find renderQuickAddItem (around line 187):

**Before:**
```tsx
const renderQuickAddItem = (recurring: RecurringExpense) => {
  const isCopying = copyingIds.has(recurring.id)

  return (
    <CollapseWrapper
      key={recurring.id}
      isCollapsing={isCopying}
      className="rounded-xl shadow-card"
    >
```

**After:**
```tsx
const renderQuickAddItem = (recurring: RecurringExpense, withSpacing = true) => {
  const isCopying = copyingIds.has(recurring.id)

  return (
    <CollapseWrapper
      key={recurring.id}
      isCollapsing={isCopying}
      withSpacing={withSpacing}
      className="rounded-xl shadow-card"
    >
```

#### 2. Update containers and function calls
**File**: `src/components/wizard/steps/StepExpenses.tsx`
**Changes**:
- Change the "Due this month" items container from `space-y-3` to `flex flex-col`
- Change the "Other recurring" items container from `space-y-3` to `flex flex-col`
- Update function calls to pass `withSpacing` based on index

Find the due expenses section (around line 282):

**Before:**
```tsx
<div className="space-y-3">
  {dueExpenses.map(renderQuickAddItem)}
</div>
```

**After:**
```tsx
<div className="flex flex-col">
  {dueExpenses.map((item, index) => renderQuickAddItem(item, index > 0))}
</div>
```

Find the other expenses section (around line 292):

**Before:**
```tsx
<div className="space-y-3">
  {otherExpenses.map(renderQuickAddItem)}
</div>
```

**After:**
```tsx
<div className="flex flex-col">
  {otherExpenses.map((item, index) => renderQuickAddItem(item, index > 0))}
</div>
```

Note: First item in each subsection gets `withSpacing={false}` because the header's `mb-2` provides spacing. Subsequent items get `withSpacing={true}`.

### Success Criteria:

#### Automated Verification:
- [x] Build passes: `npm run build`
- [x] Type checking passes: `npm run typecheck`

#### Manual Verification:
- [ ] Expenses step mobile view shows correct spacing
- [ ] "Due this month" section items collapse smoothly
- [ ] "Other recurring" section items collapse smoothly
- [ ] No gap/jump when items collapse

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 5: Update StepSavings Mobile Quick-Add Section

### Overview
Update the Savings step's mobile quick-add section. This follows the same pattern as Income.

### Changes Required:

#### 1. Update parent container and CollapseWrapper usage
**File**: `src/components/wizard/steps/StepSavings.tsx`
**Changes**:
- Change parent container from `space-y-3` to `flex flex-col`
- Pass `withSpacing` to CollapseWrapper

Find the mobile quick-add section (around line 439):

**Before:**
```tsx
<div className="overflow-hidden min-h-0 space-y-3 pb-1">
  <div className="py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
    From last budget
  </div>
  {validAvailableItems.map((item) => {
    const isCopying = copyingIds.has(item.id)
    return (
      <CollapseWrapper
        key={`available-mobile-${item.id}`}
        isCollapsing={isCopying}
        className="rounded-xl shadow-card"
      >
```

**After:**
```tsx
<div className="overflow-hidden min-h-0 flex flex-col pb-1">
  <div className="py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
    From last budget
  </div>
  {validAvailableItems.map((item) => {
    const isCopying = copyingIds.has(item.id)
    return (
      <CollapseWrapper
        key={`available-mobile-${item.id}`}
        isCollapsing={isCopying}
        withSpacing
        className="rounded-xl shadow-card"
      >
```

### Success Criteria:

#### Automated Verification:
- [x] Build passes: `npm run build`
- [x] Type checking passes: `npm run typecheck`

#### Manual Verification:
- [ ] Savings step mobile view shows correct spacing
- [ ] Collapsing an item animates smoothly with no gap/jump
- [ ] Visual appearance matches before (same spacing amounts)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 6: Final Testing and Polish

### Overview
Comprehensive testing across all steps and cleanup if needed.

### Testing Steps:

1. **Income Step**: Navigate to Income step, add several items via quick-add, observe collapse animations
2. **Expenses Step**: Navigate to Expenses step, test both "Due this month" and "Other recurring" subsections
3. **Savings Step**: Navigate to Savings step, add items via quick-add
4. **Edge Cases**:
   - Add the last remaining item (entire section should collapse smoothly)
   - Add multiple items rapidly
   - Test on different screen sizes

### Success Criteria:

#### Manual Verification:
- [ ] All three steps have smooth collapse animations
- [ ] No visible gap or jump when items collapse
- [ ] Sibling items slide up smoothly
- [ ] Section collapse (when last item is added) is also smooth
- [ ] Visual appearance matches original design (12px gaps preserved)
- [ ] No regressions in desktop table view (unchanged)

---

## Testing Strategy

### Manual Testing Steps:
1. Start the dev server: `npm run dev`
2. Navigate to budget creation wizard
3. For each step (Income, Expenses, Savings):
   - Observe the quick-add items from last budget
   - Click a quick-add button
   - Watch the collapse animation carefully
   - Verify no gap/jump at the end of animation
   - Verify sibling items slide up smoothly
4. Test adding the last item in a section (section should collapse entirely)
5. Test "Add All Due" button in Expenses step

## Performance Considerations

- The new animation is equivalent in complexity to the existing one (same properties being animated)
- No additional JavaScript is needed
- CSS animations are GPU-accelerated

## References

- Research document: `.claude/thoughts/research/2026-02-05-quick-add-collapse-animation-gap-bug.md`
- Previous timing fix plan: `.claude/thoughts/plans/2026-02-05-fix-quick-add-collapse-gap-bug.md`
- CollapseWrapper extraction plan: `.claude/thoughts/plans/2026-02-04-extract-collapse-wrapper-component.md`
- Animation timing constants: `src/components/wizard/constants/animations.ts`
