# Extract Animation Timing Constants Implementation Plan

## Overview

Extract hardcoded animation timing values that are duplicated between CSS and JavaScript into a shared constants module. This prevents timing desync issues and makes animation adjustments easier.

## Current State Analysis

Animation timing values are hardcoded in multiple places:

**CSS** (`src/index.css:179-253`):
```css
animation: collapse-row 250ms ease-out 250ms forwards
animation: fade-in-subtle 250ms ease-out forwards
animation: pop-check 200ms cubic-bezier(0.34, 1.56, 0.64, 1)
```

**JavaScript** (in step components and future `useCopyAnimation` hook):
```typescript
setTimeout(() => { /* collapse start */ }, 250)
setTimeout(() => { /* entrance end */ }, 250 + 250)  // 500ms
setTimeout(() => { /* cleanup */ }, 700)  // 200 + 250 + 250
```

### Key Discoveries:
- The timing values must stay synchronized: if CSS changes, JS must also change
- Current values: pop-check (200ms), fade-in-subtle (250ms), collapse-row (250ms duration + 250ms delay)
- Total animation sequence: 700ms (200 + 250 + 250)

## Desired End State

A single source of truth for animation timing that:
- Is consumed by JavaScript through a constants module
- Documents the timing values for CSS maintenance
- Makes it clear these values are coupled

### Verification:
- All animations still work with correct timing
- `npm run build` and `npm run typecheck` pass

## What We're NOT Doing

- Converting CSS timing to CSS custom properties (would require significant CSS refactoring)
- Changing any animation timing values
- Modifying the animations themselves

## Implementation Approach

Create a constants file that serves as documentation and single source of truth for JavaScript. Add comments to CSS referencing this file.

---

## Phase 1: Create Animation Constants Module

### Overview
Create a constants file with well-documented timing values.

### Changes Required:

#### 1. Create Constants File
**File**: `src/components/wizard/constants/animations.ts`

```typescript
/**
 * Animation Timing Constants
 *
 * These values must stay synchronized with the CSS animations in src/index.css.
 * If you change any values here, update the corresponding CSS as well.
 *
 * Animation sequence for quick-add copy:
 * 1. User clicks item → pop-check animation starts (200ms)
 * 2. After COLLAPSE_DELAY (250ms) → item collapses, new item added
 * 3. New item appears with fade-in-subtle (250ms)
 * 4. After TOTAL_ANIMATION_DURATION (700ms) → cleanup copying state
 */

/** Duration of the pop-check animation (scale bounce for check icon) */
export const POP_CHECK_DURATION = 200

/** Duration of the collapse-row animation */
export const COLLAPSE_DURATION = 250

/** Delay before collapse-row animation starts (pause after check icon) */
export const COLLAPSE_DELAY = 250

/** Duration of the fade-in-subtle entrance animation */
export const ENTRANCE_DURATION = 250

/**
 * Delay before executing the copy action.
 * This is when the collapse animation starts.
 */
export const COPY_ACTION_DELAY = COLLAPSE_DELAY

/**
 * Delay before clearing the entrance animation class.
 * Copy action + entrance animation duration.
 */
export const ENTRANCE_CLEANUP_DELAY = COLLAPSE_DELAY + ENTRANCE_DURATION

/**
 * Total animation duration for the full copy sequence.
 * pop-check + pause + collapse
 */
export const TOTAL_ANIMATION_DURATION = POP_CHECK_DURATION + COLLAPSE_DELAY + COLLAPSE_DURATION

/**
 * Stagger delay between items when adding multiple items (e.g., "Add All Due").
 */
export const CASCADE_STAGGER_DELAY = 100
```

#### 2. Create Index Export
**File**: `src/components/wizard/constants/index.ts`

```typescript
export * from './animations'
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run typecheck`
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [x] Constants file exists and exports correctly

---

## Phase 2: Update useCopyAnimation Hook

### Overview
Update the hook to use the constants instead of hardcoded values.

