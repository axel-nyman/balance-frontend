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
