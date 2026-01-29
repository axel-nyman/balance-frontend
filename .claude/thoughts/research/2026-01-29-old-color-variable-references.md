---
date: 2026-01-29T10:30:00+01:00
researcher: Claude
git_commit: d632e14dcd4b39d88a8bc3fdb976e9a45af1dc5c
branch: feat/visual-redesign
repository: balance-frontend
topic: "CSS variable usage for consolidation planning"
tags: [research, css, colors, design-system, tailwind, refactoring]
status: complete
last_updated: 2026-01-29
last_updated_by: Claude
---

# CSS Variable Usage Analysis for Consolidation

**Goal**: Identify where each semantic CSS variable is used in code, so redundant variables can be removed and code updated to use the consolidated primitives.

## Current Variable Redundancies (from index.css)

| Semantic Tokens | All Reference | Primitive Value |
|-----------------|---------------|-----------------|
| `--muted`, `--accent`, `--secondary` | `--surface-3` | `oklch(0.94 0.005 250)` |
| `--border`, `--input` | `--surface-4` | `oklch(0.91 0.003 250)` |
| `--foreground`, `--card-foreground`, `--popover-foreground`, `--accent-foreground`, `--secondary-foreground` | `--text-primary` | `oklch(0.20 0.01 250)` |
| `--income`, `--balanced` | `--color-positive` | `oklch(0.55 0.17 155)` |
| `--expense`, `--destructive` | `--color-negative` | `oklch(0.58 0.18 25)` |
| `--sidebar-*` (8 tokens) | Main tokens | Just references |

---

## Group 1: Surface-3 Tokens (`--muted`, `--accent`, `--secondary`)

### `bg-muted` / `text-muted-foreground` (HEAVILY USED - 80+ refs)

**bg-muted usage:**
- `src/components/wizard/ProgressHeader.tsx:22` - Progress bar track
- `src/components/wizard/steps/StepIncome.tsx:239` - Table footer row
- `src/components/wizard/steps/StepExpenses.tsx:249` - Summary stats container
- `src/components/wizard/steps/StepSavings.tsx:172` - Summary stats container
- `src/components/wizard/steps/StepSavings.tsx:312` - Table footer row
- `src/components/wizard/steps/StepReview.tsx:149` - Summary container
- `src/components/wizard/SectionHeader.tsx:42` - Status indicator (upcoming)
- `src/components/recurring-expenses/EditRecurringExpenseModal.tsx:165` - Info box
- `src/components/accounts/UpdateBalanceModal.tsx:80` - Account info box
- `src/components/ui/table.tsx:45` - Table footer (`bg-muted/50`)
- `src/components/ui/table.tsx:58` - Table row hover (`hover:bg-muted/50`, `data-[state=selected]:bg-muted`)

**text-muted-foreground usage:** (60+ instances - secondary text everywhere)
- Form labels, descriptions, placeholders
- Empty states, loading states
- Table secondary columns
- Metadata displays (dates, descriptions)
- Icon colors
- See full grep output above for complete list

### `bg-accent` / `hover:bg-accent` (HEAVILY USED - 15+ refs)

**Usage:**
- `src/components/ui/skeleton.tsx:7` - Skeleton loading animation
- `src/components/ui/select.tsx:112` - Focus state (`focus:bg-accent`)
- `src/components/ui/button.tsx:16` - Outline variant hover
- `src/components/ui/button.tsx:20` - Ghost variant hover
- `src/components/ui/badge.tsx:19` - Outline badge hover
- `src/components/ui/dialog.tsx:71` - Close button open state
- `src/components/layout/Header.tsx:13` - Menu button hover
- `src/components/recurring-expenses/RecurringExpenseRow.tsx:22` - Row hover
- `src/components/accounts/AccountRow.tsx:26` - Row hover
- `src/components/wizard/SectionHeader.tsx:30,32` - Clickable sections
- `src/components/budget-detail/BudgetSection.tsx:53,75,89,128` - Section interactions

### `bg-secondary` / `text-secondary-foreground` (LOW USAGE - 3 refs)

**Usage:**
- `src/components/ui/button.tsx:18` - Secondary button variant
- `src/components/ui/badge.tsx:15` - Secondary badge variant
- `src/components/ui/sheet.tsx:75` - Sheet close button open state

---

## Group 2: Surface-4 Tokens (`--border`, `--input`)

### `border-border` (MODERATE USAGE - 15+ refs)

