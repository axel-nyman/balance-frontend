import { useEffect } from 'react'
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
import { AccountSelect } from '@/components/accounts'
import { useCreateGoal, useUpdateGoal, useAccounts } from '@/hooks'
import { formatCurrency } from '@/lib/utils'
import type { SavingsGoal, CreateSavingsGoalRequest } from '@/api/types'
import {
  createGoalFormSchema,
  optionalAmountSetValueAs,
  type CreateGoalFormData,
} from './schemas'

interface GoalModalProps {
  goal: SavingsGoal | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EMPTY_FORM: CreateGoalFormData = {
  name: '',
  targetAmount: undefined,
  endDate: '',
  seedAccountId: '',
  seedAmount: undefined,
}

export function GoalModal({ goal, open, onOpenChange }: GoalModalProps) {
  const isEditing = goal !== null
  const createGoal = useCreateGoal()
  const updateGoal = useUpdateGoal(goal?.id ?? '')
  const { data: accountsData } = useAccounts()
  const accounts = accountsData?.accounts ?? []

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CreateGoalFormData>({
    resolver: zodResolver(createGoalFormSchema),
    defaultValues: EMPTY_FORM,
  })

  useEffect(() => {
    if (goal) {
      reset({
        name: goal.name,
        targetAmount: goal.targetAmount ?? undefined,
        endDate: goal.endDate ?? '',
        seedAccountId: '',
        seedAmount: undefined,
      })
    } else {
      reset(EMPTY_FORM)
    }
  }, [goal, open, reset])

  const seedAccountId = watch('seedAccountId')
  const selectedAccount = accounts.find((a) => a.id === seedAccountId)

  const mutation = isEditing ? updateGoal : createGoal

  const onSubmit = async (data: CreateGoalFormData) => {
    if (!isEditing && data.seedAmount && data.seedAmount > 0) {
      if (!data.seedAccountId) {
        setError('seedAccountId', { message: 'Select an account to allocate from' })
        return
      }
      const account = accounts.find((a) => a.id === data.seedAccountId)
      const unallocated = account?.unallocatedAmount ?? 0
      if (account && data.seedAmount > unallocated) {
        setError('seedAmount', {
          message: `Only ${formatCurrency(unallocated)} unallocated in ${account.name}`,
        })
        return
      }
    }

    try {
      if (isEditing) {
        await updateGoal.mutateAsync({
          name: data.name,
          targetAmount: data.targetAmount,
          endDate: data.endDate || undefined,
        })
        toast.success('Goal updated')
      } else {
        const payload: CreateSavingsGoalRequest = {
          name: data.name,
          targetAmount: data.targetAmount,
          endDate: data.endDate || undefined,
          allocations:
            data.seedAmount && data.seedAmount > 0 && data.seedAccountId
              ? [{ bankAccountId: data.seedAccountId, amount: data.seedAmount }]
              : undefined,
        }
        await createGoal.mutateAsync(payload)
        toast.success('Goal created')
      }
      reset(EMPTY_FORM)
      onOpenChange(false)
    } catch {
      // Error surfaced inline via mutation.error
    }
  }

  const handleClose = () => {
    reset(EMPTY_FORM)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Goal' : 'New Goal'}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.stopPropagation()
            handleSubmit(onSubmit)(e)
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register('name')} placeholder="e.g., Summer trip" autoFocus />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAmount">Target amount</Label>
            <Input
              id="targetAmount"
              type="number"
              step="0.01"
              {...register('targetAmount', { setValueAs: optionalAmountSetValueAs })}
              placeholder="Optional"
            />
            {errors.targetAmount && (
              <p className="text-sm text-destructive">{errors.targetAmount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Target date</Label>
            <Input id="endDate" type="date" {...register('endDate')} />
          </div>

          {!isEditing && (
            <div className="space-y-3 rounded-xl border border-border p-3">
              <p className="text-sm font-medium text-foreground">Initial allocation (optional)</p>
              <div className="space-y-2">
                <Label htmlFor="seedAccountId">From account</Label>
                <AccountSelect
                  value={seedAccountId ?? ''}
                  onValueChange={(accountId) => setValue('seedAccountId', accountId)}
                  placeholder="Select account"
                  label="From account"
                />
                {errors.seedAccountId && (
                  <p className="text-sm text-destructive">{errors.seedAccountId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="seedAmount">Amount</Label>
                <Input
                  id="seedAmount"
                  type="number"
                  step="0.01"
                  {...register('seedAmount', { setValueAs: optionalAmountSetValueAs })}
                  placeholder="0.00"
                />
                {selectedAccount && (
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(selectedAccount.unallocatedAmount ?? 0)} unallocated in{' '}
                    {selectedAccount.name}
                  </p>
                )}
                {errors.seedAmount && (
                  <p className="text-sm text-destructive">{errors.seedAmount.message}</p>
                )}
              </div>
            </div>
          )}

          {mutation.error && (
            <p className="text-sm text-destructive">{mutation.error.message}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : isEditing ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
