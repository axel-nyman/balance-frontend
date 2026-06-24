import { apiGet, apiPost, apiPut } from './client'
import type {
  SavingsGoal,
  SavingsGoalListResponse,
  GoalAllocationHistoryResponse,
  CreateSavingsGoalRequest,
  UpdateSavingsGoalRequest,
  AllocateRequest,
  ArchiveSavingsGoalRequest,
} from './types'

export async function getGoals(): Promise<SavingsGoalListResponse> {
  return apiGet('/savings-goals')
}

export async function getGoal(id: string): Promise<SavingsGoal> {
  return apiGet(`/savings-goals/${id}`)
}

export async function getGoalHistory(id: string): Promise<GoalAllocationHistoryResponse> {
  return apiGet(`/savings-goals/${id}/history`)
}

export async function createGoal(data: CreateSavingsGoalRequest): Promise<SavingsGoal> {
  return apiPost('/savings-goals', data)
}

export async function updateGoal(id: string, data: UpdateSavingsGoalRequest): Promise<SavingsGoal> {
  return apiPut(`/savings-goals/${id}`, data)
}

export async function allocateToGoal(id: string, data: AllocateRequest): Promise<SavingsGoal> {
  return apiPost(`/savings-goals/${id}/allocations`, data)
}

export async function archiveGoal(id: string, data: ArchiveSavingsGoalRequest): Promise<SavingsGoal> {
  return apiPost(`/savings-goals/${id}/archive`, data)
}
