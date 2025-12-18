# Balance — Budget Creation Wizard UX Flow

This document defines the complete user experience for creating a new monthly budget through the wizard flow.

---

## Overview

The budget wizard is a multi-step guided flow that helps users create a complete monthly budget. It lives at `/budgets/new` and consists of 5 steps:

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Month/Year  →  2. Income  →  3. Expenses  →  4. Savings  →  5. Review  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Principles

- **Editable tables:** Income, expenses, and savings are displayed as editable table rows (not forms that create items one at a time)
- **Inline editing:** Users can click any cell to edit values directly
- **Running totals:** Budget balance is always visible so users know if they're on track
- **Flexible navigation:** Users can move forward and backward between steps
- **No partial save:** Budget is only persisted when user completes the wizard and explicitly saves (from Review step)

---

## Step 1: Select Month/Year

### Purpose
Choose which month the budget is for.

### Default Behavior
- Pre-selects the **current month and year**
- If a budget already exists for the current month, pre-select the next month without a budget

### Validation Rules
- Cannot create a budget for a month/year that already has a budget
- Cannot create a budget for a month *older* than the most recent existing budget
  - Example: If March 2025 budget exists, user cannot create January 2025 budget
  - Example: If March 2025 budget exists, user CAN create February 2025 budget (fills a gap)
- Month must be 1-12
- Year must be reasonable (e.g., 2020-2100)

### UI Elements
- Month dropdown (January - December)
- Year dropdown or input
- Validation error message area
- "Next" button (disabled if validation fails)

### Edge Cases
- If no budgets exist yet, any month/year is valid
- Show helpful message if selected month already has a budget

---

## Step 2: Add Income

### Purpose
Define expected income for the month and which accounts it will arrive in.

### Layout
Editable table with the following columns:

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| Name | Text input | Yes | e.g., "Salary", "Freelance payment" |
| Amount | Number input | Yes | Must be positive |
| Bank Account | Dropdown | Yes | List of active bank accounts |
| Actions | Buttons | — | Delete row button |

### Features

**Add New Row:**
- "Add Income" button below the table
- Adds empty row that user fills in

**Copy from Last Budget:**
- "Copy from last budget" button (only shown if a previous budget exists)
- Opens a modal/drawer showing income items from the most recent budget
- User can select which items to copy (checkboxes)
- Selected items are added to the table with their previous values
- User can then edit amounts/accounts as needed in the table

**Running Total:**
- Display "Total Income: X XXX,XX kr" below the table
- Updates in real-time as user edits

### Validation
- At least one income entry recommended (but not required to proceed)
- Each row must have: non-empty name, positive amount, selected bank account
- Show inline validation errors on incomplete rows

### Navigation
- "Back" button → Returns to Step 1
- "Next" button → Proceeds to Step 3
- Can proceed with empty table (no income), but this limits usefulness

---

## Step 3: Add Expenses

### Purpose
Define expected expenses for the month. Combines recurring expense templates and manual one-off expenses in a single step.

### Layout
Two sections stacked vertically:

```
┌─────────────────────────────────────────────┐
│  Quick Add from Recurring Expenses          │
│  ┌───────────────────────────────────────┐  │
│  │ DUE THIS MONTH                        │  │
│  │ ┌─────────────────────────────────┐   │  │
│  │ │ [+] Rent — 15 000 kr (Monthly)  │   │  │
│  │ │ [+] Electric — 1 200 kr (Monthly)│  │  │
│  │ └─────────────────────────────────┘   │  │
│  │                                       │  │
│  │ ALL RECURRING EXPENSES                │  │
│  │ ┌─────────────────────────────────┐   │  │
│  │ │ [+] Car Insurance — 6 000 kr (Bia.)│ │  │
│  │ │ [+] Amazon Prime — 1 400 kr (Year.)│ │  │
│  │ └─────────────────────────────────┘   │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Budget Expenses                            │
│  ┌───────────────────────────────────────┐  │
│  │ Name    | Amount    | Account | Manual |│  │
│  │ --------|-----------|---------|--------|│  │
│  │ Rent    | 15 000 kr | Check ▼ | ☑      |│  │
│  │ Electric| 1 200 kr  | Check ▼ | ☐      |│  │
│  │ Groceries| 4 000 kr | Check ▼ | ☐      |│  │
│  └───────────────────────────────────────┘  │
│  [+ Add Expense]                            │
│                                             │
│  Total Expenses: 20 200,00 kr               │
└─────────────────────────────────────────────┘
```

