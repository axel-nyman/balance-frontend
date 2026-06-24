import { useNavigate } from 'react-router'
import { CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GoalProgress } from './GoalProgress'
import { goalDetailPath } from '@/routes'
import { formatDate } from '@/lib/utils'
import type { SavingsGoal } from '@/api/types'

interface GoalCardProps {
  goal: SavingsGoal
}

export function GoalCard({ goal }: GoalCardProps) {
  const navigate = useNavigate()

  const accountNames = goal.allocations.map((a) => a.bankAccountName)

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(goalDetailPath(goal.id))}
    >
      <CardContent>
        <div className="flex justify-between items-start mb-3 gap-2">
          <h3 className="font-semibold text-lg tracking-tight text-foreground truncate">
            {goal.name}
          </h3>
          {goal.completed && (
            <Badge variant="default" className="flex items-center gap-1 shrink-0 bg-income">
              <CheckCircle2 className="w-3 h-3" />
              Complete
            </Badge>
          )}
        </div>

        <GoalProgress goal={goal} />

        {goal.endDate && (
          <p className="text-xs text-muted-foreground mt-3">
            Target date {formatDate(goal.endDate)}
          </p>
        )}

        <p className="text-xs text-muted-foreground mt-1 truncate">
          {accountNames.length > 0
            ? `Backed by ${accountNames.join(', ')}`
            : 'No money allocated yet'}
        </p>
      </CardContent>
    </Card>
  )
}
