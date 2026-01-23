---
date: 2026-01-19T12:00:00+01:00
researcher: Claude
git_commit: 01276af4a40e368fc46cc88729f21befbe9e4d18
branch: main
repository: balance-frontend
topic: "Budget Wizard Table Mobile Horizontal Overflow"
tags: [research, codebase, wizard, mobile, table, responsive, overflow]
status: complete
last_updated: 2026-01-19
last_updated_by: Claude
---

# Research: Budget Wizard Table Mobile Horizontal Overflow

**Date**: 2026-01-19T12:00:00+01:00
**Researcher**: Claude
**Git Commit**: 01276af4a40e368fc46cc88729f21befbe9e4d18
**Branch**: main
**Repository**: balance-frontend

## Research Question
The input tables for income/expense/savings in the budget creation wizard look weird on mobile. If bank account name or amount are too long the table becomes scrollable horizontally. This is especially visible on the expenses section because the table contains one more item (isManual checkbox) than income/savings sections. Please research the relevant components and exactly what elements contribute to this, as well as how the design of different elements affect each other.

## Summary

The horizontal scrolling on mobile in wizard tables is caused by a combination of factors:

1. **The Table component wrapper** has `overflow-x-auto` which enables horizontal scrolling when content exceeds container width
2. **Percentage-based column widths** (35%, 30%, 25%, etc.) on `TableHead` elements that don't shrink proportionally on narrow screens
3. **Fixed-width columns** (`w-[50px]`) for delete buttons that consume space regardless of screen size
4. **The expenses table has 5 columns** (Name, Account, Amount, Manual checkbox, Delete) vs **4 columns** in income/savings (Name, Account, Amount, Delete), making it inherently wider
5. **AccountSelect component** uses `w-fit` width which expands to fit content, potentially causing longer account names to push the table wider
6. **`whitespace-nowrap`** classes on TableHead and TableCell prevent text wrapping, forcing horizontal expansion

## Detailed Findings

### Table Component Structure

The shadcn/ui Table component in `src/components/ui/table.tsx:5-17` wraps the `<table>` element in a container div with `overflow-x-auto`:

```tsx
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}
```

This design pattern intentionally enables horizontal scrolling when table content exceeds the container width, which is a common responsive table approach.

### TableHead and TableCell Styling

`TableHead` (`table.tsx:66-77`) includes:
- `px-2` - horizontal padding
- `whitespace-nowrap` - prevents text wrapping, forces horizontal expansion

`TableCell` (`table.tsx:79-90`) includes:
- `p-2` - padding on all sides
- `whitespace-nowrap` - prevents text wrapping

The `whitespace-nowrap` class on both elements prevents column headers and cell content from wrapping to multiple lines, meaning content always expands horizontally rather than vertically.

### Income Table Column Structure

`StepIncome.tsx:155-161`:
```tsx
<TableHeader>
  <TableRow>
    <TableHead className="w-[35%]">Name</TableHead>
    <TableHead className="w-[30%]">Account</TableHead>
    <TableHead className="text-right">Amount</TableHead>
    <TableHead className="w-[50px]"></TableHead>
  </TableRow>
</TableHeader>
```

**Total defined width**: 35% + 30% + auto + 50px = **65% + 50px + remaining**

Column contents:
1. **Name**: `Input` component with `border-0 shadow-none focus-visible:ring-0 px-0`
2. **Account**: `AccountSelect` component with `triggerClassName="border-0 shadow-none focus:ring-0 px-0"`
3. **Amount**: `Input` type="number" with same borderless styling, `text-right`
4. **Delete**: `Button` with ghost variant, `size="sm"`, containing Trash2 icon

### Savings Table Column Structure

`StepSavings.tsx:227-233`:
```tsx
<TableHeader>
  <TableRow>
    <TableHead className="w-[35%]">Name</TableHead>
    <TableHead className="w-[35%]">Account</TableHead>
    <TableHead className="text-right">Amount</TableHead>
    <TableHead className="w-[50px]"></TableHead>
  </TableRow>
</TableHeader>
```

**Total defined width**: 35% + 35% + auto + 50px = **70% + 50px + remaining**

Same 4-column structure as income, but with slightly different percentage allocations (Account column is 35% instead of 30%).

### Expenses Table Column Structure (5 columns)

`StepExpenses.tsx:338-345`:
```tsx
<TableHeader>
  <TableRow>
    <TableHead className="w-[30%]">Name</TableHead>
    <TableHead className="w-[25%]">Account</TableHead>
    <TableHead className="text-right w-[20%]">Amount</TableHead>
    <TableHead className="w-[15%] text-center">Manual</TableHead>
    <TableHead className="w-[50px]"></TableHead>
  </TableRow>
</TableHeader>
```

**Total defined width**: 30% + 25% + 20% + 15% + 50px = **90% + 50px**

The expenses table has:
1. **Name** (30%): Input with same borderless styling, plus optional Repeat icon
2. **Account** (25%): AccountSelect component
3. **Amount** (20%): Number input with `text-right`
4. **Manual** (15%): Checkbox centered with `div className="flex items-center justify-center"`
5. **Delete** (50px): Trash button

### Input Component Base Styling

`src/components/ui/input.tsx:11-13`:
```tsx
className={cn(
  "file:text-foreground placeholder:text-muted-foreground ... h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base ... md:text-sm",
  ...
)}
```

Key classes:
- `w-full` - takes full width of container
- `min-w-0` - allows shrinking below intrinsic minimum width
- `h-9` - fixed height of 36px
- `px-3` - 12px horizontal padding (reduced to `px-0` in table context)