### Quick Add Section

**Due This Month (Recommended):**
- Shows recurring expense templates where `isDue = true`
- Based on `lastUsedDate` and `recurrenceInterval` calculation
- Each template shows: name, default amount, interval
- Click "+" button to instantly add to budget expenses table

**All Recurring Expenses:**
- Shows remaining templates (not due)
- Same format and interaction as above
- Allows adding expenses ahead of schedule if desired

**Quick Add Behavior:**
- Clicking "+" creates a new row in the Budget Expenses table
- Row is pre-filled with template's `name`, `amount`, `isManual` values
- Bank Account column is **empty** (user must select)
- Row is linked to the recurring expense template (`recurringExpenseId`)
- Template disappears from Quick Add section once added (prevent duplicates)

### Budget Expenses Table

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| Name | Text input | Yes | Pre-filled from template or user-entered |
| Amount | Number input | Yes | Editable, must be positive |
| Bank Account | Dropdown | Yes | **Must be selected before proceeding** |
| Manual Payment | Checkbox | No | Pre-filled from template, editable |
| Actions | Buttons | — | Delete row button |

### Features

**Add Manual Expense:**
- "Add Expense" button below table
- Adds empty row for one-off expenses (not linked to template)

**Inline Editing:**
- All cells are directly editable
- Click to edit, changes save on blur or Enter
- Amount from recurring template can be adjusted for this month

**Running Total:**
- Display "Total Expenses: X XXX,XX kr" below table

### Validation
- Each row must have: non-empty name, positive amount, selected bank account
- **Cannot proceed to next step if any row is missing a bank account**
- Show inline validation errors on incomplete rows

### Navigation
- "Back" button → Returns to Step 2 (Income)
- "Next" button → Proceeds to Step 4 (Savings)
- "Next" is disabled if any expense row is missing required fields

---

## Step 4: Add Savings

### Purpose
Allocate remaining money to savings accounts.

### Layout
Editable table with the following columns:

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| Name | Text input | Yes | e.g., "Emergency Fund", "Vacation" |
| Amount | Number input | Yes | Must be positive |
| Bank Account | Dropdown | Yes | Target savings account |
| Actions | Buttons | — | Delete row button |

### Features

**Add New Row:**
- "Add Savings" button below table
- Adds empty row

**Copy from Last Budget:**
- "Copy from last budget" button (if previous budget exists)
- Opens modal showing savings items from most recent budget
- Select items to copy, then edit as needed

**Running Balance Display:**
```
┌─────────────────────────────────────┐
│  Income:        50 000,00 kr        │
│  Expenses:     -32 000,00 kr        │
│  Savings:      -15 000,00 kr        │
│  ─────────────────────────          │
│  Remaining:      3 000,00 kr        │
│                                     │
│  ⚠ Budget must equal 0 kr to lock  │
└─────────────────────────────────────┘
```

