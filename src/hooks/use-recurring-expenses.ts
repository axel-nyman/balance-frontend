import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from './query-keys'
import { POLL_INTERVAL } from '@/lib/query-config'
import {
  getRecurringExpenses,
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
} from '@/api'
import type {
  CreateRecurringExpenseRequest,
  UpdateRecurringExpenseRequest,
} from '@/api'

export function useRecurringExpenses() {
  return useQuery({
    queryKey: queryKeys.recurringExpenses.all,
    queryFn: getRecurringExpenses,
    refetchInterval: POLL_INTERVAL,
  })
}

export function useCreateRecurringExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateRecurringExpenseRequest) => createRecurringExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringExpenses.all })
    },
  })
}

export function useUpdateRecurringExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecurringExpenseRequest }) =>
      updateRecurringExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringExpenses.all })
    },
  })
}

export function useDeleteRecurringExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteRecurringExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringExpenses.all })
    },
  })
}
