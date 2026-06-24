import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from './query-keys'
import { POLL_INTERVAL } from '@/lib/query-config'
import {
  getGoals,
  getGoal,
  getGoalHistory,
  createGoal,
  updateGoal,
  allocateToGoal,
  archiveGoal,
} from '@/api'
import type {
  CreateSavingsGoalRequest,
  UpdateSavingsGoalRequest,
  AllocateRequest,
  ArchiveSavingsGoalRequest,
} from '@/api'

export function useGoals() {
  return useQuery({
    queryKey: queryKeys.goals.all,
    queryFn: getGoals,
    refetchInterval: POLL_INTERVAL,
  })
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: queryKeys.goals.detail(id),
    queryFn: () => getGoal(id),
    enabled: !!id,
    refetchInterval: POLL_INTERVAL,
  })
}

export function useGoalHistory(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.goals.history(id),
    queryFn: () => getGoalHistory(id),
    enabled: enabled && !!id,
  })
}

// Allocations are earmarks over account balances, so any goal mutation can
// change accounts' unallocated figures — invalidate accounts alongside goals.
function invalidateGoalsAndAccounts(
  queryClient: ReturnType<typeof useQueryClient>,
  goalId?: string
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.goals.all })
  queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all })
  if (goalId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.goals.detail(goalId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.goals.history(goalId) })
  }
}

export function useCreateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateSavingsGoalRequest) => createGoal(data),
    onSuccess: () => invalidateGoalsAndAccounts(queryClient),
  })
}

export function useUpdateGoal(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateSavingsGoalRequest) => updateGoal(id, data),
    onSuccess: () => invalidateGoalsAndAccounts(queryClient, id),
  })
}

export function useAllocateToGoal(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AllocateRequest) => allocateToGoal(id, data),
    onSuccess: () => invalidateGoalsAndAccounts(queryClient, id),
  })
}

export function useArchiveGoal(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ArchiveSavingsGoalRequest) => archiveGoal(id, data),
    onSuccess: () => invalidateGoalsAndAccounts(queryClient, id),
  })
}
