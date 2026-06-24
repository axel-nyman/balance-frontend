import { Target } from 'lucide-react'
import { LoadingState, EmptyState, ErrorState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { GoalCard } from './GoalCard'
import type { SavingsGoal } from '@/api/types'

interface GoalGridProps {
  goals: SavingsGoal[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onCreateNew: () => void
}

export function GoalGrid({ goals, isLoading, isError, onRetry, onCreateNew }: GoalGridProps) {
  if (isLoading) {
    return <LoadingState variant="cards" rows={6} />
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load goals"
        message="We couldn't load your savings goals. Please try again."
        onRetry={onRetry}
      />
    )
  }

  if (goals.length === 0) {
    return (
      <EmptyState
        icon={<Target className="w-12 h-12" />}
        title="No savings goals yet"
        description="Create a goal to earmark money in your accounts for things you're saving towards."
        action={<Button onClick={onCreateNew}>Create Your First Goal</Button>}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} />
      ))}
    </div>
  )
}
