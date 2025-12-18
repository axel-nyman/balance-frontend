# Story 2.3: Create Account Modal

**As a** user  
**I want to** create a new bank account  
**So that** I can track a new financial account

### Acceptance Criteria

- [ ] Modal opens when "New Account" button is clicked
- [ ] Form has fields: Name (required), Description (optional), Initial Balance (optional, default 0)
- [ ] Validation: Name is required, Initial Balance must be non-negative
- [ ] Submit creates account via API
- [ ] Success: Close modal, show toast, refresh list
- [ ] Error: Show error message inline
- [ ] Cancel closes modal without changes

### Form Schema

```typescript
// src/components/accounts/schemas.ts
import { z } from 'zod'

export const createAccountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  initialBalance: z
    .number()
    .min(0, 'Initial balance cannot be negative')
    .optional()
    .default(0),
})

export type CreateAccountFormData = z.infer<typeof createAccountSchema>
```

### Implementation

**Create `src/components/accounts/schemas.ts`:**

```typescript
import { z } from 'zod'

export const createAccountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  initialBalance: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Initial balance cannot be negative')
    .optional()
    .default(0),
})

export const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
})

export const updateBalanceSchema = z.object({
  newBalance: z.number({ invalid_type_error: 'Must be a number' }),
  date: z.string().min(1, 'Date is required'),
  comment: z.string().optional(),
})

export type CreateAccountFormData = z.infer<typeof createAccountSchema>
export type UpdateAccountFormData = z.infer<typeof updateAccountSchema>
export type UpdateBalanceFormData = z.infer<typeof updateBalanceSchema>
```

**Create `src/components/accounts/CreateAccountModal.tsx`:**

```typescript
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
    } catch (error) {
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
```

### Test File: `src/components/accounts/CreateAccountModal.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { CreateAccountModal } from './CreateAccountModal'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

describe('CreateAccountModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form fields when open', () => {
    render(<CreateAccountModal {...defaultProps} />)
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/initial balance/i)).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<CreateAccountModal {...defaultProps} open={false} />)
    
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument()
  })

  it('shows validation error when name is empty', async () => {
    render(<CreateAccountModal {...defaultProps} />)
    
    await userEvent.click(screen.getByRole('button', { name: /create/i }))
    
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument()
  })

  it('shows validation error for negative initial balance', async () => {
    render(<CreateAccountModal {...defaultProps} />)
    
    await userEvent.type(screen.getByLabelText(/name/i), 'Test')
    await userEvent.clear(screen.getByLabelText(/initial balance/i))
    await userEvent.type(screen.getByLabelText(/initial balance/i), '-100')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))
    
    expect(await screen.findByText(/cannot be negative/i)).toBeInTheDocument()
  })

  it('submits form with valid data', async () => {
    let requestBody: unknown
    server.use(
      http.post('/api/bank-accounts', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ id: '123', name: 'Test', currentBalance: 1000 }, { status: 201 })
      })
    )

    const onOpenChange = vi.fn()
    render(<CreateAccountModal open={true} onOpenChange={onOpenChange} />)
    
    await userEvent.type(screen.getByLabelText(/name/i), 'Test Account')
    await userEvent.type(screen.getByLabelText(/description/i), 'Test description')
    await userEvent.clear(screen.getByLabelText(/initial balance/i))
    await userEvent.type(screen.getByLabelText(/initial balance/i), '1000')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))
    
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
    
    expect(requestBody).toEqual({
      name: 'Test Account',
      description: 'Test description',
      initialBalance: 1000,
    })
  })

  it('shows error message on API failure', async () => {
    server.use(
      http.post('/api/bank-accounts', () => {
        return HttpResponse.json({ error: 'Bank account name already exists' }, { status: 400 })
      })
    )

    render(<CreateAccountModal {...defaultProps} />)
    
    await userEvent.type(screen.getByLabelText(/name/i), 'Existing Account')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))
    
    expect(await screen.findByText(/already exists/i)).toBeInTheDocument()
  })

  it('closes modal when cancel is clicked', async () => {
    const onOpenChange = vi.fn()
    render(<CreateAccountModal open={true} onOpenChange={onOpenChange} />)
    
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('disables submit button while submitting', async () => {
    server.use(
      http.post('/api/bank-accounts', async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return HttpResponse.json({ id: '123' }, { status: 201 })
      })
    )

    render(<CreateAccountModal {...defaultProps} />)
    
    await userEvent.type(screen.getByLabelText(/name/i), 'Test')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))
    
    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
  })

  it('auto-focuses name input when opened', () => {
    render(<CreateAccountModal {...defaultProps} />)
    
    expect(screen.getByLabelText(/name/i)).toHaveFocus()
  })
})
```

### Update Barrel Export

**Update `src/components/accounts/index.ts`:**

```typescript
export { AccountsSummary } from './AccountsSummary'
export { AccountsList } from './AccountsList'
export { AccountRow } from './AccountRow'
export { AccountCard } from './AccountCard'
export { CreateAccountModal } from './CreateAccountModal'
export * from './schemas'
```

### Definition of Done

- [ ] All tests pass
- [ ] Modal opens/closes correctly
- [ ] Form validation works
- [ ] Successful submission creates account
- [ ] Error messages display
- [ ] Auto-focus on name field

---