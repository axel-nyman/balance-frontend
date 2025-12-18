# Story 1.2: Routing Setup

**As a** developer
**I want to** have all routes defined and working
**So that** I can navigate between pages during development

## Acceptance Criteria

- [ ] React Router v6 configured with BrowserRouter
- [ ] All route paths defined as constants
- [ ] Placeholder page components created for each route
- [ ] 404 catch-all route implemented
- [ ] Navigation between routes works

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

1. **Create route constants `src/routes.ts`**
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

2. **Create placeholder pages in `src/pages/`**

   Create simple placeholder components for each page:
   ```typescript
   // src/pages/AccountsPage.tsx
   export function AccountsPage() {
     return <div className="p-4"><h1 className="text-2xl font-bold">Accounts</h1></div>
   }
   ```

   Create similar files for:
   - `AccountsPage.tsx`
   - `RecurringExpensesPage.tsx`
   - `BudgetsPage.tsx`
   - `BudgetWizardPage.tsx`
   - `BudgetDetailPage.tsx`
   - `TodoListPage.tsx`
   - `NotFoundPage.tsx`

3. **Create pages barrel export `src/pages/index.ts`**
   ```typescript
   export { AccountsPage } from './AccountsPage'
   export { RecurringExpensesPage } from './RecurringExpensesPage'
   export { BudgetsPage } from './BudgetsPage'
   export { BudgetWizardPage } from './BudgetWizardPage'
   export { BudgetDetailPage } from './BudgetDetailPage'
   export { TodoListPage } from './TodoListPage'
   export { NotFoundPage } from './NotFoundPage'
   ```

4. **Configure router in `src/App.tsx`**
   ```typescript
   import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
└── App.tsx
```

## Definition of Done

- [ ] Can navigate to all routes via URL bar
- [ ] Unknown routes show 404 page
- [ ] Home (`/`) redirects to `/budgets`
- [ ] No console errors during navigation
