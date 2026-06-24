import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared'
import { GoalGrid, GoalModal } from '@/components/goals'
import { useGoals } from '@/hooks'

export function GoalsPage() {
  const { data, isLoading, isError, refetch } = useGoals()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <div>
      <PageHeader
        title="Goals"
        description="Earmark money for what you're saving towards"
        action={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Goal
          </Button>
        }
      />

      <GoalGrid
        goals={data?.goals ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onCreateNew={() => setIsCreateModalOpen(true)}
      />

      <GoalModal goal={null} open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
    </div>
  )
}
