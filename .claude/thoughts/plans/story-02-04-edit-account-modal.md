# Story 2.4: Edit Account Modal

**As a** user  
**I want to** edit an existing account's name and description  
**So that** I can keep my account information current

### Acceptance Criteria

- [x] Modal opens when edit button is clicked
- [x] Form pre-filled with current values
- [x] Can update name and description only (not balance)
- [x] Validation: Name is required
- [x] Success: Close modal, show toast, refresh list
- [x] Error: Show error message inline

### Implementation

**Create `src/components/accounts/EditAccountModal.tsx`:**

```typescript
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
import { useUpdateAccount } from '@/hooks'
import { updateAccountSchema, type UpdateAccountFormData } from './schemas'
import type { BankAccount } from '@/api/types'

interface EditAccountModalProps {
  account: BankAccount | null
  onClose: () => void
}

export function EditAccountModal({ account, onClose }: EditAccountModalProps) {
  const updateAccount = useUpdateAccount()
  const isOpen = account !== null

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateAccountFormData>({
    resolver: zodResolver(updateAccountSchema),
  })

  // Reset form when account changes
  useEffect(() => {
    if (account) {
      reset({
        name: account.name,
        description: account.description || '',
      })
    }
  }, [account, reset])

  const onSubmit = async (data: UpdateAccountFormData) => {
    if (!account) return

    try {
      await updateAccount.mutateAsync({
        id: account.id,
        data: {
          name: data.name,
          description: data.description || undefined,
        },
      })
      toast.success('Account updated')
      onClose()
    } catch (error) {
      // Error displayed inline
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name *</Label>
            <Input
              id="edit-name"
              {...register('name')}
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Input
              id="edit-description"
              {...register('description')}
            />
          </div>

          {updateAccount.error && (
            <p className="text-sm text-red-600">
              {updateAccount.error.message}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateAccount.isPending}>
              {updateAccount.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### Test File: `src/components/accounts/EditAccountModal.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { EditAccountModal } from './EditAccountModal'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import type { BankAccount } from '@/api/types'

const mockAccount: BankAccount = {
  id: '123',
  name: 'Checking',
  description: 'Main account',
  currentBalance: 5000,
  createdAt: '2025-01-01',
}

describe('EditAccountModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when account is provided', () => {
    render(<EditAccountModal account={mockAccount} onClose={vi.fn()} />)
    
    expect(screen.getByText('Edit Account')).toBeInTheDocument()
  })

  it('does not render when account is null', () => {
    render(<EditAccountModal account={null} onClose={vi.fn()} />)
    
    expect(screen.queryByText('Edit Account')).not.toBeInTheDocument()
  })

  it('pre-fills form with account values', () => {
    render(<EditAccountModal account={mockAccount} onClose={vi.fn()} />)
    
    expect(screen.getByDisplayValue('Checking')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Main account')).toBeInTheDocument()
  })

  it('does not have balance field', () => {
    render(<EditAccountModal account={mockAccount} onClose={vi.fn()} />)
    
    expect(screen.queryByLabelText(/balance/i)).not.toBeInTheDocument()
  })

  it('shows validation error when name is cleared', async () => {
    render(<EditAccountModal account={mockAccount} onClose={vi.fn()} />)
    
    await userEvent.clear(screen.getByLabelText(/name/i))
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument()
  })

  it('submits updated data', async () => {
    let requestBody: unknown
    server.use(
      http.put('/api/bank-accounts/123', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({ ...mockAccount, name: 'Updated' })
      })
    )

    const onClose = vi.fn()
    render(<EditAccountModal account={mockAccount} onClose={onClose} />)
    
    await userEvent.clear(screen.getByLabelText(/name/i))
    await userEvent.type(screen.getByLabelText(/name/i), 'Updated Name')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
    
    expect(requestBody).toEqual({
      name: 'Updated Name',
      description: 'Main account',
    })
  })

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn()
    render(<EditAccountModal account={mockAccount} onClose={onClose} />)
    
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    
    expect(onClose).toHaveBeenCalled()
  })
})
```

### Definition of Done

- [x] All tests pass
- [x] Modal shows when account provided
- [x] Form pre-fills with current values
- [x] Updates save correctly
- [x] Balance field is not present

---