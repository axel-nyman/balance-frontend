---
date: 2026-02-04T12:00:00+01:00
researcher: Claude
git_commit: 16a6e776b723e4ac1a9c15c289af3e61f94bbd80
branch: feat/visual-redesign
repository: balance-frontend
topic: "Animation Refactoring Opportunities"
tags: [research, codebase, animations, refactoring, hooks, constants]
status: complete
last_updated: 2026-02-04
last_updated_by: Claude
---

# Research: Animation Refactoring Opportunities

**Date**: 2026-02-04T12:00:00+01:00
**Researcher**: Claude
**Git Commit**: 16a6e776b723e4ac1a9c15c289af3e61f94bbd80
**Branch**: feat/visual-redesign
**Repository**: balance-frontend

## Research Question

We just refactored the budget creation wizard with animation hooks and timing constants. Could these or similar refactorings be done in other parts of the codebase as well?

## Summary

The recent wizard refactoring introduced two key patterns:
1. **Animation timing constants** (`src/components/wizard/constants/animations.ts`) - centralized timing values synchronized with CSS
2. **useCopyAnimation hook** (`src/components/wizard/hooks/useCopyAnimation.ts`) - reusable animation state management

After analyzing the codebase, **the wizard is currently the only area with complex animation timing that required this refactoring**. Other animations in the codebase use simpler patterns that don't need similar treatment. However, there are a few areas where consistency could be improved.

## Detailed Findings

### What Was Refactored in the Wizard

The wizard refactoring extracted:

1. **Animation Constants** (`src/components/wizard/constants/animations.ts:15-47`):
   - `POP_CHECK_DURATION = 200` - check icon bounce
   - `COLLAPSE_DURATION = 250` - row collapse
   - `COLLAPSE_DELAY = 250` - pause before collapse
   - `ENTRANCE_DURATION = 250` - fade-in for new items
   - `CASCADE_STAGGER_DELAY = 100` - stagger for "Add All Due"
   - Derived values: `COPY_ACTION_DELAY`, `ENTRANCE_CLEANUP_DELAY`, `TOTAL_ANIMATION_DURATION`

2. **useCopyAnimation Hook** (`src/components/wizard/hooks/useCopyAnimation.ts`):
   - Manages `copyingIds` (Set) and `newlyAddedIds` (Set)
   - Provides `startCopyAnimation()` with coordinated timeouts
   - Used by all three wizard steps: StepIncome, StepExpenses, StepSavings

### Current Animation Patterns Elsewhere in the Codebase

#### 1. CSS Transitions (No Refactoring Needed)

These use Tailwind classes with no JavaScript timing coordination:

| Component | Pattern | Location |
|-----------|---------|----------|
| BudgetCard | `hover:shadow-md transition-shadow` | `src/components/budgets/BudgetCard.tsx:24` |
| AccountCard | `hover:shadow-md transition-shadow` | `src/components/accounts/AccountCard.tsx:27` |
| Sidebar | `transition-transform duration-200` | `src/components/layout/Sidebar.tsx:32` |
| BudgetSection chevron | `transition-transform duration-200` | `src/components/budget-detail/BudgetSection.tsx:57` |
| Button | `transition-all` (base style) | `src/components/ui/button.tsx:8` |

**Assessment**: These are simple CSS-only transitions. No JavaScript timing needed.

#### 2. Tailwind Animations (No Refactoring Needed)

Standard Tailwind animations used for loading states:

| Component | Animation | Location |
|-----------|-----------|----------|
| Skeleton | `animate-pulse` | `src/components/ui/skeleton.tsx:7` |
| BalanceHistoryDrawer | `animate-spin` | `src/components/accounts/BalanceHistoryDrawer.tsx:141` |
| Sonner toast | `animate-spin` | `src/components/ui/sonner.tsx:25` |

**Assessment**: Built-in Tailwind animations. No custom timing needed.

#### 3. Radix UI State Animations (No Refactoring Needed)

Radix components handle their own enter/exit animations:

| Component | Pattern | Location |
|-----------|---------|----------|
| Dialog | `data-[state=open]:animate-in` | `src/components/ui/dialog.tsx:62` |
| AlertDialog | `data-[state=open]:animate-in` | `src/components/ui/alert-dialog.tsx:55` |
| Sheet | `data-[state=open]:animate-in` | `src/components/ui/sheet.tsx:61` |
| Accordion | `animate-accordion-down/up` | `src/components/ui/accordion.tsx:58` |
| Collapsible | `animate-collapsible-down/up` | `src/components/ui/collapsible.tsx:29` |

**Assessment**: Radix handles all timing internally. No JavaScript coordination needed.

#### 4. Custom CSS Animations (Wizard-Specific)

The custom keyframe animations are only used in the wizard:

| Animation | Duration | Used In |
|-----------|----------|---------|
| `pop-check` | 200ms | WizardItemCard, StepIncome, StepSavings, StepExpenses |
| `fade-in-subtle` | 250ms | StepIncome, StepSavings, StepExpenses |
| `collapse-row` | 250ms + 250ms delay | StepIncome, StepSavings, StepExpenses |
| `collapsible-down/up` | 300ms | ui/collapsible.tsx |

**Assessment**: Only wizard steps use the complex multi-phase animations requiring JavaScript coordination.

### Areas with Hardcoded Timing Values

#### Test Files (Low Priority)

Three test files use hardcoded `100ms` delays for simulating API responses:

- `src/components/recurring-expenses/CreateRecurringExpenseModal.test.tsx:131`
- `src/components/recurring-expenses/EditRecurringExpenseModal.test.tsx:134`
- `src/components/wizard/WizardIntegration.test.tsx:209`

