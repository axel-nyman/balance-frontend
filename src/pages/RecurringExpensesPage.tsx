import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared'

export function RecurringExpensesPage() {
  return (
    <div>
      <PageHeader
        title="Recurring Expenses"
        description="Manage templates for regular expenses"
        action={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Recurring Expense
          </Button>
        }
      />

      {/* List - to be implemented in 3.2 */}
      <div>
        {/* RecurringExpensesList component will go here */}
      </div>
    </div>
  )
}
