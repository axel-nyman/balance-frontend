import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from './query-keys'
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  updateBalance,
  getBalanceHistory,
} from '@/api'
import type {
  CreateBankAccountRequest,
  UpdateBankAccountRequest,
  UpdateBalanceRequest,
} from '@/api'

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts.all,
    queryFn: getAccounts,
  })
}

export function useBalanceHistory(accountId: string, page: number = 0) {
  return useQuery({
    queryKey: [...queryKeys.accounts.history(accountId), page],
    queryFn: () => getBalanceHistory(accountId, page),
    enabled: !!accountId,
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBankAccountRequest) => createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all })
    },
  })
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBankAccountRequest }) =>
      updateAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all })
    },
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all })
    },
  })
}

export function useUpdateBalance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBalanceRequest }) =>
      updateBalance(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.history(variables.id) })
    },
  })
}
