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
import { useCreateAccount } from '@/hooks'
import { createAccountSchema, type CreateAccountFormData } from './schemas'

interface CreateAccountModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAccountModal({ open, onOpenChange }: CreateAccountModalProps) {
  const createAccount = useCreateAccount()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAccountFormData>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      name: '',
      description: '',
      initialBalance: 0,
    },
  })

  const onSubmit = async (data: CreateAccountFormData) => {
    try {
      await createAccount.mutateAsync({
        name: data.name,
        description: data.description || undefined,
        initialBalance: data.initialBalance,
      })
      toast.success('Account created')
      reset()
      onOpenChange(false)
    } catch {
      // Error is handled by the mutation and displayed inline
    }
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Account</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Checking Account"
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              {...register('description')}
              placeholder="e.g., Main household account"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialBalance">Initial Balance</Label>
            <Input
              id="initialBalance"
              type="number"
              step="0.01"
              {...register('initialBalance', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.initialBalance && (
              <p className="text-sm text-red-600">{errors.initialBalance.message}</p>
            )}
          </div>

          {createAccount.error && (
            <p className="text-sm text-red-600">
              {createAccount.error.message}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAccount.isPending}>
              {createAccount.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
