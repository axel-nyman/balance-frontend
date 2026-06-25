import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useUpdateBalance, useGoals } from '@/hooks'
import { formatCurrency } from '@/lib/utils'
import { ApiClientError } from '@/api'
import type {
  BankAccount,
  BalanceUpdateResponse,
  ReallocationConflictResponse,
  ReallocationEntry,
} from '@/api/types'
import { updateBalanceSchema, type UpdateBalanceFormData } from './schemas'
import { ReallocationSplitDialog } from './ReallocationSplitDialog'

interface UpdateBalanceModalProps {
  account: BankAccount
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface BackingGoal {
  id: string
  name: string
  allocated: number
}

const EPSILON = 0.005

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

function isReallocationConflict(body: unknown): body is ReallocationConflictResponse {
  return (
    !!body &&
    typeof body === 'object' &&
    'goals' in body &&
    'requiredReduction' in body
  )
}

export function UpdateBalanceModal({ account, open, onOpenChange }: UpdateBalanceModalProps) {
  const updateBalance = useUpdateBalance()
  const { data: goalsData } = useGoals()

  const backingGoals: BackingGoal[] = useMemo(() => {
    return (goalsData?.goals ?? [])
      .filter((g) => g.status === 'ACTIVE')
      .map((g) => {
        const alloc = g.allocations.find((a) => a.bankAccountId === account.id)
        return alloc ? { id: g.id, name: g.name, allocated: alloc.amount } : null
      })
      .filter((g): g is BackingGoal => g !== null)
  }, [goalsData, account.id])

  const allocatedTotal = backingGoals.reduce((sum, g) => sum + g.allocated, 0)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UpdateBalanceFormData>({
    resolver: zodResolver(updateBalanceSchema),
    defaultValues: {
      newBalance: account.currentBalance,
      date: getTodayString(),
      comment: '',
    },
  })

  const watchedBalance = watch('newBalance')
  const increase =
    typeof watchedBalance === 'number' && !isNaN(watchedBalance)
      ? watchedBalance - account.currentBalance
      : 0
  const isIncrease = increase > EPSILON
  const showEarmark = isIncrease && backingGoals.length > 0
  const singleGoal = backingGoals.length === 1
  const fullyAllocated = singleGoal && Math.abs(allocatedTotal - account.currentBalance) < EPSILON

  // Increase-earmark UI state.
  const [earmarkSingle, setEarmarkSingle] = useState(false)
  const [distribution, setDistribution] = useState<Record<string, string>>({})

  // Default the single-goal checkbox on only when the account was fully earmarked
  // toward that goal (the increase almost certainly belongs to it); otherwise off.
  useEffect(() => {
    if (showEarmark && singleGoal) {
      setEarmarkSingle(fullyAllocated)
    }
  }, [showEarmark, singleGoal, fullyAllocated])

  const distributionTotal = backingGoals.reduce((sum, g) => {
    const value = Number(distribution[g.id])
    return sum + (Number.isFinite(value) && value > 0 ? value : 0)
  }, 0)
  const distributionExceeds =
    showEarmark && !singleGoal && distributionTotal > increase + EPSILON

  // Deficit reallocation (decrease over a multi-goal account) state.
  const [conflict, setConflict] = useState<ReallocationConflictResponse | null>(null)
  const [pendingData, setPendingData] = useState<UpdateBalanceFormData | null>(null)
  const [splitError, setSplitError] = useState<string | null>(null)

  const resetEarmarkState = () => {
    setEarmarkSingle(false)
    setDistribution({})
  }

  const notifyAdjustments = (res: BalanceUpdateResponse) => {
    const adjustments = res.allocationAdjustments ?? []
    if (adjustments.length === 0) {
      toast.success('Balance updated')
      return
    }
    const description = adjustments
      .map(
        (a) =>
          `${a.changeAmount < 0 ? '−' : '+'}${formatCurrency(Math.abs(a.changeAmount))} ${a.goalName}`
      )
      .join('; ')
    toast.success('Balance updated', {
      description: `Goal allocations: ${description}`,
      classNames: { description: 'text-foreground!' },
    })
  }

  const buildIncreaseReallocation = (delta: number): ReallocationEntry[] | undefined => {
    if (!showEarmark) return undefined
    if (singleGoal) {
      return earmarkSingle ? [{ savingsGoalId: backingGoals[0].id, changeBy: delta }] : undefined
    }
    const entries = backingGoals
      .map((g) => ({ savingsGoalId: g.id, changeBy: Number(distribution[g.id] || 0) }))
      .filter((e) => Number.isFinite(e.changeBy) && e.changeBy > 0)
    return entries.length > 0 ? entries : undefined
  }

  const performUpdate = async (data: UpdateBalanceFormData, reallocation?: ReallocationEntry[]) => {
    const res = await updateBalance.mutateAsync({
      id: account.id,
      data: {
        newBalance: data.newBalance,
        date: data.date,
        comment: data.comment || undefined,
        reallocation,
      },
    })
    notifyAdjustments(res)
    closeAll(data.newBalance)
  }

  const onSubmit = async (data: UpdateBalanceFormData) => {
    if (distributionExceeds) return
    const delta = data.newBalance - account.currentBalance
    try {
      await performUpdate(data, buildIncreaseReallocation(delta))
    } catch (err) {
      const conflictBody =
        err instanceof ApiClientError && err.status === 409 ? err.body : undefined
      if (isReallocationConflict(conflictBody)) {
        setPendingData(data)
        setConflict(conflictBody)
      }
      // Other errors surface inline via updateBalance.error.
    }
  }

  const handleSplitConfirm = async (entries: ReallocationEntry[]) => {
    if (!pendingData) return
    setSplitError(null)
    try {
      await performUpdate(pendingData, entries)
    } catch (err) {
      setSplitError(err instanceof ApiClientError ? err.userMessage : 'Failed to update balance')
    }
  }

  const closeAll = (newBalance?: number) => {
    reset({
      newBalance: newBalance ?? account.currentBalance,
      date: getTodayString(),
      comment: '',
    })
    resetEarmarkState()
    setConflict(null)
    setPendingData(null)
    setSplitError(null)
    onOpenChange(false)
  }

  const handleClose = () => {
    reset()
    resetEarmarkState()
    setConflict(null)
    setPendingData(null)
    setSplitError(null)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Balance</DialogTitle>
          </DialogHeader>

          <div className="mb-4 p-3 bg-muted rounded-xl">
            <p className="text-sm text-muted-foreground">{account.name}</p>
            <p className="text-lg font-medium">
              Current: {formatCurrency(account.currentBalance)}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newBalance">New Balance *</Label>
              <Input
                id="newBalance"
                type="number"
                step="0.01"
                {...register('newBalance', { valueAsNumber: true })}
                autoFocus
              />
              {errors.newBalance && (
                <p className="text-sm text-destructive">{errors.newBalance.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                max={getTodayString()}
                {...register('date')}
              />
              {errors.date && (
                <p className="text-sm text-destructive">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Comment</Label>
              <Input
                id="comment"
                {...register('comment')}
                placeholder="e.g., Reconciled with bank statement"
              />
            </div>

            {showEarmark && singleGoal && (
              <div className="flex items-start gap-3 rounded-xl border p-3">
                <Checkbox
                  id="earmark-single"
                  checked={earmarkSingle}
                  onCheckedChange={(checked) => setEarmarkSingle(checked === true)}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="earmark-single"
                  className="flex-1 space-y-0.5 font-normal leading-snug"
                >
                  <span className="block">
                    Earmark this increase toward{' '}
                    <span className="font-medium">{backingGoals[0].name}</span>
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    +{formatCurrency(increase)}
                  </span>
                </Label>
              </div>
            )}

            {showEarmark && !singleGoal && (
              <div className="space-y-3 rounded-xl border p-3">
                <p className="text-sm text-muted-foreground">
                  Earmark some of the {formatCurrency(increase)} increase toward your goals
                  (optional):
                </p>
                {backingGoals.map((goal) => (
                  <div key={goal.id} className="space-y-1">
                    <Label htmlFor={`earmark-${goal.id}`} className="font-normal">
                      {goal.name}
                    </Label>
                    <Input
                      id={`earmark-${goal.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={distribution[goal.id] ?? ''}
                      onChange={(e) =>
                        setDistribution((prev) => ({ ...prev, [goal.id]: e.target.value }))
                      }
                    />
                  </div>
                ))}
                {distributionExceeds && (
                  <p className="text-sm text-destructive">
                    Earmarked amount cannot exceed the {formatCurrency(increase)} increase.
                  </p>
                )}
              </div>
            )}

            {updateBalance.error && !conflict && (
              <p className="text-sm text-destructive">
                {updateBalance.error.message}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateBalance.isPending || distributionExceeds}>
                {updateBalance.isPending ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {conflict && (
        <ReallocationSplitDialog
          conflict={conflict}
          isPending={updateBalance.isPending}
          error={splitError}
          onConfirm={handleSplitConfirm}
          onCancel={() => {
            setConflict(null)
            setPendingData(null)
            setSplitError(null)
          }}
        />
      )}
    </>
  )
}
