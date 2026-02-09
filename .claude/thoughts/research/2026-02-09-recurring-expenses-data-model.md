---
date: 2026-02-09T12:00:00+01:00
researcher: Claude
git_commit: a94d5782afb519240b0c5ec258fe1a6059efafd6
branch: main
repository: balance-frontend
topic: "Recurring Expenses Data Model and Data Flow"
tags: [research, codebase, recurring-expenses, data-model, api, wizard, budget]
status: complete
last_updated: 2026-02-09
last_updated_by: Claude
---

# Research: Recurring Expenses Data Model and Data Flow

**Date**: 2026-02-09
**Researcher**: Claude
**Git Commit**: a94d5782afb519240b0c5ec258fe1a6059efafd6
**Branch**: main
**Repository**: balance-frontend

## Research Question
Look into the data model regarding recurring expenses, everywhere it's used in the app and how its data flows between layers.

## Summary

Recurring expenses are **templates** for regular expenses (rent, subscriptions, insurance) that users manage independently and then quick-add into monthly budgets via the wizard. The data model consists of a standalone `RecurringExpense` entity and a one-way reference link (`recurringExpenseId`) on `BudgetExpense` items. Data flows through four layers: API types → API client functions → React Query hooks → UI components. The recurring expense is used in two primary contexts: its own CRUD page (`/recurring-expenses`) and the budget wizard's expense step (Step 3).

## Detailed Findings

### 1. Type Definitions (`src/api/types.ts`)

**Enums (line 6):**
```typescript
export type RecurrenceInterval = 'MONTHLY' | 'QUARTERLY' | 'BIANNUALLY' | 'YEARLY'
```

**RecurringExpense entity (lines 79-89):**
```typescript
export interface RecurringExpense {
  id: string
  name: string
  amount: number
  recurrenceInterval: RecurrenceInterval
  isManual: boolean          // If true, generates PAYMENT todo when budget locks
  lastUsedDate: string | null // Set by backend when a budget using this template is locked
  nextDueDate: string | null  // Calculated by backend: lastUsedDate + interval
  isDue: boolean              // Calculated by backend: nextDueDate <= today
  createdAt: string
}
```

**Request types (lines 95-107):**
- `CreateRecurringExpenseRequest`: `{ name, amount, recurrenceInterval, isManual }` — no computed fields
- `UpdateRecurringExpenseRequest`: identical shape to create

**List response wrapper (lines 91-93):**
```typescript
export interface RecurringExpenseListResponse {
  expenses: RecurringExpense[]
}
```

**Cross-reference on BudgetExpense (lines 146-154):**
```typescript
export interface BudgetExpense {
  id: string
  name: string
  amount: number
  bankAccount: BankAccountRef
  recurringExpenseId: string | null  // Link back to template
  deductedAt: string | null
  isManual: boolean
}
```

**Budget expense request types:**
- `CreateBudgetExpenseRequest` (lines 193-200): includes `recurringExpenseId?: string` (optional)
- `UpdateBudgetExpenseRequest` (lines 202-208): does **not** include `recurringExpenseId` — it is immutable after creation

### 2. API Client Layer (`src/api/recurring-expenses.ts`)

Four functions mapping to REST endpoints via shared helpers from `src/api/client.ts`:

| Function | HTTP | Endpoint | Returns |
|----------|------|----------|---------|
| `getRecurringExpenses()` | GET | `/recurring-expenses` | `RecurringExpenseListResponse` |
| `createRecurringExpense(data)` | POST | `/recurring-expenses` | `RecurringExpense` |
| `updateRecurringExpense(id, data)` | PUT | `/recurring-expenses/{id}` | `RecurringExpense` |
| `deleteRecurringExpense(id)` | DELETE | `/recurring-expenses/{id}` | `void` |

Error messages mapped in `src/api/client.ts:4-17` include:
- `"Recurring expense with this name already exists"` → friendly duplicate name message
- `"Recurring expense not found"` → friendly not-found message

### 3. React Query Hooks (`src/hooks/use-recurring-expenses.ts`)

| Hook | Type | Query Key | Invalidation |
|------|------|-----------|-------------|
| `useRecurringExpenses()` | `useQuery` | `['recurring-expenses']` | — |
| `useCreateRecurringExpense()` | `useMutation` | — | `['recurring-expenses']` |
| `useUpdateRecurringExpense()` | `useMutation` | — | `['recurring-expenses']` |
| `useDeleteRecurringExpense()` | `useMutation` | — | `['recurring-expenses']` |

