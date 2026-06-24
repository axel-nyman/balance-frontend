export const queryKeys = {
  accounts: {
    all: ['accounts'] as const,
    history: (accountId: string) => ['accounts', accountId, 'history'] as const,
  },
  recurringExpenses: {
    all: ['recurring-expenses'] as const,
  },
  budgets: {
    all: ['budgets'] as const,
    detail: (budgetId: string) => ['budgets', budgetId] as const,
    todo: (budgetId: string) => ['budgets', budgetId, 'todo'] as const,
  },
  goals: {
    all: ['goals'] as const,
    detail: (goalId: string) => ['goals', goalId] as const,
    history: (goalId: string) => ['goals', goalId, 'history'] as const,
  },
}
