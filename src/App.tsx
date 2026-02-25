import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { ROUTES } from './routes'
import { AppLayout } from './components/layout'
import {
  AccountsPage,
  RecurringExpensesPage,
  BudgetsPage,
  BudgetWizardPage,
  BudgetDetailPage,
  TodoListPage,
  NotFoundPage,
} from './pages'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
})

function App() {
  useEffect(() => {
    if (sessionStorage.getItem('pwa-updated')) {
      sessionStorage.removeItem('pwa-updated')
      toast.success('App updated')
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.BUDGETS} replace />} />
            <Route path={ROUTES.ACCOUNTS} element={<AccountsPage />} />
            <Route path={ROUTES.RECURRING_EXPENSES} element={<RecurringExpensesPage />} />
            <Route path={ROUTES.BUDGETS} element={<BudgetsPage />} />
            <Route path={ROUTES.BUDGET_NEW} element={<BudgetWizardPage />} />
            <Route path={ROUTES.BUDGET_DETAIL} element={<BudgetDetailPage />} />
            <Route path={ROUTES.BUDGET_TODO} element={<TodoListPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
