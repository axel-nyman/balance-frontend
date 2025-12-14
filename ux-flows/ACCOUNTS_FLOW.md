# Balance — Accounts UX Flow

This document defines the user experience for managing bank accounts at `/accounts`.

---

## Overview

The Accounts page allows users to:
- View all bank accounts with current balances
- Create new accounts
- Edit account details (name, description)
- Update account balances manually
- View balance history
- Delete accounts (with restrictions)

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Accounts                                      [+ New Account]  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Total Balance: 12 450,00 kr                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Name        │ Description     │ Balance      │ Actions    │  │
│  │─────────────│─────────────────│──────────────│────────────│  │
│  │ Checking    │ Main account    │  3 200,00 kr │ [✏️] [🗑️]  │  │
│  │ Savings     │ Emergency fund  │  8 500,00 kr │ [✏️] [🗑️]  │  │
│  │ Joint       │ Shared expenses │    750,00 kr │ [✏️] [🗑️]  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  💡 Click any row to view balance history                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Header Section

### Elements
- **Page title:** "Accounts"
- **New Account button:** Primary action, top right

---

## Summary Card

Displays aggregate information:

```
┌─────────────────────────────────────┐
│  Total Balance: 12 450,00 kr        │
│  3 accounts                         │
└─────────────────────────────────────┘
```

- **Total Balance:** Sum of all account balances
- **Account count:** Number of active accounts

---

## Accounts Table

### Columns

| Column | Content | Notes |
|--------|---------|-------|
| Name | Account name | Primary identifier |
| Description | Optional description | Secondary info, can be empty |
| Balance | Current balance | Formatted as currency |
| Actions | Action menu | Dropdown or icon buttons |

### Sorting
- Default sort: Alphabetical by name
- Optional: Allow sorting by balance (stretch goal)

### Row Interaction

**Row Click (anywhere on Name, Description, or Balance):**
- Opens the Balance History drawer for that account
- Row should have hover state to indicate clickability

### Row Actions

Each row has action buttons in the Actions column:

| Action | Display | Description |
|--------|---------|-------------|
| Edit | Icon button (pencil) | Open edit modal (name, description only) |
| Delete | Icon button (trash) | Delete account (with confirmation) |

**Note:** "Update Balance" is accessed from within the Balance History drawer, not from the table row. This keeps balance-related actions in context.

---

## Empty State

When no accounts exist:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    📭                                           │
│                                                                 │
│            No accounts yet                                      │
│                                                                 │
│    Create your first bank account to start tracking             │
│    your finances.                                               │
│                                                                 │
│                   [+ Create Account]                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Create Account Modal

Triggered by: "New Account" button

```
┌─────────────────────────────────────┐
│  New Account                   [X]  │
│  ───────────────────────────────    │
│                                     │
│  Name *                             │
│  [________________________]         │
│                                     │
│  Description                        │
│  [________________________]         │
│                                     │
│  Initial Balance                    │
│  [____________0.00________]         │
│                                     │
│           [Cancel]  [Create]        │
└─────────────────────────────────────┘
```

### Fields

| Field | Required | Validation | Notes |
|-------|----------|------------|-------|
| Name | Yes | Non-empty, unique | Must not match existing account |
| Description | No | — | Optional context |
| Initial Balance | No | Number ≥ 0 | Defaults to 0.00 |

### Behavior
- Form validation on submit
- API call: `POST /api/bank-accounts`
- On success: Close modal, show toast "Account created", refresh list
- On error: Show inline error (e.g., "Account name already exists")

---

## Edit Account Modal

Triggered by: "Edit" action in row menu

```
┌─────────────────────────────────────┐
│  Edit Account                  [X]  │
│  ───────────────────────────────    │
│                                     │
│  Name *                             │
│  [_______Checking___________]       │
│                                     │
│  Description                        │
│  [_______Main account_______]       │
│                                     │
│           [Cancel]  [Save]          │
└─────────────────────────────────────┘
```

### Fields

| Field | Required | Validation | Notes |
|-------|----------|------------|-------|
| Name | Yes | Non-empty, unique (excluding self) | Can rename |
| Description | No | — | Can update or clear |

**Note:** Balance is NOT editable here. Use "Update Balance" for that.

### Behavior
- Pre-filled with current values
- API call: `PUT /api/bank-accounts/:id`
- On success: Close modal, show toast "Account updated", refresh list
- On error: Show inline error

---

## Update Balance Modal

Triggered by: "Update Balance" button in Balance History drawer

```
┌─────────────────────────────────────┐
│  Update Balance                [X]  │
│  ───────────────────────────────    │
│                                     │
│  Checking Account                   │
│  Current Balance: 3 200,00 kr       │
│                                     │
│  New Balance *                      │
│  [________________________]         │
│                                     │
│  Date *                             │
│  [______Today's date______]         │
│                                     │
│  Comment                            │
│  [________________________]         │
│                                     │
│           [Cancel]  [Update]        │
└─────────────────────────────────────┘
```

### Fields

| Field | Required | Validation | Notes |
|-------|----------|------------|-------|
| New Balance | Yes | Number (can be negative) | New account balance |
| Date | Yes | Not in future | When this balance was recorded |
| Comment | No | — | Optional note (e.g., "Reconciled with bank statement") |

### Display Elements
- Account name (read-only, for context)
- Current balance (read-only, for reference)

