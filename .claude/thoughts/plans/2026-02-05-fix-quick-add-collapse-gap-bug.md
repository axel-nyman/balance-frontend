# Fix Quick-Add Collapse Animation Gap Bug

## Overview

Fix the visual gap/jump bug that occurs when quick-add items collapse in the budget wizard. The bug manifests as a small gap remaining after the collapse animation completes, followed by a sudden jump when the item is removed from the DOM.

## Current State Analysis

The animation system has a timing mismatch:

1. **CSS animation completes at 500ms**: The `collapse-row` animation has 250ms delay + 250ms duration
2. **React removes item at 700ms**: `TOTAL_ANIMATION_DURATION` is calculated as `200 + 250 + 250`
3. **The 200ms gap**: During this window, the DOM element exists but is visually collapsed to 0 height. The parent's `space-y-3` gap (12px) persists until the element is actually removed.

### Root Cause

The `TOTAL_ANIMATION_DURATION` calculation incorrectly adds `POP_CHECK_DURATION` (200ms) to the total. However, the pop-check animation runs **in parallel** with the collapse delay, not sequentially:

```
Timeline:
T=0ms:     Pop-check starts (200ms duration)
T=0ms:     Collapse delay starts (250ms)
T=200ms:   Pop-check completes
T=250ms:   Collapse animation starts (250ms duration)
T=500ms:   Collapse animation completes ← CSS is done
T=700ms:   React removes item ← 200ms too late
```

### Key Discoveries

- `src/components/wizard/constants/animations.ts:42` - `TOTAL_ANIMATION_DURATION = POP_CHECK_DURATION + COLLAPSE_DELAY + COLLAPSE_DURATION`
- Original design (2025-12-30) used 500ms before pop-check was added
- No documentation exists justifying the 200ms buffer

## Desired End State

When a quick-add item is clicked:
1. Check icon pops (200ms)
2. Item collapses smoothly (250ms delay + 250ms animation)
3. Item is removed from DOM immediately when collapse completes (at 500ms)
4. No visible gap or jump - sibling items flow naturally into place as the collapse animation runs

### Verification

Manual: Click a quick-add item in the income/expense/savings wizard step. The item should collapse smoothly with no gap or jump at the end.

## What We're NOT Doing

- Not switching to event-based animation handling (`onAnimationEnd`)
- Not changing the visual animation timing or appearance
- Not refactoring the CollapseWrapper component
- Not adding any new dependencies

## Implementation Approach

Single constant change - update the `TOTAL_ANIMATION_DURATION` calculation to exclude `POP_CHECK_DURATION` since it runs in parallel.

## Phase 1: Fix Animation Timing Constant

### Overview

Update the `TOTAL_ANIMATION_DURATION` constant to match when the CSS collapse animation actually completes.

### Changes Required

#### 1. Update timing constant
**File**: `src/components/wizard/constants/animations.ts`
**Changes**: Modify the `TOTAL_ANIMATION_DURATION` calculation to be `COLLAPSE_DELAY + COLLAPSE_DURATION` instead of `POP_CHECK_DURATION + COLLAPSE_DELAY + COLLAPSE_DURATION`

```typescript
/**
 * Total animation duration for the full copy sequence.
 * Collapse delay + collapse animation.
 * Note: Pop-check runs in parallel with the delay, not sequentially.
 */
export const TOTAL_ANIMATION_DURATION = COLLAPSE_DELAY + COLLAPSE_DURATION
```

#### 2. Update the documentation comment
**File**: `src/components/wizard/constants/animations.ts`
**Changes**: Update the file header comment that describes the animation sequence to clarify parallel timing.

The comment at lines 7-11 currently says:
```typescript
 * Animation sequence for quick-add copy:
 * 1. User clicks item → pop-check animation starts (200ms)
 * 2. After COLLAPSE_DELAY (250ms) → item collapses, new item added
 * 3. New item appears with fade-in-subtle (250ms)
 * 4. After TOTAL_ANIMATION_DURATION (700ms) → cleanup copying state
```

Should be updated to:
```typescript
 * Animation sequence for quick-add copy:
 * 1. User clicks item → pop-check animation starts (200ms, runs in parallel)
 * 2. After COLLAPSE_DELAY (250ms) → collapse starts, new item added
 * 3. New item appears with fade-in-subtle (250ms)
 * 4. After TOTAL_ANIMATION_DURATION (500ms) → cleanup copying state
```

### Success Criteria

#### Automated Verification:
- [x] TypeScript compiles: `npm run build`
- [x] Tests pass: `npm test` (15 pre-existing failures unrelated to this change)
- [x] Linting passes: `npm run lint`

#### Manual Verification:
- [ ] In StepIncome: Click a quick-add item. The collapse animation should complete smoothly with no gap or jump.
- [ ] In StepExpenses: Click a quick-add item. Same smooth behavior.
- [ ] In StepSavings: Click a quick-add item. Same smooth behavior.
- [ ] Click "Add All Due" button - all items should collapse with staggered timing, no gaps.
- [ ] Rapid clicking is still prevented (double-click guard still works).

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual testing to confirm the bug is fixed.

---

## Testing Strategy

### Manual Testing Steps
1. Start the dev server: `npm run dev`
2. Navigate to create new budget wizard
3. Ensure there's a previous budget with income/expense items to copy from
4. Test each step (Income, Expenses, Savings) by clicking quick-add items
5. Verify no gap/jump at the end of the collapse animation
6. Test "Add All Due" button in expenses step for cascading animations

### Edge Cases
- Single item remaining (should collapse entire section smoothly)
- Rapid clicking different items (animation should not interfere)
- Mobile vs desktop views (both use CollapseWrapper)

## References

- Research document: `.claude/thoughts/research/2026-02-05-quick-add-collapse-animation-gap-bug.md`
- Original animation design: `.claude/thoughts/plans/2025-12-31-income-copy-animation-redesign.md`
- Constants extraction: `.claude/thoughts/plans/2026-02-02-extract-animation-timing-constants.md`