Query keys defined in `src/hooks/query-keys.ts:6-8`. All mutations invalidate the same key to trigger list refetch.

### 4. Form Validation (`src/components/recurring-expenses/schemas.ts`)

Zod schemas for create and update (identical):
- `name`: `z.string().min(1)` — required
- `amount`: `z.number().positive()` — must be > 0
- `recurrenceInterval`: `z.enum(['MONTHLY', 'QUARTERLY', 'BIANNUALLY', 'YEARLY'])`
- `isManual`: `z.boolean()`

Inferred TypeScript types: `CreateRecurringExpenseFormData`, `UpdateRecurringExpenseFormData`.

### 5. Recurring Expenses Page (`/recurring-expenses`)

**Page component (`src/pages/RecurringExpensesPage.tsx`):**
- Fetches data via `useRecurringExpenses()`
- Manages three pieces of UI state: `isCreateModalOpen` (boolean), `editingExpense` (RecurringExpense | null), `deletingExpense` (RecurringExpense | null)
- Renders `RecurringExpensesList`, `CreateRecurringExpenseModal`, `EditRecurringExpenseModal`, `DeleteRecurringExpenseDialog`

**List component (`src/components/recurring-expenses/RecurringExpensesList.tsx`):**
- Sorts expenses: due (score 0) → never used (score 1) → not due (score 2), then by `nextDueDate` ascending
- Renders desktop `Table` view and mobile card view (CSS-toggled)
- Handles loading (skeleton), error (retry), and empty states
- Each item rendered via `RecurringExpenseRow` (desktop) or `RecurringExpenseCard` (mobile)

**DueStatusIndicator (`src/components/recurring-expenses/DueStatusIndicator.tsx`):**
Three visual states using colored dots:
- `lastUsedDate === null` → yellow dot, "Never used"
- `isDue === true` → red dot, "Due now"
- Otherwise → green dot, formatted `nextDueDate` as "Mon YYYY"

**Create modal (`src/components/recurring-expenses/CreateRecurringExpenseModal.tsx`):**
- React Hook Form with Zod resolver
- Default values: empty name, undefined amount, `'MONTHLY'` interval, `isManual: false`
- On success: toast, reset form, close modal
- Inline error display from mutation

**Edit modal (`src/components/recurring-expenses/EditRecurringExpenseModal.tsx`):**
- Opens when `expense !== null`
- `useEffect` resets form fields when expense prop changes
- Shows read-only metadata section: "Last used" date and "Next due" date
- Same form fields as create

**Delete dialog (`src/components/recurring-expenses/DeleteRecurringExpenseDialog.tsx`):**
- Uses shared `ConfirmDialog` component
- Description states deletion doesn't affect existing budget expenses
- Destructive variant styling

### 6. Budget Wizard Integration (Step 3: Expenses)

**Wizard expense item type (`src/components/wizard/types.ts:19-28`):**
```typescript
export interface WizardExpenseItem {
  id: string              // Client-side UUID
  name: string
  amount: number
  bankAccountId: string
  bankAccountName: string
  isManual: boolean
  recurringExpenseId?: string  // Optional link to template
  deductedAt?: string
}
```

**Conversion to API request (`src/components/wizard/types.ts:107-116`):**
`toExpenseRequest()` passes `recurringExpenseId` through to `CreateBudgetExpenseRequest`.

**StepExpenses component (`src/components/wizard/steps/StepExpenses.tsx`):**

1. Fetches recurring expenses via `useRecurringExpenses()`
2. Tracks which recurring IDs are already added using a `Set<string>` built from `state.expenseItems[].recurringExpenseId`
3. Filters out already-added recurring expenses from the quick-add area
4. Sorts available: due first, then alphabetically
5. Separates into `dueExpenses` and `otherExpenses` sections
6. `handleAddRecurring()` creates a `WizardExpenseItem` copying `name`, `amount`, `isManual`, and setting `recurringExpenseId: recurring.id`
7. Bank account (`bankAccountId`) is left empty — user must select it

**Visual indicators in wizard:**
- Desktop table rows: `bg-savings-muted/50` background + `Repeat` icon (lucide) for items with `recurringExpenseId`
- Mobile cards: `isRecurring={!!item.recurringExpenseId}` prop → `Repeat` icon in `WizardItemCard`

**Budget submission (`src/components/wizard/WizardShell.tsx:67-109`):**
Sequential creation: create budget → loop income items → loop expense items (each POSTed with `recurringExpenseId`) → loop savings items.

### 7. Budget Detail Page (Post-Creation)