### Changes Required:

#### 1. Update useCopyAnimation Hook
**File**: `src/components/wizard/hooks/useCopyAnimation.ts`

**Add import:**
```typescript
import {
  COPY_ACTION_DELAY,
  ENTRANCE_CLEANUP_DELAY,
  TOTAL_ANIMATION_DURATION,
} from '../constants'
```

**Replace hardcoded values:**
```typescript
// Before:
setTimeout(() => { ... }, 250)
setTimeout(() => { ... }, 500)
setTimeout(() => { ... }, 700)

// After:
setTimeout(() => { ... }, COPY_ACTION_DELAY)
setTimeout(() => { ... }, ENTRANCE_CLEANUP_DELAY)
setTimeout(() => { ... }, TOTAL_ANIMATION_DURATION)
```

**Remove the inline constant comments** that document the values (the constants file now serves this purpose).

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run typecheck`
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [x] Quick-add animation still works correctly in all steps

**Implementation Note**: This phase depends on the `useCopyAnimation` hook existing. If implementing this plan before the "Extract Copy Animation Hook" plan, update the step components directly instead.

---

## Phase 3: Update StepExpenses handleAddAllDue

### Overview
Update the cascade animation to use the stagger constant.

### Changes Required:

#### 1. Update StepExpenses
**File**: `src/components/wizard/steps/StepExpenses.tsx`

**Add import:**
```typescript
import { CASCADE_STAGGER_DELAY, TOTAL_ANIMATION_DURATION } from '../constants'
```

**Update handleAddAllDue:**
```typescript
// Before:
itemsToAdd.forEach((item, index) => {
  setTimeout(() => {
    handleAddRecurring(item)
  }, index * 100)
})

const totalTime = (itemsToAdd.length - 1) * 100 + 700

// After:
itemsToAdd.forEach((item, index) => {
  setTimeout(() => {
    handleAddRecurring(item)
  }, index * CASCADE_STAGGER_DELAY)
})

const totalTime = (itemsToAdd.length - 1) * CASCADE_STAGGER_DELAY + TOTAL_ANIMATION_DURATION
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run typecheck`
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [x] "Add All Due" cascade animation works correctly

---

## Phase 4: Add CSS Documentation Comments

### Overview
Add comments to the CSS animations referencing the constants file.

### Changes Required:

#### 1. Update CSS Comments
**File**: `src/index.css`

Add a comment block near the animation definitions (around line 179):

```css
/*
 * Animation Timing - IMPORTANT
 *
 * These timing values are synchronized with JavaScript constants in:
 * src/components/wizard/constants/animations.ts
 *
 * If you change any animation duration or delay here,
 * you MUST update the corresponding constants.
 *
 * Current values:
 * - pop-check: 200ms
 * - fade-in-subtle: 250ms
 * - collapse-row: 250ms duration, 250ms delay
 */
```

### Success Criteria:

#### Automated Verification:
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [x] Comment is visible in the CSS file
- [x] All animations still work correctly

---

## Testing Strategy

### Manual Testing Steps:
1. Start dev server: `npm run dev`
2. Navigate to Budget Wizard Step 3 (Expenses)
3. Add a single recurring expense, verify animation timing feels the same
4. Click "Add All Due" with multiple items, verify cascade timing
5. Test Steps 2 and 4 for quick-add animations

## Performance Considerations

None - constants are inlined at build time.

## Migration Notes

No migration needed - this is a pure refactoring.

## Future Improvements

If animation timing needs to be changed frequently, consider:
1. Using CSS custom properties for timing values
2. Having JavaScript read timing from CSS computed styles
3. Generating CSS from the constants at build time

These are out of scope for this plan but documented for future consideration.

## References

- Original research: `.claude/thoughts/research/2026-02-02-visual-redesign-branch-review.md`
- Animation CSS: `src/index.css:179-253`
- Related plan: `2026-02-02-extract-copy-animation-hook.md`
