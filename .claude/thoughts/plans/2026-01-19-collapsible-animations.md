# Collapsible Section Animations Implementation Plan

## Overview

Add smooth, Apple-like animations to expandable sections in the Budget Detail page and Budget Creation Wizard (Review step). Also fix the glitchy animation in WizardShell step sections by using native Radix animations.

## Current State Analysis

**Budget Detail Page** (`BudgetSection.tsx`):
- Uses Radix `Collapsible` component with no animations
- Swaps between `ChevronDown` and `ChevronRight` icons (no rotation animation)
- Content appears/disappears instantly

**Wizard Review Step** (`StepReview.tsx`):
- Uses Radix `Collapsible` component with no animations
- Same chevron icon swap pattern
- Content appears/disappears instantly

**WizardShell Step Sections** (`WizardShell.tsx:192-203`):
- Uses CSS Grid animation with `transition-[grid-template-rows,opacity]`
- Can feel glitchy due to simultaneous grid-rows + opacity transitions
- Not leveraging native Radix animations

### Key Discoveries:
- `tw-animate-css` package provides `animate-collapsible-down/up` classes (`index.css:2`)
- These work with `--radix-collapsible-content-height` CSS variable (auto-set by Radix)
- Accordion component shows the pattern: `data-[state=open]:animate-accordion-down` (`accordion.tsx:58`)
- `SectionHeader.tsx:72-76` shows proper rotating chevron pattern

## Desired End State

All expandable sections have smooth, Apple-like animations:
- Content height animates smoothly using native Radix height calculations
- Single chevron icon that rotates 180° on expand/collapse
- Consistent animation timing: 300ms with Apple's standard easing curve
- WizardShell sections use the same animation approach for consistency

### Verification:
- Expand/collapse Budget Detail page sections - animation is smooth
- Expand/collapse Wizard Review step sections - animation is smooth
- Navigate through Wizard steps - no glitchy animations
- Chevron icons rotate smoothly in all locations

## What We're NOT Doing

- Not changing the Accordion component (already has animations)
- Not adding any new animation library dependencies
- Not changing the visual design (colors, spacing, etc.)
- Not modifying the expand/collapse logic or state management

## Implementation Approach

Use Radix's native `data-state` attribute with `tw-animate-css` classes for height animations. This is the same pattern used by the Accordion component and provides smooth, hardware-accelerated animations.

