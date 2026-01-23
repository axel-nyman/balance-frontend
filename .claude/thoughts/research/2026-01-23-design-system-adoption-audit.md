---
date: 2026-01-23T12:00:00+01:00
researcher: Claude
git_commit: a0471316faf04d268422084764d481506cd9e055
branch: feat/visual-redesign
repository: balance-frontend
topic: "Design System Adoption Audit - system.md Implementation Status"
tags: [research, design-system, visual-redesign, css, components]
status: complete
last_updated: 2026-01-23
last_updated_by: Claude
---

# Research: Design System Adoption Audit

**Date**: 2026-01-23T12:00:00+01:00
**Researcher**: Claude
**Git Commit**: a0471316faf04d268422084764d481506cd9e055
**Branch**: feat/visual-redesign
**Repository**: balance-frontend

## Research Question

Investigate the current implementation of the new design system defined in system.md, focusing on the system-wide redesign. Identify all components (cards, items, and any other UI elements) that are not yet using the new color palette, styles, or border radius. Compare existing implementations with the updated guidance in system.md. Provide a clear overview of what remains to update for a complete adoption of the new design system.

## Summary

The design system in `.design-engineer/system.md` defines a warm cream/beige OKLCH color palette, iOS-native shadows (no borders on cards), and larger border-radius values (`rounded-2xl` for cards, `rounded-xl` for buttons/inputs). The CSS variables in `src/index.css` fully implement the OKLCH color tokens. The base UI components (`Card`, `Button`, `Dialog`, `Input`) are fully compliant. However, **78+ instances of hardcoded text-gray colors**, **89+ instances of hardcoded semantic colors** (green/red/blue/yellow), and **several tables using legacy `border rounded-lg`** patterns remain to be updated across feature-specific components.

---

## Detailed Findings

### 1. CSS Variables (src/index.css)

**Status**: Fully Compliant

All design system tokens are correctly implemented using OKLCH color space:

| Token | Spec Value | Actual Value | Match |
|-------|-----------|--------------|-------|
| `--background` | `oklch(0.975 0.012 85)` | `oklch(0.975 0.012 85)` | Exact |
| `--card` | `oklch(0.995 0.005 85)` | `oklch(0.995 0.005 85)` | Exact |
| `--muted` | `oklch(0.955 0.012 85)` | `oklch(0.955 0.012 85)` | Exact |
| `--foreground` | `oklch(0.25 0.015 60)` | `oklch(0.25 0.015 60)` | Exact |
| `--muted-foreground` | `oklch(0.50 0.01 60)` | `oklch(0.50 0.01 60)` | Exact |
| `--border` | `oklch(0.90 0.01 85)` | `oklch(0.90 0.01 85)` | Exact |

