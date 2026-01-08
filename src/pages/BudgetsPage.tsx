import { useNavigate } from 'react-router'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared'
import { BudgetGrid } from '@/components/budgets'
import { useBudgets } from '@/hooks/use-budgets'

export function BudgetsPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useBudgets()

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