**Usage:**
- `src/index.css:214` - Global base style (`@apply border-border`)
- `src/components/layout/Header.tsx:9` - Header bottom border
- `src/components/shared/LoadingState.tsx:47,51` - Loading skeleton borders
- `src/components/wizard/WizardNavigation.tsx:28` - Navigation top border
- `src/components/wizard/WizardShell.tsx:182` - Step dividers
- `src/components/budget-detail/BudgetSection.tsx:70,128` - Section dividers
- `src/components/accounts/BalanceHistoryDrawer.tsx:28` - History item dividers
- `src/components/wizard/steps/StepSavings.tsx:349` - Table row borders
- `src/components/wizard/steps/StepIncome.tsx:276` - Table row borders
- `src/components/wizard/steps/StepExpenses.tsx:187` - Copy button border

### `border-input` / `bg-input` (LOW USAGE - 3 refs, dark mode only)

**Usage:**
- `src/components/ui/input.tsx:12` - Input border
- `src/components/ui/button.tsx:16` - Outline button dark mode (`dark:bg-input/30`, `dark:border-input`)

---

## Group 3: Text Tokens (all → `--text-primary`)

### `text-foreground` (HEAVILY USED - 40+ refs)

Primary text color used throughout:
- Page titles, headings
- Card/item labels
- Table primary columns
- Button text, link text
- See full grep output above

### `text-card-foreground` (LOW USAGE - 2 refs)

**Usage:**
- `src/components/ui/card.tsx:10` - Card component base
- `src/components/ui/alert.tsx:11` - Alert default variant

### `text-popover-foreground` (NOT USED IN CODE)

Only defined in CSS, referenced by `@theme inline` mapping.

### `text-accent-foreground` (MODERATE USAGE - 6 refs)

**Usage:**
- `src/components/ui/select.tsx:112` - Select item focus
- `src/components/ui/badge.tsx:19` - Outline badge hover
- `src/components/ui/button.tsx:16` - Outline button hover
- `src/components/ui/button.tsx:20` - Ghost button hover

### `text-secondary-foreground` (LOW USAGE - 2 refs)

**Usage:**
- `src/components/ui/button.tsx:18` - Secondary button
- `src/components/ui/badge.tsx:15` - Secondary badge

---

## Group 4: Semantic Color Tokens

### `text-income` / `bg-income` / `bg-income-muted` (MODERATE - 20+ refs)

**text-income:**
- `src/components/budget-detail/BudgetSummary.tsx:20,40` - Income display
- `src/components/budgets/BudgetCard.tsx:53,72` - Budget card
- `src/components/wizard/steps/*` - Wizard summaries
- `src/components/todo/TodoProgress.tsx:24,32` - Completion indicator
- `src/components/wizard/SectionHeader.tsx:40` - Complete status
- `src/lib/utils.ts:102,106` - Balance formatting

**bg-income:**
- `src/components/recurring-expenses/DueStatusIndicator.tsx:38` - Paid indicator

**bg-income-muted:**
- `src/components/wizard/SectionHeader.tsx:40` - Complete status bg
- `src/components/wizard/steps/StepIncome.tsx:277` - Copy row highlight
- `src/components/wizard/steps/StepSavings.tsx:350` - Copy row highlight

### `text-expense` / `bg-expense` (MODERATE - 15+ refs)

**text-expense:**
- `src/components/budget-detail/BudgetSummary.tsx:26,40` - Expense display
- `src/components/budgets/BudgetCard.tsx:59,72` - Budget card
- `src/components/wizard/steps/*` - Wizard summaries
- `src/components/recurring-expenses/DueStatusIndicator.tsx:25` - Due now text
- `src/lib/utils.ts:109` - Negative balance
- `src/components/accounts/BalanceHistoryDrawer.tsx:24` - Negative change

**bg-expense:**
- `src/components/recurring-expenses/DueStatusIndicator.tsx:24` - Due indicator dot

### `text-savings` / `bg-savings-muted` (MODERATE - 10+ refs)

**text-savings:**
- `src/components/budget-detail/BudgetSummary.tsx:32` - Savings display
- `src/components/budgets/BudgetCard.tsx:65` - Budget card
- `src/components/wizard/SectionHeader.tsx:41` - Current status
- `src/components/wizard/steps/StepExpenses.tsx:377` - Recurring icon
- `src/components/wizard/steps/StepSavings.tsx:408` - Savings total

**bg-savings-muted:**
- `src/components/wizard/SectionHeader.tsx:41` - Current status bg
- `src/components/wizard/steps/StepExpenses.tsx:363` - Recurring row bg

### `text-balanced` (LOW USAGE - 2 refs)

**Usage:**
- `src/lib/utils.ts:102,106` - Zero/positive balance display