### Behavior
- Date defaults to today
- API call: `POST /api/bank-accounts/:id/balance`
- Creates a MANUAL balance history entry
- On success: Close modal, show toast "Balance updated", refresh list
- On error: Show inline error (e.g., "Date cannot be in the future")

---

## Balance History Drawer

Triggered by: Clicking anywhere on an account row (name, description, or balance columns)

Slides in from the side (right or left, flexible).

```
┌──────────────────────────────────────────┐
│  Balance History                    [X]  │
│  Checking Account                        │
│  Current Balance: 3 200,00 kr            │
│                                          │
│                      [Update Balance]    │
│  ────────────────────────────────────    │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Mar 15, 2025                       │  │
│  │ 3 200,00 kr  (+500,00 kr)          │  │
│  │ 🔵 MANUAL                          │  │
│  │ "Paycheck deposited"               │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Mar 1, 2025                        │  │
│  │ 2 700,00 kr  (+200,00 kr)          │  │
│  │ 🟢 AUTOMATIC — March 2025 Budget   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Feb 15, 2025                       │  │
│  │ 2 500,00 kr  (+2 500,00 kr)        │  │
│  │ 🔵 MANUAL                          │  │
│  │ "Initial balance"                  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [Load More]                             │
│                                          │
└──────────────────────────────────────────┘
```

### History Entry Display

Each entry shows:
- **Date:** When the balance change occurred
- **Balance:** Balance after this change
- **Change amount:** How much changed (+X kr or -X kr)
- **Source badge:** MANUAL or AUTOMATIC
- **Comment:** If provided (MANUAL entries only)
- **Budget link:** If AUTOMATIC, shows which budget caused it

### Source Indicators

| Source | Indicator | Meaning |
|--------|-----------|---------|
| MANUAL | 🔵 Blue badge | User manually updated balance |
| AUTOMATIC | 🟢 Green badge | Budget lock updated balance |

### Pagination
- API returns paginated results (20 per page default)
- "Load More" button at bottom fetches next page
- Sorted by date descending (newest first)

### Behavior
- Opens as slide-out drawer (doesn't navigate away from page)
- Close via X button, clicking outside, or Escape key
- API call: `GET /api/bank-accounts/:id/balance-history`

### Update Balance from Drawer
- Clicking "Update Balance" opens the Update Balance modal
- Modal appears on top of the drawer (drawer stays open behind)
- After successful balance update:
  - Modal closes
  - Drawer refreshes to show new history entry at top
  - Account list in background also refreshes

---

## Delete Account

Triggered by: "Delete" action in row menu

### Confirmation Modal

```
┌─────────────────────────────────────┐
│  Delete Account                [X]  │
│  ───────────────────────────────    │
│                                     │
│  Are you sure you want to delete    │
│  "Checking"?                        │
│                                     │
│  This action cannot be undone.      │
│  Balance history will be preserved. │
│                                     │
│           [Cancel]  [Delete]        │
└─────────────────────────────────────┘
```

### Validation
- Cannot delete account if used in an **unlocked** budget
- Can delete account used only in locked budgets

### Error State

If account is linked to unlocked budget:

```
┌─────────────────────────────────────┐
│  Cannot Delete Account         [X]  │
│  ───────────────────────────────    │
│                                     │
│  "Checking" is used in an unlocked  │
│  budget (March 2025).               │
│                                     │
│  Lock or delete that budget first,  │
│  or remove this account from it.    │
│                                     │
│                          [OK]       │
└─────────────────────────────────────┘
```

### Behavior
- API call: `DELETE /api/bank-accounts/:id`
- On success: Close modal, show toast "Account deleted", refresh list
- On error: Show error modal explaining why deletion failed

---

## Error Handling

### Loading State
- Skeleton loader for table while fetching
- Skeleton for summary card

### API Errors
- Toast notifications for failed operations
- Modals show inline errors for validation issues

### Network Failure
- Toast with retry option

---

## Responsive Behavior

### Desktop (≥1024px)
- Full table layout
- Drawer slides from right side
- Modals centered

### Tablet (768px - 1023px)
- Full table layout
- Drawer may be wider percentage of screen

### Mobile (<768px)

**Table becomes card list:**
```
┌─────────────────────────────────────┐
│  Checking                           │  ← Tap card to open history
│  Main account                       │
│  3 200,00 kr                        │
│                        [✏️]  [🗑️]   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Savings                            │  ← Tap card to open history
│  Emergency fund                     │
│  8 500,00 kr                        │
│                        [✏️]  [🗑️]   │
└─────────────────────────────────────┘
```

- Each account is a card
- Tapping the card body opens balance history drawer
- Action icons (edit, delete) at bottom of card (tapping these does NOT open history)
- Drawer becomes full-screen or bottom sheet
- Modals become full-screen

---

## Keyboard Accessibility

- Tab through table rows and action buttons
- Enter on focused row opens balance history drawer
- Enter on focused action button activates that action
- Escape to close modals/drawer
- Action buttons should stop propagation (don't open drawer)

---

## Data Refresh

### When to Refetch
- On page load
- After create/edit/delete/balance update
- On window focus (React Query default)

### React Query Structure
```typescript
// List accounts
const { data, isLoading } = useQuery({
  queryKey: ['accounts'],
  queryFn: fetchAccounts
});

// Balance history (only fetched when drawer open)
const { data: history } = useQuery({
  queryKey: ['account-history', accountId],
  queryFn: () => fetchBalanceHistory(accountId),
  enabled: isDrawerOpen
});
```

---

*Last updated: December 2024*
