# Story 7.1: Todo List Page Shell

**As a** user  
**I want to** access the todo list for a locked budget  
**So that** I can see what payments I need to make

### Acceptance Criteria

- [ ] Page renders at `/budgets/:id/todo` route
- [ ] Shows budget month/year in title
- [ ] Shows "Back to Budget" link
- [ ] Loading state while fetching
- [ ] Error state if budget not found or not locked
- [ ] Empty state if no todo items

### Implementation

**Update `src/pages/TodoListPage.tsx`:**

```typescript
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/shared'
import { TodoProgress, TodoItemList } from '@/components/todo'
import { useBudgetTodo } from '@/hooks'
import { formatMonthYear } from '@/lib/utils'

export function TodoListPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: todoData, isLoading, isError, error, refetch } = useBudgetTodo(id!)

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
        <PageHeader
          title="Todo List"
          action={
            <Button variant="ghost" asChild>
              <Link to={`/budgets/${id}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Budget
              </Link>
            </Button>
          }
        />
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
          title={`Todo List — ${formatMonthYear(todoData?.month ?? 1, todoData?.year ?? 2025)}`}
          action={
            <Button variant="ghost" asChild>
              <Link to={`/budgets/${id}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Budget
              </Link>
            </Button>
          }
        />
        <EmptyState
          title="No todo items"
          description="This budget has no manual payments or savings transfers to track."
        />
      </div>
    )
  }

  const title = `Todo List — ${formatMonthYear(todoData.month, todoData.year)}`

  return (
    <div>
      <PageHeader
        title={title}
        description="Track your manual payments and savings transfers"
        action={
          <Button variant="ghost" asChild>
            <Link to={`/budgets/${id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Budget
            </Link>
          </Button>
        }
      />

      <div className="space-y-6">
        <TodoProgress items={todoData.items} />
        <TodoItemList budgetId={id!} items={todoData.items} />
      </div>
    </div>
  )
}
```

### Test File: `src/pages/TodoListPage.test.tsx`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import { TodoListPage } from './TodoListPage'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const mockTodoData = {
  id: 'todolist-1',
  budgetId: '123',
  createdAt: '2025-03-01T00:00:00Z',
  items: [
    {
      id: 'todo-1',
      type: 'PAYMENT',
      name: 'Pay Rent',
      amount: 8000,
      status: 'PENDING',
      fromAccount: { id: 'acc-main', name: 'Main Account' },
      toAccount: null,
      completedAt: null,
      createdAt: '2025-03-01T00:00:00Z',
    },
    {
      id: 'todo-2',
      type: 'TRANSFER',
      name: 'Transfer to Savings Account',
      amount: 5000,
      status: 'COMPLETED',
      fromAccount: { id: 'acc-main', name: 'Main Account' },
      toAccount: { id: 'acc-savings', name: 'Savings Account' },
      completedAt: '2025-03-15T10:30:00Z',
      createdAt: '2025-03-01T00:00:00Z',
    },
  ],
  summary: {
    totalItems: 2,
    pendingItems: 1,
    completedItems: 1,
  },
}

function renderWithRouter(budgetId = '123') {
  return render(
    <MemoryRouter initialEntries={[`/budgets/${budgetId}/todo`]}>
      <Routes>
        <Route path="/budgets/:id/todo" element={<TodoListPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('TodoListPage', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/budgets/123/todo-list', () => {
        return HttpResponse.json(mockTodoData)
      })
    )
  })

  it('shows loading state initially', () => {
    renderWithRouter()
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays budget month and year in title', async () => {
    renderWithRouter()
    
    await waitFor(() => {
      expect(screen.getByText(/mars 2025/i)).toBeInTheDocument()
    })
  })

  it('shows back to budget link', async () => {
    renderWithRouter()
    
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /back to budget/i })).toBeInTheDocument()
    })
  })

  it('shows todo items', async () => {
    renderWithRouter()
    
    await waitFor(() => {
      expect(screen.getByText('Pay Rent')).toBeInTheDocument()
      expect(screen.getByText(/transfer to savings/i)).toBeInTheDocument()
    })
  })

  it('shows error for non-locked budget', async () => {
    server.use(
      http.get('/api/budgets/123/todo', () => {
        return HttpResponse.json(
          { error: 'Budget is not locked' },
          { status: 400 }
        )
      })
    )

    renderWithRouter()
    
    await waitFor(() => {
      expect(screen.getByText(/must be locked/i)).toBeInTheDocument()
    })
  })

  it('shows empty state when no todo items', async () => {
    server.use(
      http.get('/api/budgets/123/todo', () => {
        return HttpResponse.json({
          ...mockTodoData,
          items: [],
        })
      })
    )

    renderWithRouter()
    
    await waitFor(() => {
      expect(screen.getByText(/no todo items/i)).toBeInTheDocument()
    })
  })
})
```

### Definition of Done

- [ ] Tests pass
- [ ] Page loads todo data
- [ ] Title shows month/year
- [ ] Back link works
- [ ] Loading, error, empty states work

---