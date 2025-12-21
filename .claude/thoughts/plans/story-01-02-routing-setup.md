# Story 1.2: Routing Setup

**As a** developer
**I want to** have all routes defined and working
**So that** I can navigate between pages during development

## Acceptance Criteria

- [x] React Router v7 configured with BrowserRouter
- [x] All route paths defined as constants
- [x] Placeholder page components created for each route
- [x] 404 catch-all route implemented
- [x] Navigation between routes works

## Route Definitions

| Path | Page Component | Description |
|------|----------------|-------------|
| `/` | Redirect to `/budgets` | Home redirects to budget list |
| `/accounts` | AccountsPage | Bank accounts management |
| `/recurring-expenses` | RecurringExpensesPage | Recurring expense templates |
| `/budgets` | BudgetsPage | Budget list |
| `/budgets/new` | BudgetWizardPage | Create new budget |
| `/budgets/:id` | BudgetDetailPage | View/edit budget |
| `/budgets/:id/todo` | TodoListPage | Todo list for budget |
| `*` | NotFoundPage | 404 page |

## Implementation Steps

### Phase 1: Update Test Utilities for React Router v7

**File**: `src/test/test-utils.tsx`
**Changes**: Update import from `react-router-dom` to `react-router`

```typescript
// Line 3: Change this import
import { BrowserRouter } from 'react-router'
```

This ensures consistency with React Router v7's package structure where all exports come from `react-router`.

---

### Phase 2: Create Route Constants

**File**: `src/routes.ts` (new file)

```typescript
export const ROUTES = {
  HOME: '/',
  ACCOUNTS: '/accounts',
  RECURRING_EXPENSES: '/recurring-expenses',
  BUDGETS: '/budgets',
  BUDGET_NEW: '/budgets/new',
  BUDGET_DETAIL: '/budgets/:id',
  BUDGET_TODO: '/budgets/:id/todo',
} as const

// Helper functions for dynamic routes
export const budgetDetailPath = (id: string) => `/budgets/${id}`
export const budgetTodoPath = (id: string) => `/budgets/${id}/todo`
```

---

### Phase 3: Create Placeholder Page Components

Create `src/pages/` directory with placeholder components for each page.

#### 3.1 AccountsPage

**File**: `src/pages/AccountsPage.tsx`

```typescript
export function AccountsPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Accounts</h1>
      <p className="text-gray-500">Bank accounts management</p>
    </div>
  )
}
```

#### 3.2 RecurringExpensesPage

**File**: `src/pages/RecurringExpensesPage.tsx`

```typescript
export function RecurringExpensesPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Recurring Expenses</h1>
      <p className="text-gray-500">Recurring expense templates</p>
    </div>
  )
}
```

#### 3.3 BudgetsPage

**File**: `src/pages/BudgetsPage.tsx`

```typescript
export function BudgetsPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Budgets</h1>
      <p className="text-gray-500">Monthly budget list</p>
    </div>
  )
}
```

#### 3.4 BudgetWizardPage

**File**: `src/pages/BudgetWizardPage.tsx`

```typescript
export function BudgetWizardPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Create Budget</h1>
      <p className="text-gray-500">Budget creation wizard</p>
    </div>
  )
}
```

#### 3.5 BudgetDetailPage

**File**: `src/pages/BudgetDetailPage.tsx`

```typescript
import { useParams } from 'react-router'

export function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Budget Detail</h1>
      <p className="text-gray-500">Viewing budget: {id}</p>
    </div>
  )
}
```

#### 3.6 TodoListPage

**File**: `src/pages/TodoListPage.tsx`

```typescript
import { useParams } from 'react-router'

export function TodoListPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Todo List</h1>
      <p className="text-gray-500">Todo list for budget: {id}</p>
    </div>
  )
}
```

#### 3.7 NotFoundPage

**File**: `src/pages/NotFoundPage.tsx`

