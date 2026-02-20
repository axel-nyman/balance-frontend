import { useState } from 'react'
import { ChevronDown, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface BudgetSectionItem {
  id: string
  label: string
  amount: number
  sublabel?: string
}

interface BudgetSectionProps {
  title: string
  items: BudgetSectionItem[]
  total: number
  totalColor: 'green' | 'red' | 'blue'
  isEditable: boolean
  onAdd?: () => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  emptyMessage?: string
}

export function BudgetSection({
  title,
  items,
  total,
  totalColor,
  isEditable,
  onAdd,
  onEdit,
  onDelete,
  emptyMessage = 'No items',
}: BudgetSectionProps) {
  const [isOpen, setIsOpen] = useState(true)

  const colorClasses = {
    green: 'text-income',
    red: 'text-expense',
    blue: 'text-savings',
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="overflow-hidden bg-card rounded-2xl shadow-sm">
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-accent rounded-t-2xl">
          <div className="flex items-center gap-2">
            <ChevronDown
              className={cn(
                'w-4 h-4 text-muted-foreground transition-transform duration-200',
                !isOpen && '-rotate-90'
              )}
            />
            <span className="font-medium text-foreground">{title}</span>
            <span className="text-sm text-muted-foreground">({items.length})</span>
          </div>
          <span className={cn('tabular-nums font-semibold', colorClasses[totalColor])}>
            {formatCurrency(total)}
          </span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-border">
          {items.length === 0 ? (
            isEditable && onAdd ? (
              <button
                onClick={onAdd}
                className="flex flex-col items-center justify-center w-full py-8 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors rounded-b-2xl"
              >
                <Plus className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Add {title.toLowerCase()}</span>
              </button>
            ) : (
              <p className="p-4 text-center text-muted-foreground">{emptyMessage}</p>
            )
          ) : (
            <>
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between px-6 py-3 hover:bg-accent"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{item.label}</p>
                      {item.sublabel && (
                        <p className="text-sm text-muted-foreground truncate">{item.sublabel}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="tabular-nums font-medium text-foreground">
                        {formatCurrency(item.amount)}
                      </span>
                      {isEditable && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit?.(item.id)}
                            aria-label={`Edit ${item.label}`}
                          >
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete?.(item.id)}
                            aria-label={`Delete ${item.label}`}
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {isEditable && onAdd && (
                <button
                  onClick={onAdd}
                  className="flex items-center gap-2 w-full px-6 py-3 text-muted-foreground hover:bg-accent hover:text-foreground border-t border-border transition-colors rounded-b-2xl"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Add {title.toLowerCase()}</span>
                </button>
              )}
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
