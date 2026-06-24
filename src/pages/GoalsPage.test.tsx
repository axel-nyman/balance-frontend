import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { GoalsPage } from './GoalsPage'
import { server } from '@/test/mocks/server'
import type { SavingsGoal } from '@/api/types'

const mockGoal: SavingsGoal = {
  id: 'g1',
  name: 'Summer trip',
  targetAmount: 10000,
  endDate: null,
  status: 'ACTIVE',
  totalAllocated: 4000,
  progressPercentage: 40,
  completed: false,
  allocations: [{ bankAccountId: '1', bankAccountName: 'Checking', amount: 4000 }],
  archivedAt: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
}

// react-router's navigate is exercised on card click; stub it to avoid full navigation
const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return { ...actual, useNavigate: () => mockNavigate }
})

// Open the (single) account Select and click the visible Radix option for `name`.
// Radix also renders a hidden native <option> (pointer-events: none), so we pick
// the element nested inside an explicit [role="option"].
async function selectAccount(name: string) {
  await userEvent.click(screen.getByRole('combobox'))
  const option = screen.getAllByText(name).find((el) => el.closest('[role="option"]'))
  await userEvent.click(option!)
}

// Same as selectAccount but targets the nth combobox (multiple allocation rows).
async function selectAccountAt(index: number, name: string) {
  await userEvent.click(screen.getAllByRole('combobox')[index])
  const option = screen.getAllByText(name).find((el) => el.closest('[role="option"]'))
  await userEvent.click(option!)
}

describe('GoalsPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('renders the page header', () => {
    render(<GoalsPage />)
    expect(screen.getByRole('heading', { name: /goals/i })).toBeInTheDocument()
  })

  it('displays active goals from the API', async () => {
    server.use(
      http.get('/api/savings-goals', () =>
        HttpResponse.json({ goalCount: 1, goals: [mockGoal] })
      )
    )
    render(<GoalsPage />)
    await waitFor(() => {
      expect(screen.getByText('Summer trip')).toBeInTheDocument()
    })
    // progress: 4 000 / 10 000 and 40%
    expect(screen.getByText(/40%/)).toBeInTheDocument()
    expect(screen.getByText(/Backed by Checking/)).toBeInTheDocument()
  })

  it('shows the empty state when there are no goals', async () => {
    render(<GoalsPage />)
    await waitFor(() => {
      expect(screen.getByText(/no savings goals yet/i)).toBeInTheDocument()
    })
  })

  it('shows the error state on API failure', async () => {
    server.use(http.get('/api/savings-goals', () => HttpResponse.error()))
    render(<GoalsPage />)
    await waitFor(() => {
      expect(screen.getByText(/failed to load goals/i)).toBeInTheDocument()
    })
  })

  it('creates a goal without a seed allocation', async () => {
    let createBody: Record<string, unknown> | null = null
    server.use(
      http.post('/api/savings-goals', async ({ request }) => {
        createBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...mockGoal, name: 'New car' }, { status: 201 })
      })
    )

    render(<GoalsPage />)
    await userEvent.click(screen.getByRole('button', { name: /new goal/i }))

    await userEvent.type(screen.getByLabelText(/^name/i), 'New car')
    await userEvent.type(screen.getByLabelText(/target amount/i), '50000')
    await userEvent.click(screen.getByRole('button', { name: /^create$/i }))

    await waitFor(() => {
      expect(createBody).toMatchObject({ name: 'New car', targetAmount: 50000 })
    })
    expect(createBody).not.toHaveProperty('allocations.0')
  })

  it('seeds an initial allocation from an account when one is chosen', async () => {
    let createBody: Record<string, unknown> | null = null
    server.use(
      http.post('/api/savings-goals', async ({ request }) => {
        createBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...mockGoal }, { status: 201 })
      })
    )

    render(<GoalsPage />)
    await userEvent.click(screen.getByRole('button', { name: /new goal/i }))
    await userEvent.type(screen.getByLabelText(/^name/i), 'Buffer')

    // Pick the seed account (Checking has 5 000 unallocated in the default mock)
    await selectAccount('Checking')

    await userEvent.type(screen.getByLabelText(/^amount$/i), '2000')
    await userEvent.click(screen.getByRole('button', { name: /^create$/i }))

    await waitFor(() => {
      expect(createBody).toMatchObject({
        name: 'Buffer',
        allocations: [{ bankAccountId: '1', amount: 2000 }],
      })
    })
  })

  it('seeds allocations from multiple accounts at once', async () => {
    let createBody: Record<string, unknown> | null = null
    server.use(
      http.post('/api/savings-goals', async ({ request }) => {
        createBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...mockGoal }, { status: 201 })
      })
    )

    render(<GoalsPage />)
    await userEvent.click(screen.getByRole('button', { name: /new goal/i }))
    await userEvent.type(screen.getByLabelText(/^name/i), 'Multi')

    // First row: Checking 2 000
    await selectAccountAt(0, 'Checking')
    await userEvent.type(screen.getAllByLabelText(/^amount$/i)[0], '2000')

    // Add a second row and fund it from Savings
    await userEvent.click(screen.getByRole('button', { name: /add another account/i }))
    await selectAccountAt(1, 'Savings')
    await userEvent.type(screen.getAllByLabelText(/^amount$/i)[1], '1000')

    await userEvent.click(screen.getByRole('button', { name: /^create$/i }))

    await waitFor(() => {
      expect(createBody).toMatchObject({
        name: 'Multi',
        allocations: [
          { bankAccountId: '1', amount: 2000 },
          { bankAccountId: '2', amount: 1000 },
        ],
      })
    })
  })

  it('blocks a seed allocation that exceeds the account unallocated amount', async () => {
    let postCalled = false
    server.use(
      http.post('/api/savings-goals', async () => {
        postCalled = true
        return HttpResponse.json({ ...mockGoal }, { status: 201 })
      })
    )

    render(<GoalsPage />)
    await userEvent.click(screen.getByRole('button', { name: /new goal/i }))
    await userEvent.type(screen.getByLabelText(/^name/i), 'Too much')

    await selectAccount('Checking')

    await userEvent.type(screen.getByLabelText(/^amount$/i), '6000')
    await userEvent.click(screen.getByRole('button', { name: /^create$/i }))

    expect(await screen.findByText(/only .*unallocated in Checking/i)).toBeInTheDocument()
    expect(postCalled).toBe(false)
  })

  it('only shows the remove-allocation control once a second row exists', async () => {
    render(<GoalsPage />)
    await userEvent.click(screen.getByRole('button', { name: /new goal/i }))

    // Single (default) row: no remove control.
    expect(screen.queryByLabelText(/remove allocation/i)).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /add another account/i }))

    // Two rows now: each is removable.
    expect(screen.getAllByLabelText(/remove allocation/i)).toHaveLength(2)
  })

  it('drives the seed amount from the allocation slider', async () => {
    render(<GoalsPage />)
    await userEvent.click(screen.getByRole('button', { name: /new goal/i }))
    await userEvent.type(screen.getByLabelText(/^name/i), 'Slider goal')

    await selectAccount('Checking')

    // Slider appears once an account is chosen; dragging it fills the amount.
    const slider = screen.getByLabelText(/amount to earmark from Checking/i)
    fireEvent.change(slider, { target: { value: '1500' } })

    expect(screen.getByLabelText(/^amount$/i)).toHaveValue(1500)
  })
})