```typescript
import { Link } from 'react-router'
import { ROUTES } from '../routes'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="mt-2 text-gray-500">Page not found</p>
      <Link
        to={ROUTES.BUDGETS}
        className="mt-4 text-blue-600 hover:underline"
      >
        Go to Budgets
      </Link>
    </div>
  )
}
```

#### 3.8 Barrel Export

**File**: `src/pages/index.ts`

```typescript
export { AccountsPage } from './AccountsPage'
export { RecurringExpensesPage } from './RecurringExpensesPage'
export { BudgetsPage } from './BudgetsPage'
export { BudgetWizardPage } from './BudgetWizardPage'
export { BudgetDetailPage } from './BudgetDetailPage'
export { TodoListPage } from './TodoListPage'
export { NotFoundPage } from './NotFoundPage'
```

---

### Phase 4: Configure Router in App.tsx

**File**: `src/App.tsx`

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { ROUTES } from './routes'
import {
  AccountsPage,
  RecurringExpensesPage,
  BudgetsPage,
  BudgetWizardPage,
  BudgetDetailPage,
  TodoListPage,
  NotFoundPage,
} from './pages'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.BUDGETS} replace />} />
        <Route path={ROUTES.ACCOUNTS} element={<AccountsPage />} />
        <Route path={ROUTES.RECURRING_EXPENSES} element={<RecurringExpensesPage />} />
        <Route path={ROUTES.BUDGETS} element={<BudgetsPage />} />
        <Route path={ROUTES.BUDGET_NEW} element={<BudgetWizardPage />} />
        <Route path={ROUTES.BUDGET_DETAIL} element={<BudgetDetailPage />} />
        <Route path={ROUTES.BUDGET_TODO} element={<TodoListPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

**Note on Route Order**: The `/budgets/new` route must come before `/budgets/:id` to prevent "new" from being matched as an id parameter. React Router v7 handles this correctly when routes are defined in this order.

---

## File Structure After Completion

```
src/
├── pages/
│   ├── AccountsPage.tsx
│   ├── RecurringExpensesPage.tsx
│   ├── BudgetsPage.tsx
│   ├── BudgetWizardPage.tsx
│   ├── BudgetDetailPage.tsx
│   ├── TodoListPage.tsx
│   ├── NotFoundPage.tsx
│   └── index.ts
├── routes.ts
├── App.tsx
└── test/
    └── test-utils.tsx (updated import)
```

## React Router v7 Notes

This implementation uses React Router v7 (installed version: `^7.11.0`). Key differences from v6:

1. **Import from `react-router`**: All components (`BrowserRouter`, `Routes`, `Route`, `Navigate`, `Link`, `useParams`, etc.) are imported from `react-router` instead of `react-router-dom`.

2. **No configuration needed**: Future flags that were opt-in in v6 are now the default behavior in v7.

3. **Backward compatible**: The API for `BrowserRouter`, `Routes`, `Route`, and `Navigate` remains the same as v6.

## Success Criteria

### Automated Verification:
- [x] TypeScript compiles without errors: `npm run build`
- [x] Tests pass: `npm test`
- [x] ESLint passes: `npm run lint`

### Manual Verification:
- [x] Can navigate to `/accounts` via URL bar → shows "Accounts" heading
- [x] Can navigate to `/recurring-expenses` via URL bar → shows "Recurring Expenses" heading
- [x] Can navigate to `/budgets` via URL bar → shows "Budgets" heading
- [x] Can navigate to `/budgets/new` via URL bar → shows "Create Budget" heading
- [x] Can navigate to `/budgets/123` via URL bar → shows "Viewing budget: 123"
- [x] Can navigate to `/budgets/123/todo` via URL bar → shows "Todo list for budget: 123"
- [x] Home (`/`) redirects to `/budgets`
- [x] Unknown routes (e.g., `/foo`) show 404 page with link to budgets
- [x] No console errors during navigation

## Definition of Done

- [x] All route paths accessible via URL bar
- [x] Unknown routes show 404 page
- [x] Home (`/`) redirects to `/budgets`
- [x] No console errors during navigation
- [x] All tests pass
- [x] Build succeeds
