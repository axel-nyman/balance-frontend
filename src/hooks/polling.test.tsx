import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { QueryClient as QueryClientType, QueryKey, QueryObserverOptions } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useBudgets, useBudget } from './use-budgets'
import { useAccounts } from './use-accounts'
import { useRecurringExpenses } from './use-recurring-expenses'
import { queryKeys } from './query-keys'
import { POLL_INTERVAL } from '@/lib/query-config'

// Item 060: the user-visible read queries poll on a shared interval so a change
// made on one device shows up on the other within a bounded delay.

function renderWithClient<T>(hook: () => T) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, ...renderHook(hook, { wrapper }) }
}

function refetchIntervalOf(queryClient: QueryClientType, queryKey: QueryKey) {
  const options = queryClient.getQueryCache().find({ queryKey })?.options as
    | QueryObserverOptions
    | undefined
  return options?.refetchInterval
}

describe('cross-device polling (item 060)', () => {
  it('polls the budget list on the shared interval', async () => {
    const { queryClient, result } = renderWithClient(() => useBudgets())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(refetchIntervalOf(queryClient, queryKeys.budgets.all)).toBe(POLL_INTERVAL)
  })

  it('polls the budget detail on the shared interval', async () => {
    const { queryClient, result } = renderWithClient(() => useBudget('123'))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(refetchIntervalOf(queryClient, queryKeys.budgets.detail('123'))).toBe(POLL_INTERVAL)
  })

  it('polls the accounts list on the shared interval', async () => {
    const { queryClient, result } = renderWithClient(() => useAccounts())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(refetchIntervalOf(queryClient, queryKeys.accounts.all)).toBe(POLL_INTERVAL)
  })

  it('polls the recurring expenses list on the shared interval', async () => {
    const { queryClient, result } = renderWithClient(() => useRecurringExpenses())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(refetchIntervalOf(queryClient, queryKeys.recurringExpenses.all)).toBe(POLL_INTERVAL)
  })
})
