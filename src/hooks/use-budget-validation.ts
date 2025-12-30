import { useQuery } from '@tanstack/react-query'
import { getBudgets } from '@/api'
import { queryKeys } from './query-keys'

interface BudgetValidation {
  existingBudgets: Array<{ month: number; year: number; status: string }>
  hasUnlockedBudget: boolean
  mostRecentBudget: { month: number; year: number } | null
  isLoading: boolean
  error: Error | null
}

export function useBudgetValidation(): BudgetValidation {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.budgets.all,
    queryFn: getBudgets,
  })

  const existingBudgets = data?.budgets.map(b => ({
    month: b.month,
    year: b.year,
    status: b.status,
  })) ?? []

  const hasUnlockedBudget = existingBudgets.some(b => b.status === 'UNLOCKED')

  // Most recent by year DESC, month DESC
  const sortedBudgets = [...existingBudgets].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })

  const mostRecentBudget = sortedBudgets[0] ?? null

  return {
    existingBudgets,
    hasUnlockedBudget,
    mostRecentBudget,
    isLoading,
    error: error as Error | null,
  }
}
