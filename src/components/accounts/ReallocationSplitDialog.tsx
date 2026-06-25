import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import type { ReallocationConflictResponse, ReallocationEntry } from '@/api/types'

interface ReallocationSplitDialogProps {
  conflict: ReallocationConflictResponse
  isPending: boolean
  error?: string | null
  onConfirm: (entries: ReallocationEntry[]) => void
  onCancel: () => void
}

const EPSILON = 0.005

/**
 * Shown when a manual balance decrease over-allocates an account backed by two
 * or more goals (item 070d). The user chooses how to reduce each goal's earmark;
 * the entered reductions must sum to the required reduction before the balance
 * change can complete.
 */
export function ReallocationSplitDialog({
  conflict,
  isPending,
  error,
  onConfirm,
  onCancel,
}: ReallocationSplitDialogProps) {
  const [amounts, setAmounts] = useState<Record<string, string>>({})

  const enteredTotal = useMemo(
    () =>
      conflict.goals.reduce((sum, g) => {
        const value = Number(amounts[g.savingsGoalId])
        return sum + (Number.isFinite(value) && value > 0 ? value : 0)
      }, 0),
    [amounts, conflict.goals]
  )

  const remaining = conflict.requiredReduction - enteredTotal

  const overAllocatedGoal = conflict.goals.find((g) => {
    const value = Number(amounts[g.savingsGoalId])
    return Number.isFinite(value) && value > g.currentAllocation + EPSILON
  })

  const isValid = Math.abs(remaining) < EPSILON && !overAllocatedGoal

  const handleConfirm = () => {
    const entries: ReallocationEntry[] = conflict.goals
      .map((g) => ({ savingsGoalId: g.savingsGoalId, changeBy: -Number(amounts[g.savingsGoalId] || 0) }))
      .filter((e) => e.changeBy < 0)
    onConfirm(entries)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reduce goal allocations</DialogTitle>
          <DialogDescription>
            {conflict.accountName}’s new balance of {formatCurrency(conflict.newBalance)} no longer
            covers the {formatCurrency(conflict.totalAllocated)} earmarked across these goals. Choose
            how to reduce them by {formatCurrency(conflict.requiredReduction)}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {conflict.goals.map((goal) => (
            <div key={goal.savingsGoalId} className="space-y-2">
              <Label htmlFor={`reduce-${goal.savingsGoalId}`}>
                {goal.goalName}{' '}
                <span className="text-muted-foreground">
                  (currently {formatCurrency(goal.currentAllocation)})
                </span>
              </Label>
              <Input
                id={`reduce-${goal.savingsGoalId}`}
                type="number"
                step="0.01"
                min="0"
                max={goal.currentAllocation}
                placeholder="0"
                value={amounts[goal.savingsGoalId] ?? ''}
                onChange={(e) =>
                  setAmounts((prev) => ({ ...prev, [goal.savingsGoalId]: e.target.value }))
                }
              />
            </div>
          ))}

          <p className="text-sm text-muted-foreground" aria-live="polite">
            {Math.abs(remaining) < EPSILON
              ? 'Reduction matches the required amount.'
              : `${formatCurrency(Math.abs(remaining))} ${remaining > 0 ? 'still to allocate' : 'over the required reduction'}.`}
          </p>

          {overAllocatedGoal && (
            <p className="text-sm text-destructive">
              {overAllocatedGoal.goalName} cannot be reduced by more than its current allocation.
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!isValid || isPending}>
            {isPending ? 'Updating...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