### AccountSelect / SelectTrigger Styling

`src/components/ui/select.tsx:39-41` (SelectTrigger):
```tsx
className={cn(
  "... flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap ...",
  className
)}
```

Key classes:
- **`w-fit`** - width fits content, meaning longer account names expand the trigger
- `whitespace-nowrap` - prevents account name from wrapping
- `gap-2` - 8px gap between text and chevron icon
- `px-3` - 12px horizontal padding (reduced to `px-0` via `triggerClassName`)

The `w-fit` class is significant because it means the AccountSelect will expand to fit the longest account name, potentially pushing the table wider on mobile.

### Checkbox Component Sizing

`src/components/ui/checkbox.tsx:14-16`:
```tsx
className={cn(
  "... size-4 shrink-0 rounded-[4px] border ...",
  className
)}
```

Key classes:
- `size-4` - 16x16px fixed size
- `shrink-0` - prevents shrinking

The checkbox itself is small (16px), but the containing cell has 15% width allocation plus padding.

### How Elements Interact to Cause Overflow

**Minimum content width calculation for expenses table:**

| Column | Width Definition | Min Content Width (approx) |
|--------|-----------------|---------------------------|
| Name | 30% | Input placeholder text + any icons |
| Account | 25% | AccountSelect with text + chevron icon |
| Amount | 20% | Number input ~60px |
| Manual | 15% | Checkbox 16px + padding |
| Delete | 50px | Button ~32px |

On a 375px mobile screen:
- 30% = 112.5px
- 25% = 93.75px
- 20% = 75px
- 15% = 56.25px
- 50px = 50px
- **Total: 387.5px** (already exceeds screen width)

Additionally:
- Cell padding (`p-2` = 8px per cell, both sides = 16px per cell)
- 5 cells = 80px additional padding
- **Effective minimum: ~467px**

Compare to income/savings (4 columns):
- 35% + 30% + auto + 50px with fewer cells = less padding overhead
- **Effective minimum: ~360-380px**

### Copy Items Row Grid Alignment

The "From last budget" copy items use a grid layout to align with table columns.

`StepIncome.tsx:280`:
```tsx
<div className="flex-1 min-w-0 grid grid-cols-[35%_30%_1fr_50px] items-center gap-0">
```

`StepSavings.tsx:353`:
```tsx
<div className="flex-1 min-w-0 grid grid-cols-[35%_35%_1fr_50px] items-center gap-0">
```

These grids mirror the TableHead column widths to maintain visual alignment between table rows and copy-item rows.

### Border and Container Styling

All three step components wrap their tables identically:
```tsx
<div className="border rounded-lg">
  <Table>
    ...
  </Table>
</div>
```

The `border rounded-lg` wrapper adds 1px border on each side, contributing minimally (2px total) to width requirements.

## Code References

- `src/components/ui/table.tsx:5-17` - Table component with overflow-x-auto wrapper
- `src/components/ui/table.tsx:66-77` - TableHead with whitespace-nowrap
- `src/components/ui/table.tsx:79-90` - TableCell with whitespace-nowrap and p-2 padding
- `src/components/wizard/steps/StepIncome.tsx:155-161` - Income table header (4 columns)
- `src/components/wizard/steps/StepSavings.tsx:227-233` - Savings table header (4 columns)
- `src/components/wizard/steps/StepExpenses.tsx:338-345` - Expenses table header (5 columns)
- `src/components/ui/input.tsx:11-13` - Input component with min-w-0 and w-full
- `src/components/ui/select.tsx:39-41` - SelectTrigger with w-fit and whitespace-nowrap
- `src/components/ui/checkbox.tsx:14-16` - Checkbox with size-4 and shrink-0
- `src/components/accounts/AccountSelect.tsx:49-68` - AccountSelect wrapping Select component

## Architecture Documentation

### Current Table Design Pattern

The wizard steps use a consistent pattern for editable tables:
1. shadcn/ui Table components wrapping native HTML table elements
2. Borderless inputs inside table cells for inline editing
3. Percentage-based column widths on TableHead elements
4. Fixed-width action columns (50px for delete button)
5. `overflow-x-auto` on table wrapper enables horizontal scroll

### Mobile Responsiveness Approach

Unlike other list components in the codebase (e.g., `AccountsList.tsx` which uses `hidden md:block` for table and `md:hidden` for cards), the wizard step tables do not have an alternate mobile layout. They rely solely on horizontal scrolling via `overflow-x-auto`.

### Column Width Strategy

- **Percentage widths**: Used for content columns (Name, Account, Amount, Manual)
- **Fixed pixel widths**: Used for action columns (Delete button)
- **Auto width**: Used sparingly for Amount column in income/savings tables

## Historical Context (from thoughts/)

No directly related research was found in thoughts/ for this specific mobile overflow issue. Related documents include:
- `.claude/thoughts/plans/2026-01-16-fix-wizard-copy-items-horizontal-stacking.md` - Recent fix for horizontal stacking of copy items
- `.claude/thoughts/plans/story-05-02-wizard-step2-income.md` - Original income step implementation plan
- `.claude/thoughts/plans/story-05-03-wizard-step3-expenses.md` - Original expenses step implementation plan

## Open Questions

1. What minimum column widths are required for inputs to remain usable on mobile?
2. Should the wizard tables adopt the same table/card responsive pattern used in AccountsList?
3. Could the AccountSelect component use a truncation strategy to prevent long account names from expanding the table?
4. Should the expenses table have a different layout on mobile given its 5-column structure?
