import { useNavigate } from 'react-router'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared'
import { BudgetGrid } from '@/components/budgets'
import { useBudgets } from '@/hooks/use-budgets'
import { useBudgetValidation } from '@/hooks/use-budget-validation'

export function BudgetsPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useBudgets()
  const { hasUnlockedBudget } = useBudgetValidation()

  const handleNewBudgetClick = () => {
    if (hasUnlockedBudget) {
      toast.error('You already have an unlocked budget. Lock or delete it before creating a new one.')
      return
    }
    navigate('/budgets/new')
  }

  return (
    <div>
      <PageHeader
        title="Budgets"
        description="Manage your monthly budgets"
        action={
          <Button
            onClick={handleNewBudgetClick}
            aria-disabled={hasUnlockedBudget}
            className={hasUnlockedBudget ? 'pointer-events-auto opacity-50' : ''}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Budget
          </Button>
        }
      />

      <BudgetGrid
        budgets={data?.budgets ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        onCreateNew={() => navigate('/budgets/new')}
      />
    </div>
  )
}
