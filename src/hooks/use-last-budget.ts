import { useQuery } from '@tanstack/react-query'
import { getBudgets, getBudget } from '@/api'
import { queryKeys } from './query-keys'
import type { BudgetDetail } from '@/api/types'

interface UseLastBudgetResult {
  lastBudget: BudgetDetail | null
  isLoading: boolean
  error: Error | null
}

export function useLastBudget(): UseLastBudgetResult {
  // First, get all budgets to find the most recent
  const {
    data: budgetList,
    isLoading: isLoadingList,
    error: listError,
  } = useQuery({
    queryKey: queryKeys.budgets.all,
    queryFn: getBudgets,
  })

  // Sort budgets by year and month to find the most recent
  const sortedBudgets = [...(budgetList?.budgets ?? [])].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })
  const mostRecentBudgetId = sortedBudgets[0]?.id

  // Then fetch its full details
  const {
    data: budgetDetail,
    isLoading: isLoadingDetail,
    error: detailError,
  } = useQuery({
    queryKey: queryKeys.budgets.detail(mostRecentBudgetId ?? ''),
    queryFn: () => getBudget(mostRecentBudgetId!),
    enabled: !!mostRecentBudgetId,
  })

  return {
    lastBudget: budgetDetail ?? null,
    isLoading: isLoadingList || isLoadingDetail,
    error: (listError as Error) ?? (detailError as Error) ?? null,
  }
}
