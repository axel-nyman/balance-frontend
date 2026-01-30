---
date: 2026-01-29T12:00:00+01:00
researcher: Claude
git_commit: c08648ce422219c0dd38ded77911e2a0664fa1e5
branch: feat/visual-redesign
repository: balance-frontend
topic: "Table border radii and margins in accounts page, recurring expenses page, and budget wizard"
tags: [research, tables, styling, border-radius, margins, accounts, recurring-expenses, wizard]
status: complete
last_updated: 2026-01-29
last_updated_by: Claude
---

# Research: Table Border Radii and Margins

**Date**: 2026-01-29T12:00:00+01:00
**Researcher**: Claude
**Git Commit**: c08648ce422219c0dd38ded77911e2a0664fa1e5
**Branch**: feat/visual-redesign
**Repository**: balance-frontend

## Research Question

Document the border radii and margins used in tables across the accounts page, recurring expenses page, and new budget wizard.

## Summary

All table containers in the codebase use a consistent `rounded-2xl` (28px) border radius applied via a wrapper `<div>` around the shadcn/ui Table component. The base Table component itself has no border radius. Cell padding varies between the shadcn defaults (`p-2` = 8px) and custom row components (`px-4 py-3` = 16px/12px). Tables have no explicit margins; spacing is handled by parent layouts using `space-y-*` utilities.

## Detailed Findings

### CSS Variables (index.css:21-28)

The border-radius scale is defined in `src/index.css`:

```css
:root {
  --radius: 1.25rem; /* 20px - base radius */
}

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);   /* 16px */
  --radius-md: calc(var(--radius) - 2px);   /* 18px */
  --radius-lg: var(--radius);                /* 20px */
  --radius-xl: calc(var(--radius) + 4px);   /* 24px */
  --radius-2xl: calc(var(--radius) + 8px);  /* 28px */
  --radius-3xl: calc(var(--radius) + 12px); /* 32px */
  --radius-4xl: calc(var(--radius) + 16px); /* 36px */
}
```

Tables use `rounded-2xl` = **28px** border radius.

### Base Table Component (components/ui/table.tsx)

The shadcn/ui Table component defines these base styles:

| Component | Padding/Spacing | Border Radius | Other |
|-----------|----------------|---------------|-------|
| `Table` | none | none | `w-full caption-bottom text-sm` |
| `TableHeader` | none | none | `[&_tr]:border-b` |
| `TableBody` | none | none | `[&_tr:last-child]:border-0` |
| `TableRow` | none | none | `hover:bg-muted/50 border-b` |
| `TableHead` | `px-2` (8px), `h-10` (40px height) | none | `font-medium whitespace-nowrap` |
| `TableCell` | `p-2` (8px all sides) | none | `whitespace-nowrap` |
| `TableFooter` | none | none | `bg-muted/50 border-t font-medium` |

**Note**: The Table component wraps the `<table>` in a `<div>` with `overflow-x-auto` but no border radius.

### Accounts Page

**File**: `src/components/accounts/AccountsList.tsx:66`

```jsx
<div className="hidden md:block bg-card rounded-2xl shadow-sm">
  <Table>
```

- **Container**: `bg-card rounded-2xl shadow-sm`
- **Border Radius**: `rounded-2xl` = 28px
- **Margin**: None (parent uses `space-y-*`)
- **Shadow**: `shadow-sm`

**File**: `src/components/accounts/AccountRow.tsx:24-54`

Custom `<tr>` and `<td>` elements (not using shadcn TableRow/TableCell):

```jsx
<tr className="hover:bg-accent cursor-pointer">
  <td className="px-4 py-3 font-medium text-foreground">
```

- **Row hover**: `hover:bg-accent`
- **Cell padding**: `px-4 py-3` (16px horizontal, 12px vertical)

### Recurring Expenses Page

**File**: `src/components/recurring-expenses/RecurringExpensesList.tsx:88`

```jsx
<div className="hidden md:block bg-card rounded-2xl shadow-sm">
  <Table>
```

- **Container**: `bg-card rounded-2xl shadow-sm` (identical to Accounts)
- **Border Radius**: `rounded-2xl` = 28px
- **Margin**: None
- **Shadow**: `shadow-sm`

