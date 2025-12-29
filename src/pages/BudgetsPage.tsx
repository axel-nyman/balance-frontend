import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared'

export function BudgetsPage() {
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader
        title="Budgets"
        description="Manage your monthly budgets"
        action={
          <Button onClick={() => navigate('/budgets/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Budget
          </Button>
        }
      />

      {/* Budget Grid - to be implemented in 4.2 */}
      <div>
        {/* BudgetGrid component will go here */}
      </div>
    </div>
  )
}