**BudgetDetailPage (`src/pages/BudgetDetailPage.tsx:27-34`):**
```typescript
function mapExpensesToSectionItems(expenses: BudgetExpense[]) {
  return expenses.map((item) => ({
    id: item.id,
    label: item.name,
    amount: item.amount,
    sublabel: item.bankAccount.name,
  }))
}
```
The `recurringExpenseId` is **not passed through** to the display layer. Budget detail does not visually distinguish recurring-derived expenses from manual ones.

**ExpenseItemModal (`src/components/budget-detail/ExpenseItemModal.tsx`):**
Edit form includes `name`, `amount`, `bankAccountId`, `isManual` only. The `recurringExpenseId` is preserved on the backend but not shown or editable.

### 8. Todo List Connection

When a budget is locked, the backend:
1. Updates `lastUsedDate` on recurring expenses that were referenced by budget expense items
2. Generates `PAYMENT` todo items for budget expenses where `isManual: true`
3. Generates `TRANSFER` todo items for non-manual expenses

The `isManual` flag from `RecurringExpense` flows through: template → wizard item → budget expense → todo item type.

## Code References

### API Layer
- `src/api/types.ts:6` — `RecurrenceInterval` enum
- `src/api/types.ts:79-89` — `RecurringExpense` interface
- `src/api/types.ts:91-93` — `RecurringExpenseListResponse`
- `src/api/types.ts:95-100` — `CreateRecurringExpenseRequest`
- `src/api/types.ts:102-107` — `UpdateRecurringExpenseRequest`
- `src/api/types.ts:146-154` — `BudgetExpense` with `recurringExpenseId`
- `src/api/types.ts:193-200` — `CreateBudgetExpenseRequest` with optional `recurringExpenseId`
- `src/api/types.ts:202-208` — `UpdateBudgetExpenseRequest` (no `recurringExpenseId`)
- `src/api/recurring-expenses.ts` — CRUD API functions
- `src/api/client.ts:4-17` — Error message mapping

### React Query Layer
- `src/hooks/use-recurring-expenses.ts` — Query and mutation hooks
- `src/hooks/query-keys.ts:6-8` — Query key definition

### Recurring Expenses Page
- `src/pages/RecurringExpensesPage.tsx` — Page component
- `src/components/recurring-expenses/RecurringExpensesList.tsx` — List with sorting logic
- `src/components/recurring-expenses/RecurringExpenseRow.tsx` — Desktop row
- `src/components/recurring-expenses/RecurringExpenseCard.tsx` — Mobile card
- `src/components/recurring-expenses/DueStatusIndicator.tsx` — Due status display
- `src/components/recurring-expenses/CreateRecurringExpenseModal.tsx` — Create form
- `src/components/recurring-expenses/EditRecurringExpenseModal.tsx` — Edit form
- `src/components/recurring-expenses/DeleteRecurringExpenseDialog.tsx` — Delete confirmation
- `src/components/recurring-expenses/schemas.ts` — Zod validation

### Wizard Integration
- `src/components/wizard/types.ts:19-28` — `WizardExpenseItem` with `recurringExpenseId`
- `src/components/wizard/types.ts:107-116` — `toExpenseRequest()` conversion
- `src/components/wizard/steps/StepExpenses.tsx` — Quick-add flow
- `src/components/wizard/WizardShell.tsx:67-109` — Budget submission
- `src/components/wizard/WizardItemCard.tsx:106-111` — Recurring icon display

### Budget Detail
- `src/pages/BudgetDetailPage.tsx:27-34` — Expense mapping (strips `recurringExpenseId`)
- `src/components/budget-detail/ExpenseItemModal.tsx` — Edit modal (no `recurringExpenseId`)

### Routing & Navigation
- `src/routes.ts` — `/recurring-expenses` route
- `src/components/layout/Sidebar.tsx` — Navigation link

### Tests
- `src/components/recurring-expenses/RecurringExpensesList.test.tsx`
- `src/components/recurring-expenses/CreateRecurringExpenseModal.test.tsx`
- `src/components/recurring-expenses/EditRecurringExpenseModal.test.tsx`
- `src/components/recurring-expenses/DeleteRecurringExpenseDialog.test.tsx`
- `src/components/recurring-expenses/DueStatusIndicator.test.tsx`
- `src/pages/RecurringExpensesPage.test.tsx`
- `src/components/wizard/steps/StepExpenses.test.tsx`
- `src/test/mocks/handlers.ts` — MSW mock API handlers