**File**: `src/components/recurring-expenses/RecurringExpenseRow.tsx:21-59`

Custom `<tr>` and `<td>` elements:

```jsx
<tr className="hover:bg-accent">
  <td className="px-4 py-3">
```

- **Row hover**: `hover:bg-accent`
- **Cell padding**: `px-4 py-3` (16px horizontal, 12px vertical)

### Budget Wizard Steps

All three wizard steps with tables use identical container styling:

**StepIncome.tsx:153**
```jsx
<div className="bg-card rounded-2xl shadow-sm">
  <Table>
```

**StepExpenses.tsx:336**
```jsx
<div className="bg-card rounded-2xl shadow-sm">
  <Table>
```

**StepSavings.tsx:225**
```jsx
<div className="bg-card rounded-2xl shadow-sm">
  <Table>
```

All wizard tables:
- **Container**: `bg-card rounded-2xl shadow-sm`
- **Border Radius**: `rounded-2xl` = 28px
- **Margin**: None (parent `space-y-6` handles spacing)
- **Shadow**: `shadow-sm`

Wizard tables use shadcn TableCell/TableHead with default `p-2` padding, but form inputs inside cells have `px-0` to remove horizontal padding:

```jsx
<Input className="border-0 shadow-none focus-visible:ring-0 px-0" />
```

### Summary Table

| Location | Container Class | Border Radius | Cell Padding | Row Hover |
|----------|----------------|---------------|--------------|-----------|
| AccountsList | `bg-card rounded-2xl shadow-sm` | 28px | `px-4 py-3` (custom) | `hover:bg-accent` |
| RecurringExpensesList | `bg-card rounded-2xl shadow-sm` | 28px | `px-4 py-3` (custom) | `hover:bg-accent` |
| StepIncome | `bg-card rounded-2xl shadow-sm` | 28px | `p-2` (shadcn default) | `hover:bg-muted/50` |
| StepExpenses | `bg-card rounded-2xl shadow-sm` | 28px | `p-2` (shadcn default) | `hover:bg-muted/50` |
| StepSavings | `bg-card rounded-2xl shadow-sm` | 28px | `p-2` (shadcn default) | `hover:bg-muted/50` |

## Code References

- `src/index.css:21-28` - Border radius CSS variables
- `src/index.css:66` - Base radius definition (`--radius: 1.25rem`)
- `src/components/ui/table.tsx` - Base table component (no border radius)
- `src/components/accounts/AccountsList.tsx:66` - Accounts table container
- `src/components/accounts/AccountRow.tsx:24-54` - Custom row with `px-4 py-3`
- `src/components/recurring-expenses/RecurringExpensesList.tsx:88` - Recurring table container
- `src/components/recurring-expenses/RecurringExpenseRow.tsx:21-59` - Custom row with `px-4 py-3`
- `src/components/wizard/steps/StepIncome.tsx:153` - Wizard income table container
- `src/components/wizard/steps/StepExpenses.tsx:336` - Wizard expenses table container
- `src/components/wizard/steps/StepSavings.tsx:225` - Wizard savings table container

## Architecture Documentation

### Pattern: Table Container Wrapper

All tables follow this consistent pattern:

```jsx
<div className="bg-card rounded-2xl shadow-sm">
  <Table>
    {/* ... */}
  </Table>
</div>
```

The border radius is applied to the wrapper `<div>`, not the table itself. This is necessary because:
1. HTML tables don't support `border-radius` directly on `<table>` elements
2. The wrapper provides the visual card styling (`bg-card`, `shadow-sm`)
3. `overflow-x-auto` on the inner Table container allows horizontal scrolling if needed

### Pattern: Custom Row Components vs shadcn Defaults

- **Accounts/Recurring Expenses**: Use custom `<tr>`/`<td>` elements with larger padding (`px-4 py-3`) for better touch targets and readability
- **Wizard Steps**: Use shadcn `TableRow`/`TableCell` with default `p-2` padding, but form inputs inside cells override with `px-0` for tighter alignment

### Pattern: No Explicit Margins

Tables have no margins. Parent components use Tailwind's `space-y-*` utilities:
- Wizard steps: `space-y-6` (24px between sections)
- Mobile card lists: `space-y-3` (12px between cards)

## Open Questions

None - the implementation is consistent across all table locations.
