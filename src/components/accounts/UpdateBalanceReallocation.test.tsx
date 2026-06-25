import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { UpdateBalanceModal } from './UpdateBalanceModal'
import { toast } from 'sonner'
import type { BankAccount, SavingsGoal } from '@/api/types'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const account: BankAccount = {
  id: '123',
  name: 'Checking',
  description: null,
  currentBalance: 1000,
  allocatedAmount: 0,
  unallocatedAmount: 1000,
  createdAt: '2025-01-01',
}

function goal(overrides: Partial<SavingsGoal> & { id: string; name: string }): SavingsGoal {
  return {
    targetAmount: null,
    endDate: null,
    status: 'ACTIVE',
    totalAllocated: 0,
    progressPercentage: null,
    completed: false,
    allocations: [],
    archivedAt: null,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    ...overrides,
  }
}

function mockGoals(goals: SavingsGoal[]) {
  server.use(
    http.get('/api/savings-goals', () =>
      HttpResponse.json({ goalCount: goals.length, goals })
    )
  )
}

describe('UpdateBalanceModal — savings-goal reallocation (item 070d)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('informs the user of an automatic single-goal deficit reduction', async () => {
    mockGoals([
      goal({
        id: 'g1',
        name: 'House',
        totalAllocated: 800,
        allocations: [{ bankAccountId: '123', bankAccountName: 'Checking', amount: 800 }],
      }),
    ])
    server.use(
      http.post('/api/bank-accounts/123/balance', () =>
        HttpResponse.json({
          id: '123',
          name: 'Checking',
          currentBalance: 600,
          previousBalance: 1000,
          changeAmount: -400,
          lastUpdated: '2025-01-01',
          allocationAdjustments: [
            { savingsGoalId: 'g1', goalName: 'House', changeAmount: -200, resultingAmount: 600 },
          ],
        })
      )
    )

    const onOpenChange = vi.fn()
    render(<UpdateBalanceModal account={account} open onOpenChange={onOpenChange} />)

    await userEvent.clear(screen.getByLabelText(/new balance/i))
    await userEvent.type(screen.getByLabelText(/new balance/i), '600')
    await userEvent.click(screen.getByRole('button', { name: /update/i }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(toast.success).toHaveBeenCalledWith(
      'Balance updated',
      expect.objectContaining({ description: expect.stringContaining('House') })
    )
  })

  it('prompts for a split on a multi-goal deficit and resubmits with the split', async () => {
    const requests: Array<{ reallocation?: Array<{ savingsGoalId: string; changeBy: number }> }> = []
    server.use(
      http.post('/api/bank-accounts/123/balance', async ({ request }) => {
        const body = (await request.json()) as {
          reallocation?: Array<{ savingsGoalId: string; changeBy: number }>
        }
        requests.push(body)
        if (!body.reallocation) {
          return HttpResponse.json(
            {
              error: 'Balance decrease leaves the account over-allocated across multiple goals',
              accountId: '123',
              accountName: 'Checking',
              newBalance: 600,
              totalAllocated: 800,
              requiredReduction: 200,
              goals: [
                { savingsGoalId: 'g1', goalName: 'House', currentAllocation: 400 },
                { savingsGoalId: 'g2', goalName: 'Car', currentAllocation: 400 },
              ],
            },
            { status: 409 }
          )
        }
        return HttpResponse.json({
          id: '123',
          name: 'Checking',
          currentBalance: 600,
          previousBalance: 1000,
          changeAmount: -400,
          lastUpdated: '2025-01-01',
          allocationAdjustments: body.reallocation.map((r) => ({
            savingsGoalId: r.savingsGoalId,
            goalName: r.savingsGoalId === 'g1' ? 'House' : 'Car',
            changeAmount: r.changeBy,
            resultingAmount: 0,
          })),
        })
      })
    )

    const onOpenChange = vi.fn()
    render(<UpdateBalanceModal account={account} open onOpenChange={onOpenChange} />)

    await userEvent.clear(screen.getByLabelText(/new balance/i))
    await userEvent.type(screen.getByLabelText(/new balance/i), '600')
    await userEvent.click(screen.getByRole('button', { name: /update/i }))

    // Split dialog appears on the 409.
    expect(await screen.findByText(/reduce goal allocations/i)).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText(/House/), '150')
    await userEvent.type(screen.getByLabelText(/Car/), '50')
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))

    expect(requests).toHaveLength(2)
    expect(requests[0].reallocation).toBeUndefined()
    const split = requests[1].reallocation!
    expect(split.reduce((s, e) => s + e.changeBy, 0)).toBeCloseTo(-200)
  })

  it('offers a pre-checked earmark checkbox when the account is fully allocated to one goal', async () => {
    const fullyAllocated: BankAccount = { ...account, allocatedAmount: 1000, unallocatedAmount: 0 }
    mockGoals([
      goal({
        id: 'g1',
        name: 'House',
        totalAllocated: 1000,
        allocations: [{ bankAccountId: '123', bankAccountName: 'Checking', amount: 1000 }],
      }),
    ])
    let body: { reallocation?: Array<{ savingsGoalId: string; changeBy: number }> } | undefined
    server.use(
      http.post('/api/bank-accounts/123/balance', async ({ request }) => {
        body = (await request.json()) as typeof body
        return HttpResponse.json({
          id: '123',
          name: 'Checking',
          currentBalance: 1200,
          previousBalance: 1000,
          changeAmount: 200,
          lastUpdated: '2025-01-01',
          allocationAdjustments: [
            { savingsGoalId: 'g1', goalName: 'House', changeAmount: 200, resultingAmount: 1200 },
          ],
        })
      })
    )

    render(<UpdateBalanceModal account={fullyAllocated} open onOpenChange={vi.fn()} />)

    await userEvent.clear(screen.getByLabelText(/new balance/i))
    await userEvent.type(screen.getByLabelText(/new balance/i), '1200')

    const checkbox = await screen.findByRole('checkbox')
    expect(checkbox).toHaveAttribute('data-state', 'checked')

    await userEvent.click(screen.getByRole('button', { name: /update/i }))

    await waitFor(() => expect(body?.reallocation).toBeDefined())
    expect(body!.reallocation).toEqual([{ savingsGoalId: 'g1', changeBy: 200 }])
  })

  it('leaves the earmark checkbox off when the account is only partly allocated', async () => {
    const partly: BankAccount = { ...account, allocatedAmount: 500, unallocatedAmount: 500 }
    mockGoals([
      goal({
        id: 'g1',
        name: 'House',
        totalAllocated: 500,
        allocations: [{ bankAccountId: '123', bankAccountName: 'Checking', amount: 500 }],
      }),
    ])

    render(<UpdateBalanceModal account={partly} open onOpenChange={vi.fn()} />)

    await userEvent.clear(screen.getByLabelText(/new balance/i))
    await userEvent.type(screen.getByLabelText(/new balance/i), '1200')

    const checkbox = await screen.findByRole('checkbox')
    expect(checkbox).toHaveAttribute('data-state', 'unchecked')
  })

  it('offers per-goal distribution inputs on an increase over a multi-goal account', async () => {
    const partly: BankAccount = { ...account, allocatedAmount: 500, unallocatedAmount: 500 }
    mockGoals([
      goal({
        id: 'g1',
        name: 'House',
        totalAllocated: 300,
        allocations: [{ bankAccountId: '123', bankAccountName: 'Checking', amount: 300 }],
      }),
      goal({
        id: 'g2',
        name: 'Car',
        totalAllocated: 200,
        allocations: [{ bankAccountId: '123', bankAccountName: 'Checking', amount: 200 }],
      }),
    ])

    render(<UpdateBalanceModal account={partly} open onOpenChange={vi.fn()} />)

    await userEvent.clear(screen.getByLabelText(/new balance/i))
    await userEvent.type(screen.getByLabelText(/new balance/i), '1300')

    expect(await screen.findByLabelText('House')).toBeInTheDocument()
    expect(screen.getByLabelText('Car')).toBeInTheDocument()
    // A single shared checkbox is not used for the multi-goal case.
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })
})
