# Table Pattern Analysis & Fix Plan

> Created: 2026-02-18
> Status: Ready for implementation

## Problem

On desktop (1440px+), table-like containers stretch to fill the entire content area. After the 256px sidebar and `lg:p-8` (32px) content padding, tables expand to ~1100px+. With only 3-5 columns of short data (names, currency amounts, action buttons), the browser distributes massive empty space across columns. The result:

1. **Columns too far apart.** The eye must travel 600-700px from "Name" to "Balance" — breaking the Gestalt principle of proximity. Row association becomes difficult.
2. **Corners feel cramped.** The `rounded-2xl` (24px) container clips into cell padding of only `px-4` (16px). The visual padding at corners is effectively ~8px where the curve bites in.

These issues affect three surfaces:
- **AccountsList** — 4 columns (Name, Description, Balance, Actions)
- **RecurringExpensesList** — 5 columns (Name, Amount, Account, Interval, Actions)
- **BudgetSection** — custom list layout (label + amount + actions)

Mobile is fine — cards replace tables (except BudgetSection, which works because narrow viewports naturally constrain width).

## Why Tables Are Still Right

This app has 5-20 row lists of structured data with aligned numeric columns. Tables are the correct pattern because:

- Currency values need columnar alignment (`tabular-nums` only works when amounts are vertically stacked)
- Users scan vertically within a column (all amounts, all names) — not reading rows left-to-right like prose
- The data is inherently tabular: each row is one entity, each column is one attribute

The problem isn't the pattern — it's the lack of width constraint.

## Solution

### 1. Constrain container width: `max-w-4xl` (896px)

Add `max-w-4xl` to all table/list containers on desktop. Left-aligned (no `mx-auto`), so content stays near the sidebar where the eye naturally starts.

**Why `max-w-4xl`?**
- 896px comfortably fits 5 columns (recurring expenses has the most)
- Keeps columns close enough for instant row association
- Still feels spacious, not cramped — matches the app's airy personality
- On screens ≤1152px wide (896 + 256 sidebar), the constraint has no effect — tables already fit naturally

**Where to apply:**
- `AccountsList.tsx` — the `hidden md:block` wrapper div
- `RecurringExpensesList.tsx` — the `hidden md:block` wrapper div
- `BudgetSection.tsx` — the `Collapsible` wrapper (applies on all sizes, but only matters on wide desktop since mobile is already narrow)
- Wizard step tables (`StepIncome.tsx`, `StepExpenses.tsx`) — these already have `max-w-2xl` from `WizardShell`, so no change needed

### 2. Increase edge cell padding for rounded corners

First and last cells in each row need extra horizontal padding to breathe inside the curve.

**Table headers and cells:**
- First cell: change `px-4` → `pl-6 pr-4` (or apply at `<th>`/`<td>` level)
- Last cell: change `px-4` → `pl-4 pr-6`

**BudgetSection list items:**
- Change `px-4` → `px-6` on the header trigger div, list items, and "Add" button
- The extra 8px (24px vs 16px) on each side gives the 24px radius room to curve without crowding content

**Why not modify the base Table component?**
The shadcn `table.tsx` component is generic. Adding edge padding there would affect all tables globally, including future ones that might not have rounded containers. Better to apply at the usage site (the wrapper or the specific `<th>`/`<td>` elements) where the rounded context exists.

However — since ALL current tables use rounded containers, a pragmatic alternative is to add `first:pl-6 last:pr-6` overrides to `TableHead` and `TableCell` in the base component. This is a judgment call; if every table in the app will always be rounded, do it globally. If some might not, do it per-usage.

**Recommendation:** Do it globally in the base Table component. Every table in this app lives in a rounded card. If a future table doesn't, the extra 8px edge padding still looks fine — it's never wrong to have slightly more breathing room at edges.

### 3. Summary of changes

| File | Change |
|------|--------|
| `src/components/ui/table.tsx` (TableHead) | Add `first:pl-6 last:pr-6` |
| `src/components/ui/table.tsx` (TableCell) | Add `first:pl-6 last:pr-6` |
| `src/components/accounts/AccountsList.tsx` | Add `max-w-4xl` to desktop table wrapper |
| `src/components/recurring-expenses/RecurringExpensesList.tsx` | Add `max-w-4xl` to desktop table wrapper |
| `src/components/budget-detail/BudgetSection.tsx` | Add `max-w-4xl` to Collapsible wrapper; bump `px-4` → `px-6` on trigger, list items, and add button |

### Visual result

Before (1440px viewport):
```
|-- sidebar 256px --|-- table stretches ~1100px+ ------------------------------------------|
| Name              | Description                                           | Balance     |
```

After (1440px viewport):
```
|-- sidebar 256px --|-- table capped at 896px ---------|-- open space --|
|  Name             | Description       | Balance      |
```

Columns stay close. Corners breathe. Content feels intentional, not stretched.
