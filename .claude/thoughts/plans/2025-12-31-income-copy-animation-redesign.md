# Income Copy Animation Redesign - Implementation Plan

## Overview

Redesign the "copy from last budget" animation in the income step to create a more satisfying, cohesive experience. The current animation has timing conflicts and lacks visual polish. The new "Satisfying Pop" animation will emphasize the moment of completion before smoothly transitioning.

## Current State Analysis

### Current Animation Issues
1. **Timing conflicts**: Icon (200ms), color change (200ms), and row collapse (300ms) all start simultaneously
2. **Lost visual cues**: Text goes grey→black while row is already collapsing - gets lost
3. **No entrance animation**: New item appears instantly in active section
4. **No satisfaction moment**: Checkmark appears but row is already collapsing around it

### Current Code Location
- `src/components/wizard/steps/StepIncome.tsx:95-122` - handleCopyItem function
- `src/components/wizard/steps/StepIncome.tsx:229-304` - available items rendering

## Desired End State ✅ IMPLEMENTED

### Animation Timeline
```
Time:    0ms       250ms      500ms       700ms
         │          │          │           │
Click ───┼──────────┼──────────┼───────────┼──
         │          │          │           │
         │← Icon ──→│          │           │
         │  pop +   │          │           │
         │  green   │          │           │
         │  highlight          │           │
         │          │← Collapse + new item │
         │          │  appears │           │
         │          │          │← Cleanup ─│
         │          │          │  state    │
```

### Visual Flow
1. User clicks + button on available item
2. Plus icon rapidly exits (scale down + rotate)
3. Check icon springs in with satisfying bounce overshoot
4. Row gets subtle green highlight (`bg-green-50`)
5. **Brief pause** - user sees the checkmark and green feedback (250ms)
6. Row smoothly collapses with fade
7. New item appears instantly in active section with subtle entrance fade

### Verification
- [x] Icon has satisfying spring bounce animation
- [x] There's a visible pause where checkmark is shown
- [x] Row has green highlight during the pause
- [x] Collapse starts after the pause, not immediately
- [x] New item in active section fades in smoothly
- [x] Animation feels cohesive and "thought through"
- [x] "From last budget" header collapses smoothly with last item
- [x] New item appears when source item starts collapsing (synced)

## What We're NOT Doing

- No changes to the savings step (this is income-specific for now)
- No complex physics simulations - pure CSS animations
- No external animation libraries (staying with Tailwind)

## Implementation Approach

1. Add CSS keyframes for the icon spring animation
2. Restructure the animation to use distinct phases via CSS animation-delay
3. Add green highlight state during the pause phase
4. Track newly added items for entrance animation
5. Adjust timing in handleCopyItem to coordinate with CSS

## Phase 1: Add CSS Keyframe Animations

### Overview
Add custom keyframe animations for the icon pop effect and row entrance.

### Changes Required:

#### 1. Add keyframes to global CSS
**File**: `src/index.css`

Add after the existing `@layer base` block:

```css
@layer utilities {
  @keyframes pop-check {
    0% {
      transform: scale(0) rotate(-45deg);
      opacity: 0;
    }
    50% {
      transform: scale(1.3) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: scale(1) rotate(0deg);
      opacity: 1;
    }
  }

  @keyframes fade-in-subtle {
    0% {
      opacity: 0;
      transform: translateY(-4px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

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

  .animate-pop-check {
    animation: pop-check 200ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .animate-fade-in-subtle {
    animation: fade-in-subtle 250ms ease-out forwards;
  }

  .animate-collapse-row {
    animation: collapse-row 250ms ease-out 250ms forwards;
  }
}
```

### Success Criteria:

#### Automated Verification:
- [x] Build passes: `npm run build`
- [x] Lint passes: `npm run lint` (pre-existing errors only)

#### Manual Verification:
- [ ] CSS keyframes are defined and can be used

---

## Phase 2: Track Animation Phases in Component

### Overview
Refactor the component state to track animation phases and newly added items.

### Changes Required:

#### 1. Update state management in StepIncome.tsx
**File**: `src/components/wizard/steps/StepIncome.tsx`

Replace the current `copyingIds` with a more expressive state:

```typescript
// Replace:
// const [copyingIds, setCopyingIds] = useState<Set<string>>(new Set())

// With:
const [copyingIds, setCopyingIds] = useState<Set<string>>(new Set())
const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set())
```

#### 2. Update availableItems memo to keep items visible during animation
**File**: `src/components/wizard/steps/StepIncome.tsx`

The memo is already correct - it keeps items visible while in `copyingIds`.

#### 3. Update handleCopyItem timing
**File**: `src/components/wizard/steps/StepIncome.tsx`

Replace the current handler:

```typescript
const handleCopyItem = (item: BudgetIncome) => {
  // Prevent double-clicks
  if (copyingIds.has(item.id)) return

  // Start animation phase
  setCopyingIds((prev) => new Set(prev).add(item.id))

  // Generate new ID for the item
  const newId = generateId()

  // Add to state immediately so the new row appears with entrance animation
  setNewlyAddedIds((prev) => new Set(prev).add(newId))

  dispatch({
    type: 'ADD_INCOME_ITEM',
    item: {
      id: newId,
      name: item.name,
      amount: item.amount,
      bankAccountId: item.bankAccount.id,
      bankAccountName: item.bankAccount.name,
    },
  })

  // Clear newly added state after entrance animation (250ms)
  setTimeout(() => {
    setNewlyAddedIds((prev) => {
      const next = new Set(prev)
      next.delete(newId)
      return next
    })
  }, 250)

  // Clean up copying state after collapse animation completes
  // Icon pop: 200ms + pause: 250ms + collapse: 250ms = 700ms total
  setTimeout(() => {
    setCopyingIds((prev) => {
      const next = new Set(prev)
      next.delete(item.id)
      return next
    })
  }, 700)
}
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run build`
- [x] Lint passes: `npm run lint` (pre-existing errors only)

