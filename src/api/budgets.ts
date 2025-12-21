import { apiGet, apiPost, apiPut, apiDelete } from './client'
import type {
  BudgetListResponse,
  BudgetDetail,
  BudgetSummary,
  CreateBudgetRequest,
  CreateBudgetIncomeRequest,
  UpdateBudgetIncomeRequest,
  CreateBudgetExpenseRequest,
  UpdateBudgetExpenseRequest,
  CreateBudgetSavingsRequest,
  UpdateBudgetSavingsRequest,
  BudgetIncome,
  BudgetExpense,
  BudgetSavings,
} from './types'

// Budget CRUD
export async function getBudgets(): Promise<BudgetListResponse> {
  return apiGet('/budgets')
}

export async function getBudget(id: string): Promise<BudgetDetail> {
  return apiGet(`/budgets/${id}`)
}

export async function createBudget(data: CreateBudgetRequest): Promise<BudgetSummary> {
  return apiPost('/budgets', data)
}

export async function deleteBudget(id: string): Promise<void> {
  return apiDelete(`/budgets/${id}`)
}

export async function lockBudget(id: string): Promise<BudgetDetail> {
  return apiPut(`/budgets/${id}/lock`)
}

export async function unlockBudget(id: string): Promise<BudgetDetail> {
  return apiPut(`/budgets/${id}/unlock`)
}

// Income
export async function addIncome(budgetId: string, data: CreateBudgetIncomeRequest): Promise<BudgetIncome> {
  return apiPost(`/budgets/${budgetId}/income`, data)
}

export async function updateIncome(budgetId: string, incomeId: string, data: UpdateBudgetIncomeRequest): Promise<BudgetIncome> {
  return apiPut(`/budgets/${budgetId}/income/${incomeId}`, data)
}

export async function deleteIncome(budgetId: string, incomeId: string): Promise<void> {
  return apiDelete(`/budgets/${budgetId}/income/${incomeId}`)
}

// Expenses
export async function addExpense(budgetId: string, data: CreateBudgetExpenseRequest): Promise<BudgetExpense> {
  return apiPost(`/budgets/${budgetId}/expenses`, data)
}

export async function updateExpense(budgetId: string, expenseId: string, data: UpdateBudgetExpenseRequest): Promise<BudgetExpense> {
  return apiPut(`/budgets/${budgetId}/expenses/${expenseId}`, data)
}

export async function deleteExpense(budgetId: string, expenseId: string): Promise<void> {
  return apiDelete(`/budgets/${budgetId}/expenses/${expenseId}`)
}

// Savings
export async function addSavings(budgetId: string, data: CreateBudgetSavingsRequest): Promise<BudgetSavings> {
  return apiPost(`/budgets/${budgetId}/savings`, data)
}

export async function updateSavings(budgetId: string, savingsId: string, data: UpdateBudgetSavingsRequest): Promise<BudgetSavings> {
  return apiPut(`/budgets/${budgetId}/savings/${savingsId}`, data)
}

export async function deleteSavings(budgetId: string, savingsId: string): Promise<void> {
  return apiDelete(`/budgets/${budgetId}/savings/${savingsId}`)
}