For the Apple-like feel:
- Duration: 300ms
- Easing: `cubic-bezier(0.32, 0.72, 0, 1)` (Apple's standard easing)

## Phase 1: Add Custom Animation Classes

### Overview
Define custom collapsible animation classes with Apple-like timing in `index.css`.

### Changes Required:

#### 1. Add animation classes to index.css
**File**: `src/index.css`
**Changes**: Add custom collapsible animation keyframes and classes after the existing animations

```css
@keyframes collapsible-down {
  from {
    height: 0;
  }
  to {
    height: var(--radix-collapsible-content-height);
  }
}

@keyframes collapsible-up {
  from {
    height: var(--radix-collapsible-content-height);
  }
  to {
    height: 0;
  }
}

.animate-collapsible-down {
  animation: collapsible-down 300ms cubic-bezier(0.32, 0.72, 0, 1);
}

.animate-collapsible-up {
  animation: collapsible-up 300ms cubic-bezier(0.32, 0.72, 0, 1);
}
```

### Success Criteria:

#### Automated Verification:
- [x] Build passes: `npm run build`
- [x] Type checking passes: `npm run typecheck` (via tsc -b in build)

#### Manual Verification:
- [ ] CSS classes are available in browser dev tools

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Update CollapsibleContent Component

### Overview
Add the animation classes to the `CollapsibleContent` component using the `data-state` pattern.

### Changes Required:

#### 1. Update collapsible.tsx
**File**: `src/components/ui/collapsible.tsx`
**Changes**: Add animation classes and overflow-hidden to CollapsibleContent

```tsx
import { cn } from "@/lib/utils"

function CollapsibleContent({
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      className={cn(
        "overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up",
        className
      )}
      {...props}
    />
  )
}
```

### Success Criteria:

#### Automated Verification:
- [x] Build passes: `npm run build`
- [x] All tests pass: `npm test` (3 pre-existing failures unrelated to collapsible)

#### Manual Verification:
- [ ] Budget Detail page sections animate smoothly when expanding/collapsing
- [ ] Wizard Review step sections animate smoothly when expanding/collapsing

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Update Chevron Icons to Rotate

### Overview
Replace the two-icon swap pattern with a single rotating chevron in both BudgetSection and StepReview components.

### Changes Required:

#### 1. Update BudgetSection.tsx chevron
**File**: `src/components/budget-detail/BudgetSection.tsx`
**Changes**:
- Remove `ChevronRight` import
- Use single `ChevronDown` with rotation transition

Replace:
```tsx
{isOpen ? (
  <ChevronDown className="w-4 h-4 text-gray-500" />
) : (
  <ChevronRight className="w-4 h-4 text-gray-500" />
)}
```

With:
```tsx
<ChevronDown
  className={cn(
    'w-4 h-4 text-gray-500 transition-transform duration-200',
    isOpen && 'rotate-180'
  )}
/>
```

#### 2. Update StepReview.tsx chevrons
**File**: `src/components/wizard/steps/StepReview.tsx`
**Changes**:
- Remove `ChevronRight` import
- Use single `ChevronDown` with rotation transition for all three sections

Replace each instance of:
```tsx
{incomeOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
```

With:
```tsx
<ChevronDown
  className={cn(
    'w-4 h-4 transition-transform duration-200',
    incomeOpen && 'rotate-180'
  )}
/>
```

(Same pattern for `expensesOpen` and `savingsOpen`)

### Success Criteria:

#### Automated Verification:
- [x] Build passes: `npm run build`
- [x] All tests pass: `npm test` (3 pre-existing failures unrelated to chevrons)

#### Manual Verification:
- [ ] Budget Detail page chevrons rotate smoothly (90°)
- [ ] Wizard Review step chevrons rotate smoothly (90°)
- [ ] Animation feels consistent with other chevrons in the app

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: Fix WizardShell Step Animation

### Overview
Replace the glitchy CSS Grid animation in WizardShell with the native Radix Collapsible pattern for consistency and smoothness.

### Changes Required:

#### 1. Update WizardShell.tsx to use Collapsible
**File**: `src/components/wizard/WizardShell.tsx`
**Changes**:
- Import `Collapsible` and `CollapsibleContent` components
- Replace the CSS Grid animation div with Collapsible components

Add imports:
```tsx
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
```

Replace the expandable content section (lines 192-203):
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

With:
```tsx
{/* Expandable content with Radix Collapsible animation */}
<Collapsible open={isExpanded}>
  <CollapsibleContent>
    <div className="px-4 pb-4">
      {renderStepContent(step.id)}
    </div>
  </CollapsibleContent>
</Collapsible>
```

### Success Criteria:

#### Automated Verification:
- [x] Build passes: `npm run build`
- [x] All tests pass: `npm test` (3 pre-existing failures unrelated to WizardShell)

#### Manual Verification:
- [ ] Navigate through wizard steps - animations are smooth, no glitches
- [ ] Expand/collapse steps by clicking headers - smooth animations
- [ ] Animation timing feels consistent with other collapsible sections

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:
- Existing tests should continue to pass (they test expand/collapse behavior, not animation)
- No new unit tests needed for CSS animations

### Integration Tests:
- N/A - animations are visual only

### Manual Testing Steps:
1. Budget Detail Page:
   - Click Income section header - should expand with smooth height animation
   - Click again - should collapse smoothly
   - Chevron should rotate 180° during expand, back during collapse
   - Repeat for Expenses and Savings sections

2. Budget Creation Wizard - Review Step:
   - Navigate to review step with some items
   - Click Income header - should expand smoothly
   - Click Expenses header - should expand smoothly
   - Click Savings header - should expand smoothly
   - All chevrons should rotate smoothly

3. Budget Creation Wizard - Step Navigation:
   - Click through steps 1-5
   - Each step should expand/collapse smoothly
   - No visual glitches or jumpy animations
   - Go back to previous steps - still smooth

4. Edge Cases:
   - Rapidly click expand/collapse - should handle gracefully
   - Expand section with many items - animation should still be smooth
   - Expand section with no items - animation should still work

## Performance Considerations

- Native Radix animations use CSS transforms which are GPU-accelerated
- No JavaScript animation libraries needed
- Animation duration (300ms) is short enough to feel responsive
- `overflow-hidden` prevents layout thrashing during animation

## References

- Accordion component pattern: `src/components/ui/accordion.tsx:58`
- SectionHeader chevron pattern: `src/components/wizard/SectionHeader.tsx:72-76`
- tw-animate-css import: `src/index.css:2`
- Apple easing reference: `cubic-bezier(0.32, 0.72, 0, 1)`