Shadow scale (`--shadow-xs`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`) is fully implemented with OKLCH-based warm shadows.

Semantic budget colors are defined:
- `--income`: `oklch(0.55 0.14 145)` (green)
- `--expense`: `oklch(0.55 0.18 25)` (red)
- `--savings`: `oklch(0.55 0.14 250)` (blue)
- `--balanced`: `oklch(0.55 0.14 145)` (green)

---

### 2. Base UI Components (src/components/ui/)

**Status**: Fully Compliant

| Component | Border Radius | Elevation | Colors | Compliant |
|-----------|--------------|-----------|--------|-----------|
| `card.tsx` | `rounded-2xl` | `shadow-sm`, no border | `bg-card`, `text-card-foreground` | Yes |
| `button.tsx` | `rounded-xl` (default), `rounded-lg` (sm) | No shadow (outline uses `shadow-xs`) | Design tokens | Yes |
| `dialog.tsx` | `rounded-2xl` | `shadow-lg`, no border | `bg-card` | Yes |
| `input.tsx` | `rounded-xl` | `shadow-xs` + `border` | `border-input`, `placeholder:text-muted-foreground` | Yes |

---

### 3. Layout Components

**Status**: Fully Compliant

- **AppLayout.tsx**: Uses `bg-background` for page background
- **Sidebar.tsx**: Uses `bg-sidebar`, `border-sidebar-border`, nav items with `rounded-xl`, `hover:bg-sidebar-accent`
- **Header.tsx**: Uses `bg-card`, `border-border`, button with `rounded-xl`, `hover:bg-accent`

One minor hardcoded color: `bg-black/50` for mobile overlay in Sidebar.tsx

---

### 4. Feature Components - Status Summary

#### Fully Adopted (Use rounded-2xl + shadow-sm + bg-card)

| File | Pattern Used |
|------|-------------|
| `src/components/accounts/AccountsList.tsx:66` | `bg-card rounded-2xl shadow-sm` |
| `src/components/recurring-expenses/RecurringExpensesList.tsx:88` | `bg-card rounded-2xl shadow-sm` |
| `src/components/budget-detail/BudgetSection.tsx:51` | `bg-card rounded-2xl shadow-sm` |
| `src/components/wizard/WizardShell.tsx:174` | `bg-card rounded-2xl shadow-sm` |
| `src/components/accounts/BalanceHistoryDrawer.tsx:119` | `rounded-2xl bg-card shadow-sm` |
| `src/components/shared/LoadingState.tsx:15,33,46` | `bg-card rounded-2xl shadow-sm` |

All components using `<Card>`, `<Dialog>`, `<Sheet>` primitives inherit compliant styles.

#### Not Compliant - Tables with Legacy Border Pattern

| File | Line | Current Pattern |
|------|------|-----------------|
| `src/components/wizard/steps/StepIncome.tsx` | 153 | `border rounded-lg` |
| `src/components/wizard/steps/StepExpenses.tsx` | 336 | `border rounded-lg` |
| `src/components/wizard/steps/StepSavings.tsx` | 225 | `border rounded-lg` |

**Should be**: `bg-card rounded-2xl shadow-sm` (no border)

---

### 5. Hardcoded Colors - Complete Inventory

#### Hardcoded Gray Text Colors (78+ instances)

Design tokens to use: `text-foreground`, `text-muted-foreground`

| File | Hardcoded Classes |
|------|-------------------|
| `src/pages/NotFoundPage.tsx` | `text-gray-900`, `text-gray-500` |
| `src/components/shared/PageHeader.tsx` | `text-gray-900`, `text-gray-500` |
| `src/components/shared/EmptyState.tsx` | `text-gray-400`, `text-gray-900`, `text-gray-500` |
| `src/components/shared/ErrorState.tsx` | `text-gray-900`, `text-gray-500` |
| `src/components/budgets/BudgetCard.tsx` | `text-gray-900`, `text-gray-500`, `text-gray-700` |
| `src/components/budget-detail/BudgetSummary.tsx` | `text-gray-500` |
| `src/components/accounts/AccountCard.tsx` | `text-gray-900`, `text-gray-500` |
| `src/components/accounts/AccountsSummary.tsx` | `text-gray-500`, `text-gray-900` |
| `src/components/recurring-expenses/RecurringExpenseCard.tsx` | `text-gray-900`, `text-gray-500` |
| `src/components/recurring-expenses/DueStatusIndicator.tsx` | `text-gray-600` |
| `src/components/wizard/WizardNavigation.tsx` | `text-gray-600`, `hover:text-gray-900` |
| `src/components/wizard/steps/StepMonthYear.tsx` | `text-gray-500` |
| `src/components/wizard/steps/StepIncome.tsx` | `text-gray-900`, `text-gray-500`, `text-gray-400` |
| `src/components/wizard/steps/StepExpenses.tsx` | `text-gray-900`, `text-gray-500`, `text-gray-400` |
| `src/components/wizard/steps/StepSavings.tsx` | `text-gray-900`, `text-gray-500`, `text-gray-400` |
| `src/components/wizard/steps/StepReview.tsx` | `text-gray-900`, `text-gray-500` |
| `src/components/todo/TodoProgress.tsx` | `text-gray-400`, `text-gray-600` |
| `src/components/todo/TodoItemRow.tsx` | `text-gray-900`, `text-gray-500` |

#### Hardcoded Gray Border Colors (6 instances)

Design token to use: `border-border`

| File | Line | Current |
|------|------|---------|
| `src/components/wizard/WizardNavigation.tsx` | 28 | `border-gray-100` |
| `src/components/budgets/BudgetCard.tsx` | 24 | `hover:border-gray-300` |
| `src/components/accounts/AccountCard.tsx` | 27 | `hover:border-gray-300` |
| `src/components/wizard/steps/StepSavings.tsx` | 349 | `border-gray-100` |
| `src/components/wizard/steps/StepIncome.tsx` | 276 | `border-gray-100` |
| `src/components/wizard/steps/StepExpenses.tsx` | 187 | `border-gray-200`, `hover:border-gray-300` |

#### Hardcoded Semantic Colors (89+ instances)

Design system defines semantic tokens `--income`, `--expense`, `--savings`, `--balanced` but components use hardcoded Tailwind colors:

| Color | Hardcoded Classes | Files |
|-------|------------------|-------|
| Green | `text-green-600`, `bg-green-100`, `bg-green-50`, `bg-green-500` | BudgetSummary, BudgetCard, StepIncome, StepExpenses, StepSavings, StepReview, SectionHeader, DueStatusIndicator, TodoProgress |
| Red | `text-red-600`, `bg-red-600`, `bg-red-50`, `bg-red-500`, `hover:bg-red-700` | BudgetSummary, BudgetCard, BudgetSection, BudgetActions, ConfirmDialog, StepExpenses, StepSavings, StepReview, DueStatusIndicator, all form validation errors |
| Blue | `text-blue-600`, `bg-blue-100`, `bg-blue-50/50`, `from-blue-500`, `to-blue-600` | BudgetSummary, BudgetCard, BudgetSection, StepReview, StepExpenses, SectionHeader, ProgressHeader, AccountSelect |
| Yellow | `text-yellow-600`, `bg-yellow-500` | StepReview, DueStatusIndicator |

#### Utility Function with Hardcoded Colors

`src/lib/utils.ts:94-110` returns hardcoded color class strings:
- `text-green-600` for balanced
- `text-yellow-600` for surplus
- `text-red-600` for negative

`src/components/budget-detail/BudgetSection.tsx:44-48` has a mapping object:
```typescript
const colorClasses = {
  green: 'text-green-600',
  red: 'text-red-600',
  blue: 'text-blue-600',
}
```

---

### 6. Border Radius Compliance Summary

| Radius Class | Count | Design System Usage |
|-------------|-------|-------------------|
| `rounded-2xl` (16px) | 14 | Cards, dialogs - Compliant |
| `rounded-xl` (12px) | 11 | Buttons, inputs, nav items, info boxes - Compliant |
| `rounded-lg` (8px) | 7 | Small buttons (compliant), tables (not compliant) |
| `rounded-md` (6px) | 2 | Accordion, skeleton - Not in spec |
| `rounded-sm` (2px) | 1 | Select items - Not in spec |
| `rounded-full` | 9 | Circular indicators - Special case |

---

## Components Requiring Updates

### High Priority - Structural Changes

1. **Wizard Step Tables** (3 files)
   - `src/components/wizard/steps/StepIncome.tsx:153`
   - `src/components/wizard/steps/StepExpenses.tsx:336`
   - `src/components/wizard/steps/StepSavings.tsx:225`
   - Change: `border rounded-lg` to `bg-card rounded-2xl shadow-sm`

### Medium Priority - Color Token Migration

2. **Shared Components** (4 files)
   - `src/components/shared/PageHeader.tsx`
   - `src/components/shared/EmptyState.tsx`
   - `src/components/shared/ErrorState.tsx`
   - `src/components/shared/ConfirmDialog.tsx`
   - Change: `text-gray-*` to `text-foreground`/`text-muted-foreground`

3. **Budget Components** (3 files)
   - `src/components/budgets/BudgetCard.tsx`
   - `src/components/budget-detail/BudgetSummary.tsx`
   - `src/components/budget-detail/BudgetActions.tsx`
   - Change: hardcoded grays and semantic colors to design tokens

4. **Account Components** (3 files)
   - `src/components/accounts/AccountCard.tsx`
   - `src/components/accounts/AccountsSummary.tsx`
   - `src/components/accounts/AccountSelect.tsx`
   - Change: hardcoded grays and `hover:border-gray-*` to design tokens

5. **Recurring Expense Components** (2 files)
   - `src/components/recurring-expenses/RecurringExpenseCard.tsx`
   - `src/components/recurring-expenses/DueStatusIndicator.tsx`
   - Change: hardcoded grays and status colors to design tokens

6. **Wizard Components** (7 files)
   - `src/components/wizard/WizardNavigation.tsx`
   - `src/components/wizard/SectionHeader.tsx`
   - `src/components/wizard/ProgressHeader.tsx`
   - `src/components/wizard/steps/StepMonthYear.tsx`
   - `src/components/wizard/steps/StepIncome.tsx`
   - `src/components/wizard/steps/StepExpenses.tsx`
   - `src/components/wizard/steps/StepSavings.tsx`
   - `src/components/wizard/steps/StepReview.tsx`
   - Change: extensive hardcoded colors to design tokens

7. **Todo Components** (2 files)
   - `src/components/todo/TodoProgress.tsx`
   - `src/components/todo/TodoItemRow.tsx`
   - Change: hardcoded grays to design tokens

8. **Pages** (1 file)
   - `src/pages/NotFoundPage.tsx`
   - Change: hardcoded grays to design tokens

### Low Priority - Utility Functions

9. **Utility Color Functions** (2 files)
   - `src/lib/utils.ts` - `getBalanceColorClass` function
   - `src/components/budget-detail/BudgetSection.tsx` - `colorClasses` object
   - Change: return semantic design tokens instead of hardcoded classes

---

## Architecture Documentation

### Design System File Structure

```
.design-engineer/
  system.md                    # Design system specification

src/
  index.css                    # CSS variables and theme tokens (OKLCH)
  components/
    ui/                        # Base components (fully compliant)
      card.tsx                 # bg-card rounded-2xl shadow-sm
      button.tsx               # rounded-xl, variants
      dialog.tsx               # bg-card rounded-2xl shadow-lg
      input.tsx                # rounded-xl border shadow-xs
    layout/                    # Layout components (fully compliant)
      AppLayout.tsx            # bg-background
      Sidebar.tsx              # bg-sidebar, rounded-xl nav items
      Header.tsx               # bg-card, rounded-xl button
```

### Token Inheritance Pattern

The design system uses a layered approach:
1. CSS variables in `:root` define raw OKLCH colors
2. Tailwind's `@theme inline` maps CSS variables to `--color-*` namespace
3. Base UI components apply tokens (Card, Button, Dialog, Input)
4. Feature components inherit from base components or apply tokens directly

### Missing Semantic Token Usage

The design system defines semantic budget tokens (`--income`, `--expense`, `--savings`, `--balanced`) but no Tailwind utility classes reference them. Components use hardcoded `text-green-600`, `text-red-600`, `text-blue-600` instead.

Consider adding Tailwind mappings:
```css
--color-income: var(--income);
--color-expense: var(--expense);
--color-savings: var(--savings);
--color-balanced: var(--balanced);
```

---

## Code References

### Compliant Base Components
- `src/components/ui/card.tsx:10` - Card with `rounded-2xl shadow-sm`
- `src/components/ui/dialog.tsx:62` - Dialog with `rounded-2xl shadow-lg`
- `src/components/ui/button.tsx:8` - Button with `rounded-xl`
- `src/components/ui/input.tsx:12` - Input with `rounded-xl border shadow-xs`

### Non-Compliant Tables
- `src/components/wizard/steps/StepIncome.tsx:153` - `border rounded-lg`
- `src/components/wizard/steps/StepExpenses.tsx:336` - `border rounded-lg`
- `src/components/wizard/steps/StepSavings.tsx:225` - `border rounded-lg`

### Hardcoded Color Hotspots
- `src/lib/utils.ts:94-110` - Balance color utility function
- `src/components/budget-detail/BudgetSection.tsx:44-48` - Color mapping object
- `src/components/budget-detail/BudgetSummary.tsx:19-40` - All summary colors
- `src/components/wizard/steps/StepExpenses.tsx` - 15+ hardcoded color instances

---

## Open Questions

1. **Semantic Token Utilities**: Should Tailwind utility classes be created for `--income`, `--expense`, `--savings`, `--balanced` tokens to replace hardcoded green/red/blue/yellow?

2. **Alert Dialog Styling**: `alert-dialog.tsx` uses `rounded-lg` with border, while `dialog.tsx` uses `rounded-2xl` without border. Is this intentional differentiation or should AlertDialog match Dialog?

3. **Hover Border Patterns**: Some cards (BudgetCard, AccountCard) use `hover:border-gray-300` on top of the Card component's shadow. Should hover states only use `hover:shadow-md` instead?

4. **Form Validation Colors**: All modals use hardcoded `text-red-600` for validation errors. Should a `--destructive-foreground` or `--error` token be used instead?
