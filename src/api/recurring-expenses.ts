import { apiGet, apiPost, apiPut, apiDelete } from './client'
import type {
  RecurringExpenseListResponse,
  RecurringExpense,
  CreateRecurringExpenseRequest,
  UpdateRecurringExpenseRequest,
} from './types'

export async function getRecurringExpenses(): Promise<RecurringExpenseListResponse> {
  return apiGet('/recurring-expenses')
}

export async function createRecurringExpense(data: CreateRecurringExpenseRequest): Promise<RecurringExpense> {
  return apiPost('/recurring-expenses', data)
}

export async function updateRecurringExpense(id: string, data: UpdateRecurringExpenseRequest): Promise<RecurringExpense> {
  return apiPut(`/recurring-expenses/${id}`, data)
}

export async function deleteRecurringExpense(id: string): Promise<void> {
  return apiDelete(`/recurring-expenses/${id}`)
}
