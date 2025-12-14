# Update #004: Remove Inline Editing from Budget Detail Flow

**Purpose:** Simplify to modal-only editing for implementation simplicity  
**Files Affected:** `BUDGET_DETAIL_FLOW.md`  
**Priority:** Medium (clarifies implementation approach)

---

## Design Decision

**Decision:** Use modal-based editing only, removing inline editing support.

**Rationale:**
- Reduces implementation complexity significantly
- Consistent behavior for all edit operations
- Form validation is cleaner in a modal
- Mobile experience is better with modals (inline editing is awkward on touch devices)

---

## Changes Required

### 1. Remove Inline Editing Section

**Location:** Lines 225-247

**Delete this entire section:**
```markdown
## Editing Items (Unlocked Budget)

Two editing patterns are supported:

### Pattern 1: Inline Editing
- Click directly on a cell (name, amount, account)
- Cell becomes editable input
- Save on blur or Enter
- Cancel on Escape
- Best for quick single-field changes

### Pattern 2: Modal Editing
- Click "Edit" button in actions column
- Opens modal with full form
- All fields editable at once
- Save and Cancel buttons
- Best for editing multiple fields

### Which to Use?
- Both options available for flexibility
- Inline for speed, modal for comprehensive edits
- Consistent with wizard behavior
```

**Replace with:**
```markdown
## Editing Items (Unlocked Budget)

All editing is done via modals for consistency and simplicity:

- Click "Edit" button in the actions column
- Opens modal with full form
- All fields editable at once
- Save and Cancel buttons
- Form validation before save
- Toast notification on success/error
- Modal closes on successful save
```

---

### 2. Update Income Table Columns

**Location:** Lines 103-108

**Replace:**
```markdown
| Column | Type | Notes |
|--------|------|-------|
| Name | Text (editable) | Click to edit inline |
| Amount | Currency (editable) | Click to edit inline |
| Bank Account | Dropdown (editable) | Click to change |
| Actions | Buttons | Edit (opens modal), Delete |
```

**With:**
```markdown
| Column | Type | Notes |
|--------|------|-------|
| Name | Text | Display only, edit via modal |
| Amount | Currency | Display only, edit via modal |
| Bank Account | Text | Display only, edit via modal |
| Actions | Buttons | Edit (opens modal), Delete |
```

---

### 3. Update Expenses Table Columns

**Location:** Lines 130-136

**Replace:**
```markdown
| Column | Type | Notes |
|--------|------|-------|
| Name | Text (editable) | Click to edit inline |
| Amount | Currency (editable) | Click to edit inline |
| Bank Account | Dropdown (editable) | Click to change |
| Manual | Checkbox (editable) | Toggle directly |
| Actions | Buttons | Edit (opens modal), Delete |
```

**With:**
```markdown
| Column | Type | Notes |
|--------|------|-------|
| Name | Text | Display only, edit via modal |
| Amount | Currency | Display only, edit via modal |
| Bank Account | Text | Display only, edit via modal |
| Manual | Icon | Visual indicator only, edit via modal |
| Actions | Buttons | Edit (opens modal), Delete |
```

---

### 4. Update Savings Table Columns

**Location:** Lines 161-166

**Replace:**
```markdown
| Column | Type | Notes |
|--------|------|-------|
| Name | Text (editable) | Click to edit inline |
| Amount | Currency (editable) | Click to edit inline |
| Bank Account | Dropdown (editable) | Click to change |
| Actions | Buttons | Edit (opens modal), Delete |
```

**With:**
```markdown
| Column | Type | Notes |
|--------|------|-------|
| Name | Text | Display only, edit via modal |
| Amount | Currency | Display only, edit via modal |
| Bank Account | Text | Display only, edit via modal |
| Actions | Buttons | Edit (opens modal), Delete |
```

---

### 5. Add Edit Modals Section

**Location:** After the "Adding Items" section (around line 300)

**Add new section:**
```markdown
---

## Edit Modals (Unlocked Budget)

### Edit Income Modal
```
┌─────────────────────────────────────┐
│  Edit Income                   [X]  │
│  ───────────────────────────────    │
│  Name                               │
│  [________Salary______________]     │
│                                     │
│  Amount                             │
│  [________4500________________]     │
│                                     │
│  Bank Account                       │
│  [Checking               ▼]         │
│                                     │
│           [Cancel]  [Save]          │
└─────────────────────────────────────┘
```

- Pre-filled with current values
- API call: `PUT /api/budgets/{budgetId}/income/{id}`
- On success: Close modal, show toast, refresh data

### Edit Expense Modal
```
┌─────────────────────────────────────┐
│  Edit Expense                  [X]  │
│  ───────────────────────────────    │
│  Name                               │
│  [________Rent________________]     │
│                                     │
│  Amount                             │
│  [________8000________________]     │
│                                     │
│  Bank Account                       │
│  [Checking               ▼]         │
│                                     │
│  ☑ Manual payment required          │
│                                     │
│           [Cancel]  [Save]          │
└─────────────────────────────────────┘
```

- Pre-filled with current values
- API call: `PUT /api/budgets/{budgetId}/expenses/{id}`
- On success: Close modal, show toast, refresh data

### Edit Savings Modal
Same structure as Edit Income modal.

- Pre-filled with current values
- API call: `PUT /api/budgets/{budgetId}/savings/{id}`
- On success: Close modal, show toast, refresh data
```

---

### 6. Update Row Click Behavior

Since rows are no longer clickable for inline editing, clarify that rows are NOT clickable (unlike the Accounts page):

**Add note after each table:**
```markdown
**Note:** Table rows are not clickable. Use the Edit button in the Actions column to modify items.
```

---

## Impact on Epic 6

This simplification means Epic 6 stories can be simpler:

- No need for `EditableCell` component
- No inline validation logic
- No blur/focus handlers for save/cancel
- Single consistent editing pattern: modal

Epic 6 should only implement:
- `EditIncomeModal`
- `EditExpenseModal`
- `EditSavingsModal`

Each modal reuses the same form structure as the corresponding Add modal.

---

*Created: [Current Date]*
