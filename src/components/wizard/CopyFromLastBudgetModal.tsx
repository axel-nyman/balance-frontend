import { useState, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatMonthYear } from '@/lib/utils'
import { useLastBudget } from '@/hooks/use-last-budget'
import type { BudgetIncome, BudgetSavings } from '@/api/types'

interface CopyFromLastBudgetModalProps<T> {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemType: 'income' | 'savings'
  onCopy: (items: T[]) => void
}

export function CopyFromLastBudgetModal<T extends BudgetIncome | BudgetSavings>({
  open,
  onOpenChange,
  itemType,
  onCopy,
}: CopyFromLastBudgetModalProps<T>) {
  const { lastBudget, isLoading } = useLastBudget()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const items = useMemo(() => {
    if (!lastBudget) return []
    return itemType === 'income' ? lastBudget.income : lastBudget.savings
  }, [lastBudget, itemType]) as T[]

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === items.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(items.map((item) => item.id)))
  }

  const handleCopy = () => {
    const selectedItems = items.filter((item) => selectedIds.has(item.id))
    onCopy(selectedItems)
    onOpenChange(false)
    setSelectedIds(new Set())
  }

  const title =
    itemType === 'income'
      ? 'Copy Income from Last Budget'
      : 'Copy Savings from Last Budget'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            {title}
          </DialogTitle>
          {lastBudget && (
            <p className="text-sm text-gray-500">
              From {formatMonthYear(lastBudget.month, lastBudget.year)}
            </p>
          )}
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No {itemType === 'income' ? 'income' : 'savings'} items in the
              last budget.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                <Checkbox
                  checked={selectedIds.size === items.length}
                  onCheckedChange={toggleAll}
                />
                <span className="text-sm font-medium">
                  Select all ({items.length})
                </span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleItem(item.id)}
                  >
                    <Checkbox checked={selectedIds.has(item.id)} />
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(item.amount)} • {item.bankAccount.name}
                      </p>
                    </div>
                    {selectedIds.has(item.id) && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCopy} disabled={selectedIds.size === 0}>
            Copy {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
