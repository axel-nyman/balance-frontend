import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateTodoItem } from '@/hooks'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { TodoItem } from '@/api/types'

interface TodoItemRowProps {
  budgetId: string
  item: TodoItem
  onUpdateBalance?: () => void
}

export function TodoItemRow({ budgetId, item, onUpdateBalance }: TodoItemRowProps) {
  const updateTodo = useUpdateTodoItem(budgetId)

  const isCompleted = item.status === 'COMPLETED'
  const isTransfer = item.type === 'TRANSFER'

  const handleToggle = async () => {
    const newStatus = isCompleted ? 'PENDING' : 'COMPLETED'

    try {
      await updateTodo.mutateAsync({
        itemId: item.id,
        data: { status: newStatus },
      })
    } catch {
      toast.error('Failed to update item')
    }
  }

  return (
    <li className="flex items-center gap-3 py-3">
      <Checkbox
        checked={isCompleted}
        onCheckedChange={handleToggle}
        disabled={updateTodo.isPending}
        aria-label={`Mark "${item.name}" as ${isCompleted ? 'pending' : 'completed'}`}
      />

      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium text-foreground',
          isCompleted && 'line-through text-muted-foreground'
        )}>
          {item.name}
        </p>
        {isTransfer && item.toAccount && (
          <p className="text-sm text-muted-foreground">
            To: {item.toAccount.name}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn(
          'text-xs',
          isCompleted && 'opacity-50'
        )}>
          {isTransfer ? 'Transfer' : 'Payment'}
        </Badge>

        <span className={cn(
          'font-medium text-foreground tabular-nums',
          isCompleted && 'line-through text-muted-foreground'
        )}>
          {formatCurrency(item.amount)}
        </span>

        {isTransfer && isCompleted && onUpdateBalance && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onUpdateBalance}
            title="Update account balance"
          >
            <Wallet className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}
      </div>
    </li>
  )
}