- Shows breakdown: Income, Expenses, Savings, Remaining
- Updates in real-time
- When Remaining = 0,00 kr, show success indicator (checkmark, green color)
- When Remaining ≠ 0,00 kr, show warning (but don't block progress)

### Validation
- Each row must have: non-empty name, positive amount, selected bank account
- Budget does NOT need to balance to proceed to Review

### Navigation
- "Back" button → Returns to Step 3 (Expenses)
- "Next" button → Proceeds to Step 5 (Review)
- Can proceed even if budget doesn't balance (will handle in Review)

---

## Step 5: Review & Complete

### Purpose
Final review of the complete budget with ability to edit, save, and optionally lock.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Budget: March 2025                                     │
│                                                         │
│  ▼ Income                            Total: 50 000 kr  │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Name      | Amount      | Account    | Actions  │    │
│  │ Salary    | 45 000,00 kr| Checking   | [Edit][Del]│   │
│  │ Side gig  |  5 000,00 kr| Checking   | [Edit][Del]│   │
│  │                                   | [+ Add]     │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ▶ Expenses (collapsed)              Total: 32 000 kr  │
│                                                         │
│  ▶ Savings (collapsed)               Total: 18 000 kr  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Income:        50 000,00 kr                    │    │
│  │  Expenses:     -32 000,00 kr                    │    │
│  │  Savings:      -18 000,00 kr                    │    │
│  │  ─────────────────────────                      │    │
│  │  Balance:           0,00 kr  ✓                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [Cancel]                      [Save Budget] [Lock]     │
└─────────────────────────────────────────────────────────┘
```

### Collapsible Sections

Each category (Income, Expenses, Savings) is a collapsible accordion:
- **Collapsed state:** Shows category name and total only
- **Expanded state:** Shows full editable table (same as wizard steps)
- Default: All collapsed for quick overview
- User can expand any section to review/edit details

### Editing in Review

- Same table format and editing capabilities as wizard steps
- Can add new items via "Add" button within each section
- Can edit existing items inline
- Can delete items
- Running balance updates in real-time

### Action Buttons

**Cancel:**
- Returns to `/budgets` list
- Shows confirmation dialog: "Discard this budget? All changes will be lost."
- If confirmed, no budget is created

**Save Budget:**
- Always enabled
- Creates/saves the budget in UNLOCKED state
- Navigates to Budget Detail page (`/budgets/:id`)
- Budget can be edited later from the detail page

**Lock:**
- Only enabled when balance = 0,00 kr
- Disabled with tooltip when unbalanced: "Budget must balance to 0 kr to lock"
- When clicked:
  - Saves the budget
  - Locks the budget (sets status to LOCKED)
  - Triggers todo list generation
  - Triggers account balance updates
  - Navigates to Budget Detail page (`/budgets/:id`)
  - Todo list button is visible on detail page

### Navigation
- "Back" button → Returns to Step 4 (Savings)
- Wizard step indicators still visible, can click to jump to any step

---

## Progress Indicator

A visual progress indicator is shown throughout the wizard:

```
┌─────────────────────────────────────────────────────────┐
│  ●────●────●────○────○                                  │
│  Month  Income  Expenses  Savings  Review               │
└─────────────────────────────────────────────────────────┘
```

- Completed steps: Filled circles
- Current step: Filled circle (highlighted)
- Future steps: Empty circles
- Clickable: Users can click any step to navigate directly (backward only, or forward if current step is valid)

---

## Abandonment Handling

### During Wizard (Steps 1-4)
- If user navigates away (clicks nav link, browser back, closes tab)
- Show browser confirmation: "You have unsaved changes. Leave anyway?"
- If confirmed: All wizard data is lost, no budget created
- If cancelled: Stay on current step

### At Review Step (Step 5)
- Same abandonment warning applies
- User must explicitly "Save Budget" or "Lock" to persist data

---

## Data Flow Summary

### What's Stored During Wizard
- All data is held in **client-side state only** until Save/Lock
- No API calls to create budget items during wizard steps
- This keeps the flow simple and allows easy cancellation

### On "Save Budget"
1. `POST /api/budgets` — Create budget (month, year)
2. For each income: `POST /api/budgets/:id/income`
3. For each expense: `POST /api/budgets/:id/expenses`
4. For each savings: `POST /api/budgets/:id/savings`
5. Navigate to `/budgets/:id`

### On "Lock"
1. Same as Save Budget (steps 1-4)
2. `PUT /api/budgets/:id/lock`
3. Backend handles: todo generation, balance updates, recurring expense lastUsedDate updates
4. Navigate to `/budgets/:id`

---

## Edge Cases & Error Handling

### No Bank Accounts Exist
- Show message on Step 2: "You need at least one bank account to create a budget."
- Provide link to create account: "Create a bank account"
- Block wizard progression until accounts exist

### No Recurring Expenses Exist
- Quick Add section shows empty state: "No recurring expense templates yet."
- Link to create templates (optional, not blocking)
- User can still add manual expenses

### API Errors on Save
- Show toast with error message
- Keep user on Review step
- Allow retry

### Concurrent Budget Creation
- If another budget is created for the same month while user is in wizard
- Save will fail with "Budget already exists for this month"
- Show error, user must choose different month

---

## Responsive Behavior

### Desktop (≥1024px)
- Full table layouts with all columns visible
- Side-by-side layout for Quick Add section and Expenses table (if space permits)

### Tablet (768px - 1023px)
- Full table layouts
- Stacked layout for Quick Add and Expenses sections

### Mobile (<768px)
- Tables become card-based layouts
- Each item is a card showing all fields stacked vertically
- Edit mode: Tap card to expand inline editing
- Quick Add: List of tappable items
- Progress indicator: Compact (numbers or minimal dots)

---

## Accessibility Considerations

- All form inputs have associated labels
- Progress indicator has aria-labels for screen readers
- Tab navigation works through all interactive elements
- Focus management: Focus moves to first input when entering new step
- Error messages are announced to screen readers
- Keyboard shortcuts: Enter to proceed, Escape to go back (optional)

---

*Last updated: December 2024*
