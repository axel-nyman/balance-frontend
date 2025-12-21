import { apiGet, apiPost, apiPut, apiDelete } from './client'
import type {
  BankAccountListResponse,
  BankAccount,
  CreateBankAccountRequest,
  UpdateBankAccountRequest,
  UpdateBalanceRequest,
  BalanceUpdateResponse,
  BalanceHistoryResponse,
} from './types'

export async function getAccounts(): Promise<BankAccountListResponse> {
  return apiGet('/bank-accounts')
}

export async function createAccount(data: CreateBankAccountRequest): Promise<BankAccount> {
  return apiPost('/bank-accounts', data)
}

export async function updateAccount(id: string, data: UpdateBankAccountRequest): Promise<BankAccount> {
  return apiPut(`/bank-accounts/${id}`, data)
}

export async function deleteAccount(id: string): Promise<void> {
  return apiDelete(`/bank-accounts/${id}`)
}

export async function updateBalance(id: string, data: UpdateBalanceRequest): Promise<BalanceUpdateResponse> {
  return apiPost(`/bank-accounts/${id}/balance`, data)
}

export async function getBalanceHistory(
  id: string,
  page: number = 0,
  size: number = 20
): Promise<BalanceHistoryResponse> {
  return apiGet(`/bank-accounts/${id}/balance-history?page=${page}&size=${size}`)
}
