import { http, HttpResponse } from 'msw'

// Base handlers - extend as needed
export const handlers = [
  // Accounts
  http.get('/api/bank-accounts', () => {
    return HttpResponse.json({
      totalBalance: 10000,
      accountCount: 2,
      accounts: [
        { id: '1', name: 'Checking', description: 'Main account', currentBalance: 5000, createdAt: '2025-01-01T00:00:00Z' },
        { id: '2', name: 'Savings', description: 'Emergency fund', currentBalance: 5000, createdAt: '2025-01-01T00:00:00Z' },
      ],
    })
  }),

  // Recurring expenses
  http.get('/api/recurring-expenses', () => {
    return HttpResponse.json({
      expenses: [
        { id: '1', name: 'Rent', amount: 8000, recurrenceInterval: 'MONTHLY', isManual: true, lastUsedDate: null, nextDueDate: '2025-02-01', isDue: true, createdAt: '2025-01-01T00:00:00Z' },
      ],
    })
  }),

  // Budgets
  http.get('/api/budgets', () => {
    return HttpResponse.json({
      budgets: [],
    })
  }),
]
