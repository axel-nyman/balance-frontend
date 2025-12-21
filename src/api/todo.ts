import { apiGet, apiPut } from './client'
import type { TodoList, TodoItem, UpdateTodoItemRequest } from './types'

export async function getTodoList(budgetId: string): Promise<TodoList> {
  return apiGet(`/budgets/${budgetId}/todo-list`)
}

export async function updateTodoItem(
  budgetId: string,
  itemId: string,
  data: UpdateTodoItemRequest
): Promise<TodoItem> {
  return apiPut(`/budgets/${budgetId}/todo-list/items/${itemId}`, data)
}
