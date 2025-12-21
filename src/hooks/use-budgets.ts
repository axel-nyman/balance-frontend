import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from './query-keys'
import {
  getBudgets,
  getBudget,
  createBudget,
  deleteBudget,
  lockBudget,
  unlockBudget,
  addIncome,
  updateIncome,
  deleteIncome,
  addExpense,
  updateExpense,
  deleteExpense,
  addSavings,
  updateSavings,
  deleteSavings,
} from '@/api'
import type {
  CreateBudgetRequest,
  CreateBudgetIncomeRequest,
  UpdateBudgetIncomeRequest,
  CreateBudgetExpenseRequest,
  UpdateBudgetExpenseRequest,
  CreateBudgetSavingsRequest,
  UpdateBudgetSavingsRequest,
} from '@/api'

export function useBudgets() {
  return useQuery({
    queryKey: queryKeys.budgets.all,
    queryFn: getBudgets,
  })
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: queryKeys.budgets.detail(id),
    queryFn: () => getBudget(id),
    enabled: !!id,
  })
}

export function useCreateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBudgetRequest) => createBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all })
    },
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all })
    },
  })
}

export function useLockBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => lockBudget(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all })
    },
  })
}

export function useUnlockBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => unlockBudget(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all })
    },
  })
}

// Income mutations
export function useAddIncome(budgetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBudgetIncomeRequest) => addIncome(budgetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.detail(budgetId) })
    },
  })
}

export function useUpdateIncome(budgetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ incomeId, data }: { incomeId: string; data: UpdateBudgetIncomeRequest }) =>
      updateIncome(budgetId, incomeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.detail(budgetId) })
    },
  })
}

export function useDeleteIncome(budgetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (incomeId: string) => deleteIncome(budgetId, incomeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.detail(budgetId) })
    },
  })
}

// Expense mutations
export function useAddExpense(budgetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBudgetExpenseRequest) => addExpense(budgetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.detail(budgetId) })
    },
  })
}

export function useUpdateExpense(budgetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ expenseId, data }: { expenseId: string; data: UpdateBudgetExpenseRequest }) =>
      updateExpense(budgetId, expenseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.detail(budgetId) })
    },
  })
}

export function useDeleteExpense(budgetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (expenseId: string) => deleteExpense(budgetId, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.detail(budgetId) })
    },
  })
}

// Savings mutations
export function useAddSavings(budgetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBudgetSavingsRequest) => addSavings(budgetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.detail(budgetId) })
    },
  })
}

export function useUpdateSavings(budgetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ savingsId, data }: { savingsId: string; data: UpdateBudgetSavingsRequest }) =>
      updateSavings(budgetId, savingsId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.detail(budgetId) })
    },
  })
}

export function useDeleteSavings(budgetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (savingsId: string) => deleteSavings(budgetId, savingsId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.detail(budgetId) })
    },
  })
}
