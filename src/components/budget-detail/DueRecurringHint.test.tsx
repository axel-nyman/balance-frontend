import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { DueRecurringHint } from './DueRecurringHint'
import type { BudgetExpense, RecurringExpense } from '@/api/types'

const account = { id: 'acc-1', name: 'Checking' }

function makeTemplate(overrides: Partial<RecurringExpense> = {}): RecurringExpense {
  return {
    id: 't1',
    name: 'Insurance',
    amount: 1200,
    recurrenceInterval: 'QUARTERLY',
    isManual: false,
    bankAccount: account,
    dueMonth: 3,
    dueYear: 2025,
    dueDisplay: 'March 2025',
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

function mockRecurring(expenses: RecurringExpense[]) {
  server.use(
    http.get('/api/recurring-expenses', () =>
      HttpResponse.json({ expenses })
    )
  )
}

function renderHint(props: {
  expenses?: BudgetExpense[]
  month?: number
  year?: number
  isLocked?: boolean
}) {
  return render(
    <DueRecurringHint
      budgetId="b1"
      month={props.month ?? 3}
      year={props.year ?? 2025}
      expenses={props.expenses ?? []}
      isLocked={props.isLocked ?? false}
    />
  )
}

describe('DueRecurringHint', () => {
  it('shows a due-and-missing template due in the budget month', async () => {
    mockRecurring([makeTemplate()])
    renderHint({})

    expect(await screen.findByText('Insurance')).toBeInTheDocument()
    expect(screen.getByText(/due recurring expenses not added/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add insurance/i })).toBeInTheDocument()
  })

  it('shows an overdue template (due earlier than the budget month)', async () => {
    mockRecurring([makeTemplate({ dueMonth: 1, dueYear: 2025, dueDisplay: 'January 2025' })])
    renderHint({ month: 3, year: 2025 })

    expect(await screen.findByText('Insurance')).toBeInTheDocument()
  })

  it('hides templates that are due in a future month', async () => {
    mockRecurring([makeTemplate({ dueMonth: 6, dueYear: 2025, dueDisplay: 'June 2025' })])
    const { container } = renderHint({ month: 3, year: 2025 })

    // Give the query time to resolve, then assert nothing rendered.
    await waitFor(() => {
      expect(screen.queryByText('Insurance')).not.toBeInTheDocument()
    })
    expect(container).toBeEmptyDOMElement()
  })

  it('hides templates already linked from an expense row', async () => {
    mockRecurring([makeTemplate({ id: 't1' })])
    const linkedExpense: BudgetExpense = {
      id: 'e1',
      name: 'Insurance',
      amount: 1200,
      bankAccount: { id: 'acc-1', name: 'Checking' },
      recurringExpenseId: 't1',
      deductedAt: null,
      isManual: false,
    }
    const { container } = renderHint({ expenses: [linkedExpense] })

    await waitFor(() => {
      expect(screen.queryByText(/due recurring expenses not added/i)).not.toBeInTheDocument()
    })
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing for a locked budget even when a template is due', async () => {
    mockRecurring([makeTemplate()])
    const { container } = renderHint({ isLocked: true })

    // Nothing should ever appear; wait a tick to be sure the query did not paint.
    await waitFor(() => {
      expect(screen.queryByText('Insurance')).not.toBeInTheDocument()
    })
    expect(container).toBeEmptyDOMElement()
  })

  it('one-click add posts an expense shaped like the wizard add', async () => {
    mockRecurring([makeTemplate()])

    let captured: Record<string, unknown> | null = null
    server.use(
      http.post('/api/budgets/:id/expenses', async ({ request }) => {
        captured = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: 'new', ...captured }, { status: 201 })
      })
    )

    renderHint({})
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /add insurance/i }))

    await waitFor(() => {
      expect(captured).toEqual({
        name: 'Insurance',
        amount: 1200,
        bankAccountId: 'acc-1',
        isManual: false,
        recurringExpenseId: 't1',
      })
    })
  })

  it('opens the expense modal when the template has no default account', async () => {
    mockRecurring([makeTemplate({ bankAccount: null })])
    renderHint({})

    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /add insurance/i }))

    // The modal lets the user choose an account before saving.
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /add expense/i })).toBeInTheDocument()
  })
})
