import type { TodoItem } from '@/api/types'

interface TodoItemListProps {
  budgetId: string
  items: TodoItem[]
}

export function TodoItemList({ budgetId: _budgetId, items }: TodoItemListProps) {
  // Placeholder - will be implemented in a later story
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">Todo Items</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <div key={item.id} className="p-4 flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900">{item.name}</span>
              <span className="ml-2 text-sm text-gray-500">{item.type}</span>
            </div>
            <span className={`text-sm ${item.status === 'COMPLETED' ? 'text-green-600' : 'text-gray-500'}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
