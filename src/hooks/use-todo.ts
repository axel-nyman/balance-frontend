import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from './query-keys'
import { getTodoList, updateTodoItem } from '@/api'
import type { UpdateTodoItemRequest, TodoList } from '@/api'

export function useTodoList(budgetId: string) {
  return useQuery({
    queryKey: queryKeys.budgets.todo(budgetId),
    queryFn: () => getTodoList(budgetId),
    enabled: !!budgetId,
  })
}

export function useUpdateTodoItem(budgetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: UpdateTodoItemRequest }) =>
      updateTodoItem(budgetId, itemId, data),
    // Optimistic update
    onMutate: async ({ itemId, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.budgets.todo(budgetId) })

      const previousTodo = queryClient.getQueryData<TodoList>(
        queryKeys.budgets.todo(budgetId)
      )

      if (previousTodo) {
        queryClient.setQueryData<TodoList>(
          queryKeys.budgets.todo(budgetId),
          {
            ...previousTodo,
            items: previousTodo.items.map((item) =>
              item.id === itemId
                ? { ...item, status: data.status, completedAt: data.status === 'COMPLETED' ? new Date().toISOString() : null }
                : item
            ),
          }
        )
      }

      return { previousTodo }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTodo) {
        queryClient.setQueryData(
          queryKeys.budgets.todo(budgetId),
          context.previousTodo
        )
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.todo(budgetId) })
    },
  })
}
