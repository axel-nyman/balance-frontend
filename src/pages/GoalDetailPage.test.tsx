import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithRoute } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { GoalDetailPage } from './GoalDetailPage'
import { server } from '@/test/mocks/server'
import type { SavingsGoal } from '@/api/types'

const mockGoal: SavingsGoal = {
  id: 'g1',
  name: 'Summer trip',
  targetAmount: 10000,
  endDate: '2025-12-01',
  status: 'ACTIVE',
  totalAllocated: 4000,
  progressPercentage: 40,
  completed: false,
  allocations: [{ bankAccountId: '1', bankAccountName: 'Checking', amount: 4000 }],
  archivedAt: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
}

const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return { ...actual, useNavigate: () => mockNavigate }
})

async function selectAccount(name: string) {
  await userEvent.click(screen.getByRole('combobox'))
  const option = screen.getAllByText(name).find((el) => el.closest('[role="option"]'))
  await userEvent.click(option!)
}

function renderDetail(goalId = 'g1') {
  return renderWithRoute(<GoalDetailPage />, {
    route: '/goals/:id',
    initialEntry: `/goals/${goalId}`,
  })
}

describe('GoalDetailPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    server.use(http.get('/api/savings-goals/g1', () => HttpResponse.json(mockGoal)))
  })

  it('renders the goal name, progress and per-account breakdown', async () => {
    renderDetail()
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Summer trip' })).toBeInTheDocument()
    })
    expect(screen.getByText(/40%/)).toBeInTheDocument()
    // Backing accounts breakdown
    expect(screen.getByText('Checking')).toBeInTheDocument()
  })

  it('shows the not-found state when the goal is missing', async () => {
    server.use(http.get('/api/savings-goals/g1', () => HttpResponse.error()))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText(/this goal doesn't exist or has been deleted/i)).toBeInTheDocument()
    })
  })

  it('assigns money from an account (capped at unallocated)', async () => {
    let allocateBody: Record<string, unknown> | null = null
    server.use(
      http.post('/api/savings-goals/g1/allocations', async ({ request }) => {
        allocateBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(mockGoal)
      })
    )

    renderDetail()
    await waitFor(() => screen.getByRole('heading', { name: 'Summer trip' }))

    await userEvent.click(screen.getByRole('button', { name: /assign money/i }))
    await selectAccount('Checking')

    const amountInput = screen.getByLabelText(/amount earmarked/i)
    await userEvent.clear(amountInput)
    await userEvent.type(amountInput, '2000')
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(allocateBody).toMatchObject({ bankAccountId: '1', amount: 2000 })
    })
  })

  it('drives the assign amount from the allocation slider', async () => {
    renderDetail()
    await waitFor(() => screen.getByRole('heading', { name: 'Summer trip' }))

    await userEvent.click(screen.getByRole('button', { name: /assign money/i }))
    await selectAccount('Checking')

    const slider = screen.getByLabelText(/amount to earmark from Checking/i)
    fireEvent.change(slider, { target: { value: '1000' } })

    expect(screen.getByLabelText(/amount earmarked/i)).toHaveValue(1000)
  })

  it('archives the goal freeing the earmark by default (releaseToBalance false)', async () => {
    let archiveBody: Record<string, unknown> | null = null
    server.use(
      http.post('/api/savings-goals/g1/archive', async ({ request }) => {
        archiveBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...mockGoal, status: 'ARCHIVED' })
      })
    )

    renderDetail()
    await waitFor(() => screen.getByRole('heading', { name: 'Summer trip' }))

    await userEvent.click(screen.getByRole('button', { name: /archive goal/i }))
    await userEvent.click(screen.getByRole('button', { name: /^archive$/i }))

    await waitFor(() => {
      expect(archiveBody).toEqual({ releaseToBalance: false })
    })
  })

  it('archives and spends the money when the option is checked (releaseToBalance true)', async () => {
    let archiveBody: Record<string, unknown> | null = null
    server.use(
      http.post('/api/savings-goals/g1/archive', async ({ request }) => {
        archiveBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...mockGoal, status: 'ARCHIVED' })
      })
    )

    renderDetail()
    await waitFor(() => screen.getByRole('heading', { name: 'Summer trip' }))

    await userEvent.click(screen.getByRole('button', { name: /archive goal/i }))
    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: /^archive$/i }))

    await waitFor(() => {
      expect(archiveBody).toEqual({ releaseToBalance: true })
    })
  })

  function isoDaysFromNow(days: number): string {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
  }

  function historyChange(createdAt: string, changeAmount: number) {
    return {
      id: createdAt,
      bankAccountId: '1',
      bankAccountName: 'Checking',
      changeAmount,
      resultingAmount: 0,
      source: 'BUDGET_LOCK' as const,
      createdAt,
    }
  }

  it('shows remaining-to-target alongside the progress bar', async () => {
    renderDetail()
    await waitFor(() => screen.getByRole('heading', { name: 'Summer trip' }))
    expect(screen.getByText('Remaining')).toBeInTheDocument()
    // target 10000 - allocated 4000 = 6000 remaining
    expect(screen.getByText('6 000,00 kr')).toBeInTheDocument()
  })

  it('renders the history chart and a completion projection when enough history exists', async () => {
    server.use(
      http.get('/api/savings-goals/g1/history', () =>
        HttpResponse.json({
          goalId: 'g1',
          changes: [
            historyChange(isoDaysFromNow(-30), 3000),
            historyChange(isoDaysFromNow(-90), 3000),
          ],
        })
      )
    )
    renderDetail()
    await waitFor(() => screen.getByRole('heading', { name: 'Summer trip' }))
    await waitFor(() => {
      expect(screen.getByTestId('goal-history-chart')).toBeInTheDocument()
    })
    expect(screen.getByText(/on track to reach/i)).toBeInTheDocument()
  })

  it('shows a graceful fallback when history is too thin to project', async () => {
    server.use(
      http.get('/api/savings-goals/g1/history', () =>
        HttpResponse.json({
          goalId: 'g1',
          changes: [historyChange(isoDaysFromNow(-5), 1000)],
        })
      )
    )
    renderDetail()
    await waitFor(() => screen.getByRole('heading', { name: 'Summer trip' }))
    await waitFor(() => {
      expect(screen.getByText(/not enough history yet/i)).toBeInTheDocument()
    })
  })

  it('shows the required monthly contribution for a goal with a future end date', async () => {
    server.use(
      http.get('/api/savings-goals/g1', () =>
        HttpResponse.json({ ...mockGoal, endDate: isoDaysFromNow(180).slice(0, 10) })
      ),
      http.get('/api/savings-goals/g1/history', () =>
        HttpResponse.json({
          goalId: 'g1',
          changes: [
            historyChange(isoDaysFromNow(-30), 2000),
            historyChange(isoDaysFromNow(-90), 2000),
          ],
        })
      )
    )
    renderDetail()
    await waitFor(() => screen.getByRole('heading', { name: 'Summer trip' }))
    await waitFor(() => {
      expect(screen.getByText(/to reach this by your target date/i)).toBeInTheDocument()
    })
  })

  it('hides edit/assign/archive actions for an archived goal', async () => {
    server.use(
      http.get('/api/savings-goals/g1', () =>
        HttpResponse.json({
          ...mockGoal,
          status: 'ARCHIVED',
          archivedAt: '2025-02-01T00:00:00Z',
        })
      )
    )
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('Archived')).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /assign money/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /archive goal/i })).not.toBeInTheDocument()
  })
})
