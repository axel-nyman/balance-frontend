import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
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