**Assessment**: Test utilities. Could extract a `TEST_API_DELAY` constant, but low impact.

#### CSS Duration Values (Already Consistent)

The CSS file (`src/index.css:194-267`) has inline duration values that match the JS constants:

```css
.animate-pop-check { animation: pop-check 200ms ... }
.animate-fade-in-subtle { animation: fade-in-subtle 250ms ... }
.animate-collapse-row { animation: collapse-row 250ms ... 250ms ... }
.animate-collapsible-down { animation: collapsible-down 300ms ... }
```

**Assessment**: These are synchronized with `animations.ts` but not using CSS custom properties. Could use CSS variables for single source of truth, but this is cosmetic.

### State Management Patterns

#### Pattern: Nullable Object for Modal State

Multiple pages use the same pattern for edit/delete modals:

```typescript
// Pattern used in AccountsPage, RecurringExpensesPage, BudgetDetailPage
const [editingItem, setEditingItem] = useState<Item | null>(null)
const [deletingItem, setDeletingItem] = useState<Item | null>(null)
```

**Locations**:
- `src/pages/AccountsPage.tsx:11-14`
- `src/pages/RecurringExpensesPage.tsx:17-19`
- `src/pages/BudgetDetailPage.tsx:54-69`
- `src/components/todo/TodoItemList.tsx:13`

**Assessment**: This is a common React pattern, not a duplication issue. A generic hook wouldn't add value here.

#### Pattern: Collapsible Section State

Multiple components manage collapsible section state:

```typescript
const [isOpen, setIsOpen] = useState(true)
```

**Locations**:
- `src/components/budget-detail/BudgetSection.tsx:42`
- `src/components/wizard/steps/StepReview.tsx:24-26` (3 sections)

**Assessment**: Standard Radix Collapsible usage. No hook extraction needed.

### Potential Minor Improvements

#### 1. CSS Custom Properties for Animation Durations (Optional)

Could define durations as CSS custom properties in `index.css`:

```css
:root {
  --animation-pop-check: 200ms;
  --animation-collapse: 250ms;
  --animation-fade-in: 250ms;
  --animation-collapsible: 300ms;
}
```

**Benefit**: Single source of truth without needing to sync CSS and JS.
**Trade-off**: More complex CSS, minor benefit for current usage.

#### 2. Test Delay Constant (Optional)

Could add to a test utilities file:

```typescript
export const TEST_API_DELAY = 100
```

**Benefit**: Consistent test timing.
**Trade-off**: Very minor improvement, three files affected.

## Architecture Documentation

### Current Animation Architecture

```
src/
├── index.css                           # Keyframe definitions + animation classes
├── components/
│   ├── ui/                             # Radix components (self-managed animations)
│   │   ├── dialog.tsx                  # Uses Radix enter/exit
│   │   ├── sheet.tsx                   # Uses Radix enter/exit
│   │   ├── accordion.tsx               # Uses Radix accordion animations
│   │   └── collapsible.tsx             # Uses custom collapsible-down/up
│   └── wizard/
│       ├── constants/
│       │   └── animations.ts           # JS timing constants
│       ├── hooks/
│       │   └── useCopyAnimation.ts     # Animation state hook
│       └── steps/
│           ├── StepIncome.tsx          # Uses useCopyAnimation
│           ├── StepExpenses.tsx        # Uses useCopyAnimation
│           └── StepSavings.tsx         # Uses useCopyAnimation
```

### When to Extract Animation Constants/Hooks

The wizard refactoring was appropriate because:
1. Multiple timeouts needed coordination (3 setTimeout calls)
2. Animation state was duplicated across 3 components
3. CSS and JS timing needed synchronization

This pattern should be applied when:
- JavaScript needs to coordinate with CSS animation timing
- Multiple components share the same animation sequence
- State needs to track animation phases (copying, added, etc.)

It should NOT be applied to:
- Simple CSS transitions (hover effects)
- Radix-managed animations (dialogs, accordions)
- Loading spinners and pulses

## Historical Context (from thoughts/)

The wizard animation refactoring was documented in:
- `.claude/thoughts/plans/2026-02-02-extract-copy-animation-hook.md`
- `.claude/thoughts/plans/2026-02-02-extract-animation-timing-constants.md`
- `.claude/thoughts/plans/2026-02-02-consolidate-wizard-edit-modals.md`

Earlier animation work documented in:
- `.claude/thoughts/plans/2025-12-31-income-copy-animation-redesign.md`
- `.claude/thoughts/plans/2026-01-19-collapsible-animations.md`

## Code References

- `src/components/wizard/constants/animations.ts` - Animation timing constants
- `src/components/wizard/hooks/useCopyAnimation.ts` - Animation state hook
- `src/components/wizard/steps/StepIncome.tsx:31-32` - useCopyAnimation usage
- `src/components/wizard/steps/StepExpenses.tsx:37-38` - useCopyAnimation usage
- `src/components/wizard/steps/StepSavings.tsx:32-33` - useCopyAnimation usage
- `src/index.css:194-267` - Custom animation keyframes

## Conclusion

**The recent wizard refactoring was well-targeted.** The wizard is the only area with complex, coordinated animations requiring JavaScript timing management. Other parts of the codebase use simpler patterns (CSS transitions, Radix animations, Tailwind utilities) that don't benefit from similar extraction.

The two optional improvements identified (CSS custom properties for durations, test delay constant) are minor and can be considered later if the codebase grows more complex animation needs.

## Open Questions

- Should CSS custom properties be used for animation durations to have a single source of truth?
- Is the test API delay (100ms) worth extracting to a constant?
