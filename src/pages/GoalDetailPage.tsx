import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { ArrowLeft, Pencil, Plus, Archive, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/shared'
import { GoalProgress, GoalModal, AllocateModal, ArchiveGoalDialog } from '@/components/goals'
import { useGoal } from '@/hooks'
import { ROUTES } from '@/routes'
import { formatCurrency, formatDate } from '@/lib/utils'

export function GoalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: goal, isLoading, isError, refetch } = useGoal(id!)

  const [editOpen, setEditOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)

  const backLink = (
    <Link
      to={ROUTES.GOALS}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="w-4 h-4" />
      Goals
    </Link>
  )

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Loading..." backLink={backLink} />
        <LoadingState variant="detail" />
      </div>
    )
  }

  if (isError || !goal) {
    return (
      <div>
        <PageHeader title="Goal Not Found" backLink={backLink} />
        <ErrorState
          title="Goal not found"
          message="This goal doesn't exist or has been deleted."
          onRetry={refetch}
        />
      </div>
    )
  }

  const isArchived = goal.status === 'ARCHIVED'

  return (
    <div>
      <PageHeader
        title={goal.name}
        backLink={backLink}
        description={
          <div className="flex items-center gap-2 mt-1">
            {isArchived && <Badge variant="secondary">Archived</Badge>}
            {goal.completed && (
              <Badge variant="default" className="flex items-center gap-1 bg-income">
                <CheckCircle2 className="w-3 h-3" />
                Complete
              </Badge>
            )}
          </div>
        }
        action={
          !isArchived && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button onClick={() => setAssignOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Assign money
              </Button>
            </div>
          )
        }
      />

      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardContent className="space-y-4">
            <GoalProgress goal={goal} showCaption />
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
              <div>
                <p className="text-sm text-muted-foreground">Allocated</p>
                <p className="text-lg tabular-nums text-foreground">
                  {formatCurrency(goal.totalAllocated)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target</p>
                <p className="text-lg tabular-nums text-foreground">
                  {goal.targetAmount !== null ? formatCurrency(goal.targetAmount) : '—'}
                </p>
              </div>
              {goal.endDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Target date</p>
                  <p className="text-foreground">{formatDate(goal.endDate)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-3">
            Backing accounts
          </h2>
          {goal.allocations.length === 0 ? (
            <EmptyState
              title="No money allocated"
              description={
                isArchived
                  ? 'This goal has no active allocations.'
                  : 'Assign money from an account to start funding this goal.'
              }
              action={
                !isArchived && (
                  <Button onClick={() => setAssignOpen(true)}>Assign money</Button>
                )
              }
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {goal.allocations.map((allocation) => (
                    <li
                      key={allocation.bankAccountId}
                      className="flex items-center justify-between p-4"
                    >
                      <span className="text-foreground">{allocation.bankAccountName}</span>
                      <span className="tabular-nums text-foreground">
                        {formatCurrency(allocation.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {!isArchived && (
          <div className="pt-2">
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => setArchiveOpen(true)}
            >
              <Archive className="w-4 h-4 mr-2" />
              Archive goal
            </Button>
          </div>
        )}
      </div>

      <GoalModal goal={goal} open={editOpen} onOpenChange={setEditOpen} />
      <AllocateModal goal={goal} open={assignOpen} onOpenChange={setAssignOpen} />
      <ArchiveGoalDialog
        goal={goal}
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        onArchived={() => navigate(ROUTES.GOALS)}
      />
    </div>
  )
}