#### Manual Verification:
- [ ] Component renders without errors
- [ ] State updates work correctly

---

## Phase 3: Update Available Row Animation

### Overview
Update the available items row to use the new phased animation with green highlight and delayed collapse.

### Changes Required:

#### 1. Restructure the available items row JSX
**File**: `src/components/wizard/steps/StepIncome.tsx`

Replace the current available items map (lines 229-304) with:

```tsx
{/* Available items from last budget */}
{availableItems.map((item) => {
  const isCopying = copyingIds.has(item.id)
  return (
    <TableRow
      key={`available-${item.id}`}
      className="contents"
    >
      <td colSpan={4} className="p-0">
        <div
          className={cn(
            'grid overflow-hidden',
            isCopying
              ? 'animate-collapse-row'
              : 'grid-rows-[1fr]'
          )}
        >
          <div className="overflow-hidden min-h-0">
            <div
              className={cn(
                'flex items-center px-4 py-3 border-b border-gray-100 transition-colors duration-150',
                isCopying && 'bg-green-50'
              )}
            >
              <div className="flex-1 min-w-0 grid grid-cols-[35%_30%_1fr_50px] items-center gap-0">
                <span className="text-gray-400">
                  {item.name}
                </span>
                <span className="text-gray-400">
                  {item.bankAccount.name}
                </span>
                <span className="text-right text-gray-400">
                  {formatCurrency(item.amount)}
                </span>
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyItem(item)}
                    disabled={isCopying}
                    aria-label="Add item"
                    className="h-8 w-8 p-0"
                  >
                    <div className="relative w-4 h-4">
                      <Plus
                        className={cn(
                          'w-4 h-4 text-gray-400 absolute inset-0 transition-all duration-100',
                          isCopying && 'opacity-0 rotate-90 scale-0'
                        )}
                      />
                      <Check
                        className={cn(
                          'w-4 h-4 text-green-600 absolute inset-0',
                          isCopying
                            ? 'animate-pop-check'
                            : 'opacity-0 scale-0'
                        )}
                      />
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    </TableRow>
  )
})}
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run build`
- [x] Lint passes: `npm run lint` (pre-existing errors only)

#### Manual Verification:
- [ ] Plus icon exits quickly on click
- [ ] Check icon springs in with bounce
- [ ] Row shows green highlight
- [ ] There's a visible pause before collapse
- [ ] Row collapses smoothly after pause

---

## Phase 4: Add Entrance Animation for New Items

### Overview
Apply entrance animation to newly added income items in the active section.

### Changes Required:

#### 1. Update active items row rendering
**File**: `src/components/wizard/steps/StepIncome.tsx`

Update the `state.incomeItems.map` section (around line 157) to include entrance animation:

```tsx
{state.incomeItems.map((item) => (
  <TableRow
    key={item.id}
    className={cn(
      newlyAddedIds.has(item.id) && 'animate-fade-in-subtle'
    )}
  >
    {/* ... rest of the row content unchanged ... */}
  </TableRow>
))}
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run build`
- [x] Lint passes: `npm run lint` (pre-existing errors only)

#### Manual Verification:
- [ ] New items fade in with subtle slide-down effect
- [ ] Animation only plays once on newly added items
- [ ] Existing items are not affected

---

## Phase 5: Fine-tune and Polish

### Overview
Adjust timing and easing for the smoothest possible experience.

### Changes Required:

#### 1. Adjust animation timing if needed
Based on manual testing, we may need to:
- Adjust the delay before collapse starts (currently 250ms)
- Adjust the total animation duration (currently 700ms)
- Tweak the spring easing curve

#### 2. Remove old unused transition classes
**File**: `src/components/wizard/steps/StepIncome.tsx`

Remove the old transition classes that are no longer needed:
- `transition-colors duration-200` on the text spans (we're not animating text color anymore)
- Old `transition-[grid-template-rows,opacity]` class

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run build`
- [x] Lint passes: `npm run lint` (pre-existing errors only)

#### Manual Verification:
- [ ] Animation feels smooth and cohesive
- [ ] No jank or stuttering
- [ ] Timing feels satisfying (not too fast, not too slow)
- [ ] Multiple quick clicks don't cause visual glitches

---

## Testing Strategy

### Manual Testing Steps:
1. Start creating a new budget with existing budgets in the system
2. Navigate to Income step
3. Click + on an available item
4. Verify: icon springs with bounce
5. Verify: green highlight appears
6. Verify: pause before collapse (~250ms)
7. Verify: row collapses smoothly
8. Verify: new item fades in at top
9. Repeat 3-8 for multiple items quickly
10. Test rapid double-click (should be prevented)

### Edge Cases:
- Last item in available section: separator should disappear after collapse
- Multiple items clicked in quick succession
- Clicking while animation is in progress (should be blocked)

## Performance Considerations

- All animations use CSS keyframes (GPU-accelerated)
- No JavaScript animation loops
- React re-renders are minimal (only state changes)
- `will-change` not needed for these simple animations

## References

- Original implementation: `.claude/thoughts/plans/2025-12-30-inline-copy-income-redesign.md`
- Animation research: User preference for "Satisfying Pop" style
- Tailwind animation patterns in codebase: `src/components/wizard/WizardShell.tsx`
