import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { BudgetsPage } from './BudgetsPage'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('BudgetsPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('renders page header with title', () => {
    render(<BudgetsPage />)

    expect(screen.getByRole('heading', { name: /budgets/i })).toBeInTheDocument()
  })

  it('renders new budget button', () => {
    render(<BudgetsPage />)

    expect(screen.getByRole('button', { name: /new budget/i })).toBeInTheDocument()
  })

  it('navigates to wizard when new budget button is clicked', async () => {
    render(<BudgetsPage />)

    await userEvent.click(screen.getByRole('button', { name: /new budget/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/budgets/new')
  })
})
