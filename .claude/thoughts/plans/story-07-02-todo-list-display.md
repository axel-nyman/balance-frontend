# Story 7.2: Todo Progress Indicator

**As a** user  
**I want to** see my progress on the todo list  
**So that** I know how much is left to do

### Acceptance Criteria

- [ ] Shows progress bar
- [ ] Shows "X of Y completed" text
- [ ] Shows percentage
- [ ] Progress bar fills based on completion
- [ ] Green color when 100% complete

### Implementation

**Create `src/components/todo/TodoProgress.tsx`:**

```typescript
import { CheckCircle2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { TodoItem } from '@/api/types'

interface TodoProgressProps {
  items: TodoItem[]
}

export function TodoProgress({ items }: TodoProgressProps) {
  const total = items.length
  const completed = items.filter((item) => item.status === 'COMPLETED').length
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  const isComplete = completed === total && total > 0

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className={cn(
              'w-5 h-5',
              isComplete ? 'text-green-600' : 'text-gray-400'
            )} />
            <span className="font-medium text-gray-900">
              {completed} of {total} completed
            </span>
          </div>
          <span className={cn(
            'text-sm font-semibold',
            isComplete ? 'text-green-600' : 'text-gray-600'
          )}>
            {percentage}%
          </span>
        </div>
        <Progress 
          value={percentage} 
          className={cn(
            'h-2',
            isComplete && '[&>div]:bg-green-600'
          )}
        />
      </CardContent>
    </Card>
  )
}
```

### Test File: `src/components/todo/TodoProgress.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { TodoProgress } from './TodoProgress'
import type { TodoItem } from '@/api/types'

const createItem = (status: 'PENDING' | 'COMPLETED'): TodoItem => ({
  id: crypto.randomUUID(),
  type: 'PAYMENT',
  name: 'Test Payment',
  amount: 100,
  status,
  fromAccount: { id: 'acc-1', name: 'Main Account' },
  toAccount: null,
  completedAt: status === 'COMPLETED' ? '2025-03-15T10:30:00Z' : null,
  createdAt: '2025-03-01T00:00:00Z',
})

describe('TodoProgress', () => {
  it('shows completion count', () => {
    const items = [
      createItem('COMPLETED'),
      createItem('PENDING'),
      createItem('PENDING'),
    ]

    render(<TodoProgress items={items} />)
    
    expect(screen.getByText(/1 of 3 completed/i)).toBeInTheDocument()
  })

  it('shows percentage', () => {
    const items = [
      createItem('COMPLETED'),
      createItem('COMPLETED'),
      createItem('PENDING'),
      createItem('PENDING'),
    ]

    render(<TodoProgress items={items} />)
    
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('shows 0% when no items completed', () => {
    const items = [
      createItem('PENDING'),
      createItem('PENDING'),
    ]

    render(<TodoProgress items={items} />)
    
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('shows 100% when all items completed', () => {
    const items = [
      createItem('COMPLETED'),
      createItem('COMPLETED'),
    ]

    render(<TodoProgress items={items} />)
    
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('handles empty items array', () => {
    render(<TodoProgress items={[]} />)
    
    expect(screen.getByText(/0 of 0 completed/i)).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('applies green styling when complete', () => {
    const items = [
      createItem('COMPLETED'),
      createItem('COMPLETED'),
    ]

    const { container } = render(<TodoProgress items={items} />)
    
    expect(container.querySelector('.text-green-600')).toBeInTheDocument()
  })
})
```

### Definition of Done

- [ ] Tests pass
- [ ] Progress bar renders
- [ ] Completion count accurate
- [ ] Percentage calculated correctly
- [ ] Green styling at 100%

---