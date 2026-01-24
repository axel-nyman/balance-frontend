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
              isComplete ? 'text-income' : 'text-muted-foreground'
            )} />
            <span className="font-medium text-foreground">
              {completed} of {total} completed
            </span>
          </div>
          <span className={cn(
            'text-sm font-semibold',
            isComplete ? 'text-income' : 'text-muted-foreground'
          )}>
            {percentage}%
          </span>
        </div>
        <Progress
          value={percentage}
          className={cn(
            'h-2',
            isComplete && '[&>[data-slot=progress-indicator]]:bg-income'
          )}
        />
      </CardContent>
    </Card>
  )
}
