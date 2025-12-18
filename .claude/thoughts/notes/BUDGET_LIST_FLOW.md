# Balance — Budget List UX Flow

This document defines the user experience for viewing all budgets at `/budgets`.

---

## Overview

The Budget List page is the main entry point for budget management. It displays all budgets as cards in a grid layout, allowing users to:

- View all budgets at a glance
- See key totals for each budget
- Identify budget status (locked/unlocked)
- Navigate to create a new budget
- Open any budget's detail view

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Budgets                                       [+ New Budget]   │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ March 2025      │  │ February 2025   │  │ January 2025    │  │
│  │ ────────────    │  │ ────────────    │  │ ────────────    │  │
│  │ UNLOCKED        │  │ LOCKED     ✓    │  │ LOCKED     ✓    │  │
│  │                 │  │                 │  │                 │  │
│  │ Income   50 000 kr │ Income   52 000 kr │ Income   48 000 kr │
│  │ Expenses 32 000 kr │ Expenses 31 000 kr │ Expenses 29 000 kr │
│  │ Savings  18 000 kr │ Savings  21 000 kr │ Savings  19 000 kr │
│  │                 │  │                 │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │ December 2024   │  │ November 2024   │                       │
│  │ ────────────    │  │ ────────────    │                       │
│  │ LOCKED     ✓    │  │ LOCKED     ✓    │                       │
│  │                 │  │                 │                       │
│  │ Income   45 000 kr │ Income   45 000 kr │                    │
│  │ Expenses 28 000 kr │ Expenses 30 000 kr │                    │
│  │ Savings  17 000 kr │ Savings  15 000 kr │                    │
│  │                 │  │                 │                       │
│  └─────────────────┘  └─────────────────┘                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Header Section

### Elements
- **Page title:** "Budgets"
- **New Budget button:** Primary action, top right → navigates to `/budgets/new` (wizard)

---

## Budget Card Grid

### Grid Behavior
- Responsive grid layout
- Cards maintain consistent square-ish aspect ratio
- Grid adjusts columns based on viewport width

| Viewport | Columns |
|----------|---------|
| Desktop (≥1024px) | 3-4 columns |
| Tablet (768px - 1023px) | 2-3 columns |
| Mobile (<768px) | 1-2 columns |

### Sorting
- Default: Newest first (year DESC, month DESC)
- Most recent budget appears top-left

---

## Budget Card Design

```
┌─────────────────────────┐
│ March 2025              │  ← Title (Month Year)
│ ──────────────────────  │
│ UNLOCKED                │  ← Status badge
│                         │
│ Income      50 000,00 kr │  ← Totals
│ Expenses    32 000,00 kr │
│ Savings     18 000,00 kr │
│                         │
└─────────────────────────┘
```

### Card Elements

| Element | Description |
|---------|-------------|
| Title | Month and year (e.g., "March 2025") |
| Status badge | LOCKED or UNLOCKED indicator |
| Income total | Sum of all income items |
| Expenses total | Sum of all expense items |
| Savings total | Sum of all savings items |

### Status Badge Styling

| Status | Appearance |
|--------|------------|
| UNLOCKED | Muted/neutral color (gray), text "UNLOCKED" |
| LOCKED | Success color (green), text "LOCKED" with checkmark ✓ |

### Card Interaction
- Entire card is clickable
- Hover state: subtle elevation or border highlight
- Click → navigates to `/budgets/:id` (Budget Detail page)

---

## Card Variants

### Unlocked Budget Card

```
┌─────────────────────────┐
│ March 2025              │
│ ──────────────────────  │
│ UNLOCKED                │
│                         │
│ Income      50 000,00 kr │
│ Expenses    32 000,00 kr │
│ Savings     18 000,00 kr │
│                         │
│ Balance:      0,00 kr ✓ │  ← Optional: show if balanced
└─────────────────────────┘
```

Optional enhancement: Show balance status to indicate if budget is ready to lock.

| Balance | Display |
|---------|---------|
| 0,00 kr | Green "✓" or "Ready to lock" |
| ≠ 0,00 kr | Muted text showing remaining amount |

### Locked Budget Card

