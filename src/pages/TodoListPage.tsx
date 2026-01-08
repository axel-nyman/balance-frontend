import { useParams, Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/shared'
import { TodoProgress, TodoItemList } from '@/components/todo'
import { useBudget, useTodoList } from '@/hooks'
import { formatMonthYear } from '@/lib/utils'

export function TodoListPage() {
  const { id } = useParams<{ id: string }>()
  const { data: budget, isLoading: budgetLoading, isError: budgetError } = useBudget(id!)
  const { data: todoData, isLoading: todoLoading, isError: todoError, error, refetch } = useTodoList(id!)

  const isLoading = budgetLoading || todoLoading
  const isError = budgetError || todoError

  const backLink = (
    <Button variant="ghost" size="sm" asChild className="-ml-2">
      <Link to={`/budgets/${id}`}>
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Budget
      </Link>
    </Button>
  )

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Loading..." />
        <LoadingState variant="cards" />
      </div>
    )
  }

  if (isError) {
    const errorMessage = error?.message || 'Failed to load todo list'
    const isNotLocked = errorMessage.toLowerCase().includes('not locked')

    return (
      <div>
        <PageHeader title="Todo List" backLink={backLink} />
        <ErrorState
          title={isNotLocked ? 'Budget Not Locked' : 'Error Loading Todo List'}
          message={isNotLocked
            ? 'This budget must be locked before you can view its todo list.'
            : errorMessage
          }
          onRetry={isNotLocked ? undefined : refetch}
        />
      </div>
    )
  }

  if (!todoData || todoData.items.length === 0) {
    return (
      <div>
        <PageHeader
          title={`Todo List — ${formatMonthYear(budget?.month ?? 1, budget?.year ?? 2025)}`}
          backLink={backLink}
        />
        <EmptyState
          title="No todo items"
          description="This budget has no manual payments or savings transfers to track."
        />
      </div>
    )
  }

  const title = `Todo List — ${formatMonthYear(budget?.month ?? 1, budget?.year ?? 2025)}`

  return (
    <div>
      <PageHeader
        title={title}
        description="Track your manual payments and savings transfers"
        backLink={backLink}
      />

      <div className="space-y-6">
        <TodoProgress items={todoData.items} />
        <TodoItemList budgetId={id!} items={todoData.items} />
      </div>
    </div>
  )
}
