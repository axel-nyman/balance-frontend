import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
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
import { AccountSelect } from '@/components/accounts'
import { useAllocateToGoal, useAccounts } from '@/hooks'
import { formatCurrency } from '@/lib/utils'
import type { SavingsGoal } from '@/api/types'
import { allocateFormSchema, type AllocateFormData } from './schemas'
import { AllocationImpact } from './AllocationImpact'

interface AllocateModalProps {
  goal: SavingsGoal
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AllocateModal({ goal, open, onOpenChange }: AllocateModalProps) {
  const allocate = useAllocateToGoal(goal.id)
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
  } = useForm<AllocateFormData>({
    resolver: zodResolver(allocateFormSchema),
    defaultValues: { bankAccountId: '', amount: 0 },
  })

  useEffect(() => {
    reset({ bankAccountId: '', amount: 0 })
  }, [open, reset])

  const bankAccountId = watch('bankAccountId')
  const amountValue = watch('amount')
  const newAmount = Number.isFinite(amountValue) ? amountValue : 0
  const account = accounts.find((a) => a.id === bankAccountId)
  const currentAllocation =
    goal.allocations.find((a) => a.bankAccountId === bankAccountId)?.amount ?? 0
  // Allocation is an absolute earmark, so the most this account can hold is its
  // currently-unallocated money plus whatever it already earmarks for this goal.
  const maxSettable = account ? (account.unallocatedAmount ?? 0) + currentAllocation : 0

  const handleAccountChange = (accountId: string) => {
    setValue('bankAccountId', accountId)
    const existing = goal.allocations.find((a) => a.bankAccountId === accountId)?.amount ?? 0
    setValue('amount', existing)
  }

  const onSubmit = async (data: AllocateFormData) => {
    if (account && data.amount > maxSettable) {
      setError('amount', {
        message: `Only ${formatCurrency(maxSettable)} available from ${account.name}`,
      })
      return
    }
    try {
      await allocate.mutateAsync({ bankAccountId: data.bankAccountId, amount: data.amount })
      toast.success(data.amount === 0 ? 'Allocation removed' : 'Allocation updated')
      reset({ bankAccountId: '', amount: 0 })
      onOpenChange(false)
    } catch {
      // Error surfaced inline via allocate.error
    }
  }

  const handleClose = () => {
    reset({ bankAccountId: '', amount: 0 })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign money</DialogTitle>
          <DialogDescription>
            Earmark an account's money for this goal. Set the amount to zero to remove it.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.stopPropagation()
            handleSubmit(onSubmit)(e)
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="bankAccountId">Account *</Label>
            <AccountSelect
              value={bankAccountId}
              onValueChange={handleAccountChange}
              placeholder="Select account"
              label="Account"
            />
            {errors.bankAccountId && (
              <p className="text-sm text-destructive">{errors.bankAccountId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount earmarked *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">
              The total to earmark from this account for this goal. Set it to zero to remove the
              earmark.
            </p>
            {account && (
              <AllocationImpact
                account={account}
                currentAllocation={currentAllocation}
                newAmount={newAmount}
              />
            )}
            {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
          </div>

          {allocate.error && (
            <p className="text-sm text-destructive">{allocate.error.message}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={allocate.isPending}>
              {allocate.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
