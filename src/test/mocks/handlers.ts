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

  // Balance history (default empty response)
  http.get('/api/bank-accounts/:id/balance-history', () => {
    return HttpResponse.json({
      content: [],
      page: { size: 20, number: 0, totalElements: 0, totalPages: 0 },
    })
  }),

  // Update balance
  http.post('/api/bank-accounts/:id/balance', async ({ request, params }) => {
    const body = (await request.json()) as { newBalance: number }
    return HttpResponse.json({
      id: params.id,
      currentBalance: body.newBalance,
      previousBalance: 0,
      changeAmount: body.newBalance,
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

  // Budget detail (for copy from last)
  http.get('/api/budgets/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      month: 1,
      year: 2025,
      status: 'DRAFT',
      income: [],
      expenses: [],
      savings: [],
      totals: { income: 0, expenses: 0, savings: 0, balance: 0 },
    })
  }),

  // Create budget
  http.post('/api/budgets', async ({ request }) => {
    const body = (await request.json()) as { month: number; year: number }
    return HttpResponse.json(
      {
        id: crypto.randomUUID(),
        ...body,
        status: 'DRAFT',
      },
      { status: 201 }
    )
  }),

  // Add income
  http.post('/api/budgets/:id/income', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(
      {
        id: crypto.randomUUID(),
        ...body,
      },
      { status: 201 }
    )
  }),

  // Add expense
  http.post('/api/budgets/:id/expenses', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(
      {
        id: crypto.randomUUID(),
        ...body,
      },
      { status: 201 }
    )
  }),

  // Add savings
  http.post('/api/budgets/:id/savings', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(
      {
        id: crypto.randomUUID(),
        ...body,
      },
      { status: 201 }
    )
  }),

  // Lock budget
  http.post('/api/budgets/:id/lock', () => {
    return HttpResponse.json({ status: 'LOCKED' })
  }),
]