```
┌─────────────────────────┐
│ February 2025           │
│ ──────────────────────  │
│ LOCKED             ✓    │
│                         │
│ Income      52 000,00 kr │
│ Expenses    31 000,00 kr │
│ Savings     21 000,00 kr │
│                         │
│ Todo: 3/5 completed     │  ← Optional: todo progress
└─────────────────────────┘
```

Optional enhancement: Show todo list progress on locked budgets.

---

## Empty State

When no budgets exist:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                         📊                                      │
│                                                                 │
│               No budgets yet                                    │
│                                                                 │
│    Create your first monthly budget to start planning           │
│    your finances.                                               │
│                                                                 │
│                   [+ Create Budget]                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- Friendly illustration or icon
- Encouraging message
- Call-to-action button → navigates to wizard

---

## Loading State

While fetching budgets:

```
┌─────────────────────────────────────────────────────────────────┐
│  Budgets                                       [+ New Budget]   │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ ░░░░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░░░░ │  │ ░░░░░░░░░░░░░░░ │  │
│  │ ░░░░░░░░        │  │ ░░░░░░░░        │  │ ░░░░░░░░        │  │
│  │                 │  │                 │  │                 │  │
│  │ ░░░░░░░ ░░░░░░░ │  │ ░░░░░░░ ░░░░░░░ │  │ ░░░░░░░ ░░░░░░░ │  │
│  │ ░░░░░░░ ░░░░░░░ │  │ ░░░░░░░ ░░░░░░░ │  │ ░░░░░░░ ░░░░░░░ │  │
│  │ ░░░░░░░ ░░░░░░░ │  │ ░░░░░░░ ░░░░░░░ │  │ ░░░░░░░ ░░░░░░░ │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- Skeleton cards matching the card layout
- Show 3-6 skeleton cards depending on viewport

---

## Error Handling

### Failed to Load
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                         ⚠️                                      │
│                                                                 │
│              Failed to load budgets                             │
│                                                                 │
│    Something went wrong. Please try again.                      │
│                                                                 │
│                      [Retry]                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Responsive Behavior

### Desktop (≥1024px)
- 3-4 column grid
- Cards have comfortable padding
- Hover effects visible

### Tablet (768px - 1023px)
- 2-3 column grid
- Slightly smaller cards

### Mobile (<768px)
- 1-2 column grid (or single column stack)
- Cards stretch to full width or half width
- Touch-friendly tap targets

```
┌─────────────────────────────────────┐
│  Budgets              [+ New]       │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ March 2025                  │    │
│  │ UNLOCKED                    │    │
│  │                             │    │
│  │ Income       50 000,00 kr   │    │
│  │ Expenses     32 000,00 kr   │    │
│  │ Savings      18 000,00 kr   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ February 2025               │    │
│  │ LOCKED                 ✓    │    │
│  │                             │    │
│  │ Income       52 000,00 kr   │    │
│  │ Expenses     31 000,00 kr   │    │
│  │ Savings      21 000,00 kr   │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

---

## Navigation Context

### Entry Points
- Sidebar navigation → "Budgets"
- Direct URL: `/budgets`

### Exit Points
- Click card → `/budgets/:id` (Budget Detail)
- Click "New Budget" → `/budgets/new` (Budget Wizard)
- Sidebar navigation → other pages

---

## Keyboard Accessibility

- Tab through cards
- Enter on focused card navigates to detail view
- Tab to "New Budget" button
- Focus indicators clearly visible on cards

---

## Data Refresh

### When to Refetch
- On page load
- On window focus (React Query default)
- After returning from wizard or detail page

### React Query Structure
```typescript
// Fetch all budgets
const { data, isLoading, error } = useQuery({
  queryKey: ['budgets'],
  queryFn: fetchBudgets
});
```

---

## Future Enhancements (Out of Scope)

These are potential improvements not included in MVP:

- **Filtering:** Show only locked, only unlocked, or specific year
- **Search:** Find budget by month/year
- **Year grouping:** Group cards by year with headers
- **Quick actions:** Delete unlocked budget directly from card
- **Comparison:** Compare two budgets side by side

---

*Last updated: December 2024*