### `text-destructive` / `bg-destructive` (HEAVY USAGE - 35+ refs)

**text-destructive:**
- Form validation errors (all modals)
- Error states, warnings
- Trash icon hover states
- `src/components/budget-detail/BudgetActions.tsx:79` - Delete button

**bg-destructive:**
- `src/components/ui/button.tsx:14` - Destructive button variant
- `src/components/ui/badge.tsx:17` - Destructive badge variant
- `src/components/shared/ConfirmDialog.tsx:47` - Confirm destructive action

---

## Group 5: Sidebar Tokens (all reference main tokens)

### Sidebar tokens in use:

| Token | Used In | Count |
|-------|---------|-------|
| `bg-sidebar` | Sidebar.tsx:31 | 1 |
| `border-sidebar-border` | Sidebar.tsx:31,38 | 2 |
| `hover:bg-sidebar-accent` | Sidebar.tsx:42,62 | 2 |
| `bg-sidebar-accent` | Sidebar.tsx:61 | 1 |
| `text-sidebar-primary` | Sidebar.tsx:61 | 1 |
| `text-sidebar-foreground` | Sidebar.tsx:62 | 1 |
| `hover:text-sidebar-foreground` | Sidebar.tsx:62 | 1 |

**Only used in `src/components/layout/Sidebar.tsx`**

---

## Group 6: Other Tokens

### `bg-card` / `text-card-foreground` (HEAVY USAGE - 15+ refs)

**bg-card:**
- All card containers throughout the app
- Dialog content backgrounds
- Section containers
- See grep output above

### `bg-popover` / `text-popover-foreground` (LOW DIRECT USAGE)

Primarily used through shadcn `@theme inline` mapping in `select.tsx:65`

### `bg-background` (MODERATE - 5 refs)

**Usage:**
- `src/index.css:217` - Body background
- `src/components/layout/AppLayout.tsx:10` - App container
- `src/components/ui/sheet.tsx:61` - Sheet background
- `src/components/ui/alert-dialog.tsx:55` - Alert dialog background
- `src/components/ui/button.tsx:16` - Outline button background

### `ring-ring` / `border-ring` (MODERATE - 8 refs)

Used for focus states in UI components (button, input, badge, checkbox, etc.)

### `bg-primary` / `text-primary-foreground` (MODERATE - 8 refs)

**Usage:**
- `src/components/ui/button.tsx:12` - Default button
- `src/components/ui/badge.tsx:13` - Default badge
- `src/components/ui/progress.tsx:15,22` - Progress indicator
- `src/components/ui/input.tsx:12` - Text selection
- `src/components/ui/checkbox.tsx:15` - Checked state

---

## Consolidation Recommendations

### Safe to Remove (not used or only in CSS):

1. **`--popover-foreground`** - Only in CSS, no Tailwind class usage
2. **`--sidebar-ring`** - Defined but never used

### Consider Consolidating in Code:

1. **`--muted` / `--accent` / `--secondary`** → All mean "interactive/hover surface"
   - `bg-muted` = container backgrounds
   - `bg-accent` = hover/focus states
   - `bg-secondary` = only button/badge variants
   - **Recommendation**: Keep `bg-muted` for containers, `bg-accent` for hover, remove `--secondary` (3 refs)

2. **`--balanced` → `--income`** - Both are green/positive
   - Only 2 refs to `text-balanced` in `lib/utils.ts`
   - **Recommendation**: Replace with `text-income`

3. **`--destructive` / `--expense`** - Both are red/negative
   - Used differently: `destructive` for errors/delete, `expense` for money out
   - **Recommendation**: Keep separate for semantic clarity, but could unify

4. **Sidebar tokens** - Only used in one file
   - **Recommendation**: Replace with main tokens directly in Sidebar.tsx

5. **`-foreground` variants** - Many are identical
   - `--card-foreground`, `--popover-foreground`, `--accent-foreground`, `--secondary-foreground` all = `--text-primary`
   - **Recommendation**: Replace with `text-foreground` where sensible

---

## Quick Reference: Files to Update by Token

| Token to Remove | Files to Update |
|-----------------|-----------------|
| `bg-secondary`, `text-secondary-foreground` | button.tsx, badge.tsx, sheet.tsx |
| `text-balanced` | lib/utils.ts |
| `text-card-foreground` | card.tsx, alert.tsx |
| `text-accent-foreground` | select.tsx, badge.tsx, button.tsx (×2) |
| `text-secondary-foreground` | button.tsx, badge.tsx |
| Sidebar tokens | Sidebar.tsx only |
