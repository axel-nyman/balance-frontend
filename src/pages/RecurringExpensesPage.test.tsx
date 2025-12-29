import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { RecurringExpensesPage } from './RecurringExpensesPage'

describe('RecurringExpensesPage', () => {
  it('renders page header with title', () => {
    render(<RecurringExpensesPage />)

    expect(screen.getByRole('heading', { name: /recurring expenses/i })).toBeInTheDocument()
  })

  it('renders new recurring expense button', () => {
    render(<RecurringExpensesPage />)

    expect(screen.getByRole('button', { name: /new recurring expense/i })).toBeInTheDocument()
  })
})
