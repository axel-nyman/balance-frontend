import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateTodoItem } from '@/hooks'
import { formatCurrencySmart } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { TodoItem } from '@/api/types'

interface TodoItemRowProps {
  budgetId: string
  item: TodoItem
  onUpdateBalance?: () => void
}

function getDisplayName(item: TodoItem): string {
  if (item.type === 'TRANSFER') {
    const from = item.fromAccount.name
    const to = item.toAccount?.name ?? ''
    return `${from} → ${to}`
  }
  // Payment: extract payee from backend name like "Pay Netflix (100.00) from Checking"
  return item.name.replace(/^Pay /, '').replace(/ \(.*$/, '')
}

export function TodoItemRow({ budgetId, item, onUpdateBalance }: TodoItemRowProps) {
  const updateTodo = useUpdateTodoItem(budgetId)

  const isCompleted = item.status === 'COMPLETED'
  const isTransfer = item.type === 'TRANSFER'
  const displayName = getDisplayName(item)

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
        aria-label={`Mark "${displayName}" as ${isCompleted ? 'pending' : 'completed'}`}
      />

      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium transition-colors duration-200 animate-strikethrough',
          isCompleted
            ? 'text-muted-foreground line-through decoration-current'
            : 'text-foreground decoration-transparent'
        )}>
          {displayName}
        </p>
        <div className={cn(
          'inline-flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums transition-colors duration-200 animate-strikethrough',
          isCompleted
            ? 'line-through decoration-current'
            : 'decoration-transparent'
        )}>
          {isTransfer
            ? formatCurrencySmart(item.amount)
            : `${formatCurrencySmart(item.amount)} from ${item.fromAccount.name}`}
          {isTransfer && isCompleted && onUpdateBalance && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 no-underline"
              onClick={onUpdateBalance}
              title="Update account balance"
            >
              <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>
    </li>
  )
}