## Architecture Documentation

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Recurring Expenses Page                         │
│                                                                     │
│  RecurringExpensesPage                                              │
│    ├── useRecurringExpenses() ──→ GET /api/recurring-expenses       │
│    ├── RecurringExpensesList (sort, display)                        │
│    ├── CreateRecurringExpenseModal                                  │
│    │     └── useCreateRecurringExpense() ──→ POST /api/recurring-  │
│    │                                          expenses              │
│    ├── EditRecurringExpenseModal                                    │
│    │     └── useUpdateRecurringExpense() ──→ PUT /api/recurring-   │
│    │                                          expenses/{id}         │
│    └── DeleteRecurringExpenseDialog                                 │
│          └── useDeleteRecurringExpense() ──→ DELETE /api/recurring- │
│                                               expenses/{id}         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     Budget Wizard (Step 3)                          │
│                                                                     │
│  StepExpenses                                                       │
│    ├── useRecurringExpenses() ──→ fetches templates                 │
│    ├── Filters out already-added (by recurringExpenseId)            │
│    ├── Quick-add cards (due first, then alphabetical)               │
│    └── handleAddRecurring() ──→ copies to WizardExpenseItem         │
│         ├── name, amount, isManual copied                           │
│         ├── recurringExpenseId set                                   │
│         └── bankAccountId left empty (user selects)                 │
│                                                                     │
│  WizardShell.handleSave()                                           │
│    └── for each expense: addExpense(budgetId, toExpenseRequest())   │
│         └── POST /api/budgets/{id}/expenses                        │
│              body includes recurringExpenseId                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     Budget Detail Page                              │
│                                                                     │
│  BudgetDetailPage                                                   │
│    ├── useBudget(id) ──→ GET /api/budgets/{id}                     │
│    │    └── response includes BudgetExpense[].recurringExpenseId    │
│    ├── mapExpensesToSectionItems() ── strips recurringExpenseId     │
│    └── ExpenseItemModal (edit) ── no recurringExpenseId field       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     Budget Lock (Backend)                           │
│                                                                     │
│  When budget locks:                                                 │
│    ├── Updates lastUsedDate on referenced recurring expenses        │
│    ├── Generates PAYMENT todos for isManual=true expenses           │
│    └── Generates TRANSFER todos for isManual=false expenses         │
│                                                                     │
│  This updates isDue/nextDueDate on next fetch of recurring expenses │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Design Patterns

1. **Template/Instance Pattern**: Recurring expenses are templates; budget expenses are instances. One-way copy at creation, no live sync.

2. **Immutable Reference**: `recurringExpenseId` is set at creation, never updated. The `UpdateBudgetExpenseRequest` type deliberately excludes it.

3. **Duplicate Prevention**: The wizard tracks added `recurringExpenseId`s in a `Set` and filters the quick-add list accordingly.

4. **Backend-Computed Fields**: `isDue`, `nextDueDate`, and `lastUsedDate` are computed/managed by the backend. The frontend displays them read-only.

5. **Cache Invalidation**: All mutations invalidate `['recurring-expenses']` query key. No optimistic updates — waits for server confirmation.

## Historical Context (from thoughts/)

- `.claude/thoughts/notes/RECURRING_EXPENSES_FLOW.md` — UX flow specification defining page layout, modal behaviors, due status logic, sorting, responsive design, and the relationship to the budget wizard
- `.claude/thoughts/plans/story-03-01-recurring-expenses-page-shell.md` through `story-03-05-delete-recurring-expense-flow.md` — Implementation plans for the five stories that built the recurring expenses feature
- `.claude/thoughts/plans/story-05-03-wizard-step3-expenses.md` — Plan for the wizard expenses step where recurring expense quick-add was implemented
- `.claude/thoughts/notes/BUDGET_WIZARD_FLOW.md` — Wizard flow spec covering how recurring expenses integrate into budget creation

## Related Research

- `.claude/thoughts/research/2026-02-04-animation-refactoring-opportunities.md` — Covers wizard animations including recurring expense copy animation
- `.claude/thoughts/research/2026-02-05-quick-add-collapse-animation-gap-bug.md` — Bug research related to quick-add card collapse behavior

## Open Questions

- The `lastUsedDate` update mechanism (triggered on budget lock) is entirely backend-managed. The frontend has no direct API call for updating due dates — it relies on `isDue`/`nextDueDate` being recomputed on each fetch.
- Deleting a recurring expense does not cascade to budget expenses that reference it. The `recurringExpenseId` on those budget expenses would become a dangling reference. The frontend does not check for or handle this case.
