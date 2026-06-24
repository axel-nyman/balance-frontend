import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
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
import type { SavingsGoal, CreateSavingsGoalRequest, SeedAllocationRequest } from '@/api/types'
import { goalFormSchema, optionalAmountSetValueAs, type GoalFormData } from './schemas'
import { AllocationImpact } from './AllocationImpact'

interface GoalModalProps {
  goal: SavingsGoal | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EMPTY_FORM: GoalFormData = {
  name: '',
  targetAmount: undefined,
  endDate: '',
}

interface SeedRow {
  bankAccountId: string
  amount: string
}

const EMPTY_ROW: SeedRow = { bankAccountId: '', amount: '' }

export function GoalModal({ goal, open, onOpenChange }: GoalModalProps) {
  const isEditing = goal !== null
  const createGoal = useCreateGoal()
  const updateGoal = useUpdateGoal(goal?.id ?? '')
  const { data: accountsData } = useAccounts()
  const accounts = accountsData?.accounts ?? []

  // Initial allocations are create-only and validated against live account
  // balances, so they live in local state rather than the RHF/Zod form.
  const [seedRows, setSeedRows] = useState<SeedRow[]>([EMPTY_ROW])
  const [seedErrors, setSeedErrors] = useState<Record<number, string>>({})

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: EMPTY_FORM,
  })

  useEffect(() => {
    if (goal) {
      reset({
        name: goal.name,
        targetAmount: goal.targetAmount ?? undefined,
        endDate: goal.endDate ?? '',
      })
    } else {
      reset(EMPTY_FORM)
    }
    setSeedRows([EMPTY_ROW])
    setSeedErrors({})
  }, [goal, open, reset])

  const mutation = isEditing ? updateGoal : createGoal

  const updateRow = (index: number, patch: Partial<SeedRow>) => {
    setSeedRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
    setSeedErrors((errs) => {
      if (!(index in errs)) return errs
      const next = { ...errs }
      delete next[index]
      return next
    })
  }

  const addRow = () => setSeedRows((rows) => [...rows, EMPTY_ROW])
  const removeRow = (index: number) =>
    setSeedRows((rows) => (rows.length === 1 ? [EMPTY_ROW] : rows.filter((_, i) => i !== index)))

  const buildSeedAllocations = (): SeedAllocationRequest[] | null => {
    const allocations: SeedAllocationRequest[] = []
    const nextErrors: Record<number, string> = {}

    seedRows.forEach((row, index) => {
      if (!row.bankAccountId) return // an untouched row is simply ignored
      const amount = Number(row.amount)
      if (!row.amount || !Number.isFinite(amount) || amount <= 0) {
        nextErrors[index] = 'Enter an amount greater than 0'
        return
      }
      const account = accounts.find((a) => a.id === row.bankAccountId)
      const unallocated = account?.unallocatedAmount ?? 0
      if (amount > unallocated) {
        nextErrors[index] = `Only ${formatCurrency(unallocated)} unallocated in ${account?.name}`
        return
      }
      allocations.push({ bankAccountId: row.bankAccountId, amount })
    })

    if (Object.keys(nextErrors).length > 0) {
      setSeedErrors(nextErrors)
      return null
    }
    return allocations
  }

  const onSubmit = async (data: GoalFormData) => {
    let allocations: SeedAllocationRequest[] = []
    if (!isEditing) {
      const built = buildSeedAllocations()
      if (built === null) return
      allocations = built
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
          allocations: allocations.length > 0 ? allocations : undefined,
        }
        await createGoal.mutateAsync(payload)
        toast.success('Goal created')
      }
      onOpenChange(false)
    } catch {
      // Error surfaced inline via mutation.error
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const chosenAccountIds = seedRows.map((r) => r.bankAccountId).filter(Boolean)

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
            <Input
              id="endDate"
              type="date"
              className="appearance-none [&::-webkit-date-and-time-value]:text-left"
              {...register('endDate')}
            />
          </div>

          {!isEditing && (
            <div className="space-y-3 rounded-xl border border-border p-3">
              <p className="text-sm font-medium text-foreground">Initial allocation (optional)</p>
              {seedRows.map((row, index) => {
                const account = accounts.find((a) => a.id === row.bankAccountId)
                const amount = Number(row.amount)
                return (
                  <div key={index} className="space-y-2">
                    {index > 0 && <div className="border-t border-border" />}
                    <div className="flex items-end gap-2">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`seed-account-${index}`}>From account</Label>
                        <AccountSelect
                          value={row.bankAccountId}
                          onValueChange={(accountId) => updateRow(index, { bankAccountId: accountId })}
                          placeholder="Select account"
                          label="From account"
                          excludeIds={chosenAccountIds.filter((id) => id !== row.bankAccountId)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground"
                        onClick={() => removeRow(index)}
                        aria-label="Remove allocation"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`seed-amount-${index}`}>Amount</Label>
                      <Input
                        id={`seed-amount-${index}`}
                        type="number"
                        step="0.01"
                        value={row.amount}
                        onChange={(e) => updateRow(index, { amount: e.target.value })}
                        placeholder="0.00"
                      />
                      {account && (
                        <AllocationImpact
                          account={account}
                          currentAllocation={0}
                          newAmount={Number.isFinite(amount) ? amount : 0}
                        />
                      )}
                      {seedErrors[index] && (
                        <p className="text-sm text-destructive">{seedErrors[index]}</p>
                      )}
                    </div>
                  </div>
                )
              })}
              {chosenAccountIds.length < accounts.length && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={addRow}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add another account
                </Button>
              )}
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
