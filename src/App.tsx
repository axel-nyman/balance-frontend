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
