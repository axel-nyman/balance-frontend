import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react'
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
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg">
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
            <span className="font-medium text-gray-900">{title}</span>
            <span className="text-sm text-gray-500">({items.length})</span>
          </div>
          <span className={cn('font-semibold', colorClasses[totalColor])}>
            {formatCurrency(total)}
          </span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t">
          {items.length === 0 ? (
            isEditable && onAdd ? (
              <button
                onClick={onAdd}
                className="flex flex-col items-center justify-center w-full py-8 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
              >
                <Plus className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Add {title.toLowerCase()}</span>
              </button>
            ) : (
              <p className="p-4 text-center text-gray-500">{emptyMessage}</p>
            )
          ) : (
            <>
              <ul className="divide-y">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.label}</p>
                      {item.sublabel && (
                        <p className="text-sm text-gray-500 truncate">{item.sublabel}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="font-medium text-gray-900">
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
                            <Pencil className="w-4 h-4 text-gray-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete?.(item.id)}
                            aria-label={`Delete ${item.label}`}
                          >
                            <Trash2 className="w-4 h-4 text-gray-400" />
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
                  className="flex items-center gap-2 w-full px-4 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-700 border-t transition-colors"
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
