---
date: 2026-02-05T19:14:05Z
researcher: Claude
git_commit: 7111ddb12c726b1e023cb7d29c044cf08b0b8416
branch: feat/visual-redesign
repository: balance-frontend
topic: "Quick-add collapse animation gap bug in budget wizard"
tags: [research, animation, wizard, quick-add, collapse, css]
status: complete
last_updated: 2026-02-05
last_updated_by: Claude
---

# Research: Quick-Add Collapse Animation Gap Bug

**Date**: 2026-02-05T19:14:05Z
**Researcher**: Claude
**Git Commit**: 7111ddb12c726b1e023cb7d29c044cf08b0b8416
**Branch**: feat/visual-redesign
**Repository**: balance-frontend

## Research Question

In the budget creation wizard, there's an animation bug regarding quick-add items in both the income, expense and savings sections. When a quick-add item is added to a budget, it collapses through a nice animation. When the animation is done, there's a small gap left where the component just was for a split second, and then it disappears and all other items "jump" to their correct location. Kind of like the border/margin of the animated component is still visible, and then when the component is actually removed everything kind of "jumps".

## Summary

The root cause of this animation bug is a **timing mismatch between the CSS animation completion and React's state update that removes the item from the DOM**. The CSS `collapse-row` animation finishes at 500ms (250ms delay + 250ms duration), but React only removes the item from `copyingIds` at 700ms (`TOTAL_ANIMATION_DURATION`). This creates a 200ms window where:

1. The CSS animation has completed (element is visually at `grid-template-rows: 0fr` and `opacity: 0`)
2. But the DOM element still exists with its container spacing (margins/gaps from parent's `space-y-3` class)
3. When React finally removes the item from `copyingIds`, it disappears from the filtered list, and all sibling items shift to fill the space

## Detailed Findings

### Animation Timing Constants

The animation timing is defined in `src/components/wizard/constants/animations.ts`:

```typescript
export const POP_CHECK_DURATION = 200    // Check icon bounce
export const COLLAPSE_DURATION = 250     // CSS collapse animation
export const COLLAPSE_DELAY = 250        // Delay before collapse starts
export const TOTAL_ANIMATION_DURATION = 700  // 200 + 250 + 250
```

### CSS Animation Definition

In `src/index.css:220-241`:

```css
@keyframes collapse-row {
  0% {
    grid-template-rows: 1fr;
    opacity: 1;
  }
  100% {
    grid-template-rows: 0fr;
    opacity: 0;
  }
}

.animate-collapse-row {
  animation: collapse-row 250ms ease-out 250ms forwards;
}
```

The animation completes at **500ms** (250ms delay + 250ms duration).

### React State Management

In `src/components/wizard/hooks/useCopyAnimation.ts:76-83`:

```typescript
// Clear copying state after full animation completes
setTimeout(() => {
  setCopyingIds((prev) => {
    const next = new Set(prev)
    next.delete(sourceId)
    return next
  })
}, TOTAL_ANIMATION_DURATION)  // This is 700ms
```

The item is only removed from `copyingIds` at **700ms**.

### How Items Are Rendered

Items remain in the DOM while `copyingIds.has(item.id)` is true. For example in `StepIncome.tsx:43-52`:

```typescript
const availableItems = useMemo(() => {
  if (!lastBudget) return []
  const existingNames = new Set(
    state.incomeItems.map((i) => i.name.toLowerCase())
  )
  return lastBudget.income.filter(
    (item) =>
      !existingNames.has(item.name.toLowerCase()) || copyingIds.has(item.id)
  )
}, [lastBudget, state.incomeItems, copyingIds])
```

### The Gap Source

The gap comes from the parent container's spacing. In the mobile view (`StepIncome.tsx:363`):

```jsx
<div className="overflow-hidden min-h-0 space-y-3 pb-1">
```

The `space-y-3` class (0.75rem / 12px gap between children) is applied to the parent. Even when the child's content collapses to 0 height via the CSS grid animation, the **flexbox gap between siblings persists** until the DOM element is actually removed.

Similarly, in the expenses step (`StepExpenses.tsx:282-283`):

```jsx
<div className="space-y-3">
  {dueExpenses.map(renderQuickAddItem)}
</div>
```

### CollapseWrapper Structure

The `CollapseWrapper` component (`src/components/wizard/CollapseWrapper.tsx`) uses CSS grid collapse:

```tsx
<div className={cn(
  'grid overflow-hidden',
  isCollapsing ? 'animate-collapse-row' : 'grid-rows-[1fr]',
  className
)}>
  <div className="overflow-hidden min-h-0">
    {children}
  </div>
</div>
```

The outer div collapses via `grid-template-rows: 0fr`, but it's still a block in the document flow. The `space-y-*` gap from Tailwind applies margins between flex/grid children, and those margins remain until the element is removed.

### Desktop vs Mobile

Both views have the same issue:

**Mobile** (`StepIncome.tsx:367-385`):
- Uses `CollapseWrapper` component
- Parent has `space-y-3` class creating gaps between items

**Desktop** (`StepIncome.tsx:245-309`):
- Uses inline collapse styles (same pattern as CollapseWrapper)
- Each item is a `TableRow` with border styling
- The `border-b border-border` on line 261 may contribute to the visible gap

## Code References

- `src/components/wizard/constants/animations.ts:42` - `TOTAL_ANIMATION_DURATION = 700`
- `src/components/wizard/hooks/useCopyAnimation.ts:76-83` - setTimeout for clearing copyingIds
- `src/index.css:220-241` - CSS collapse-row animation (completes at 500ms)
- `src/components/wizard/CollapseWrapper.tsx:21-39` - CollapseWrapper component
- `src/components/wizard/steps/StepIncome.tsx:363` - Mobile container with `space-y-3`
- `src/components/wizard/steps/StepExpenses.tsx:282` - Expenses container with `space-y-3`

## Architecture Documentation

The animation system follows this pattern:

1. **User Action**: Click quick-add button
2. **Immediate State**: `copyingIds.add(sourceId)` - triggers CSS collapse animation
3. **250ms**: `COPY_ACTION_DELAY` - new item added to budget via `onCopy` callback
4. **500ms**: CSS animation completes (250ms delay + 250ms duration)
5. **700ms**: `TOTAL_ANIMATION_DURATION` - `copyingIds.delete(sourceId)` - item removed from DOM

The 200ms gap between CSS completion (500ms) and DOM removal (700ms) is the source of the visual bug.

## Historical Context (from thoughts/)

- `.claude/thoughts/plans/2026-02-04-extract-collapse-wrapper-component.md` - Recent extraction of CollapseWrapper component
- `.claude/thoughts/plans/2026-02-02-extract-copy-animation-hook.md` - useCopyAnimation hook extraction
- `.claude/thoughts/plans/2026-02-02-extract-animation-timing-constants.md` - Animation constants centralization
- `.claude/thoughts/research/2026-02-04-animation-refactoring-opportunities.md` - Animation refactoring analysis

## Related Research

- `.claude/thoughts/research/2026-02-04-animation-refactoring-opportunities.md`

## Open Questions

1. Was the 200ms buffer intentional (perhaps to ensure animation completion across all browsers)?
2. Should the timing constants be synchronized so DOM removal happens exactly when CSS animation ends?
3. Would using CSS `animation-fill-mode: forwards` combined with `animationend` event listeners be more reliable than setTimeout?
