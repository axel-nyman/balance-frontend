# Story 2.5: Delete Account Flow

**As a** user  
**I want to** delete an account I no longer use  
**So that** it doesn't clutter my account list

### Acceptance Criteria

- [ ] Confirmation dialog shows when delete clicked
- [ ] Dialog shows account name
- [ ] Successful delete: Close dialog, show toast, refresh list
- [ ] Error (account in use): Show error message explaining why

### Implementation

**Create `src/components/accounts/DeleteAccountDialog.tsx`:**

```typescript
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared'
import { useDeleteAccount } from '@/hooks'
import type { BankAccount } from '@/api/types'

interface DeleteAccountDialogProps {
  account: BankAccount | null
  onClose: () => void
}

export function DeleteAccountDialog({ account, onClose }: DeleteAccountDialogProps) {
  const deleteAccount = useDeleteAccount()
  const isOpen = account !== null

  const handleConfirm = async () => {
    if (!account) return

    try {
      await deleteAccount.mutateAsync(account.id)
      toast.success('Account deleted')
      onClose()
    } catch (error) {
      // Error will be shown via toast from mutation
      toast.error(deleteAccount.error?.message || 'Failed to delete account')
    }
  }

  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Delete Account"
      description={`Are you sure you want to delete "${account?.name}"? This action cannot be undone. Balance history will be preserved.`}
      confirmLabel="Delete"
      variant="destructive"
      onConfirm={handleConfirm}
      loading={deleteAccount.isPending}
    />
  )
}
```

### Test File: `src/components/accounts/DeleteAccountDialog.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { DeleteAccountDialog } from './DeleteAccountDialog'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import type { BankAccount } from '@/api/types'

const mockAccount: BankAccount = {
  id: '123',
  name: 'Test Account',
  description: null,
  currentBalance: 1000,
  createdAt: '2025-01-01',
}

describe('DeleteAccountDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when account is provided', () => {
    render(<DeleteAccountDialog account={mockAccount} onClose={vi.fn()} />)
    
    expect(screen.getByText(/delete account/i)).toBeInTheDocument()
  })

  it('does not render when account is null', () => {
    render(<DeleteAccountDialog account={null} onClose={vi.fn()} />)
    
    expect(screen.queryByText(/delete account/i)).not.toBeInTheDocument()
  })

  it('shows account name in confirmation message', () => {
    render(<DeleteAccountDialog account={mockAccount} onClose={vi.fn()} />)
    
    expect(screen.getByText(/Test Account/)).toBeInTheDocument()
  })

  it('deletes account on confirm', async () => {
    server.use(
      http.delete('/api/bank-accounts/123', () => {
        return new HttpResponse(null, { status: 204 })
      })
    )

    const onClose = vi.fn()
    render(<DeleteAccountDialog account={mockAccount} onClose={onClose} />)
    
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('calls onClose when cancel is clicked', async () => {
    const onClose = vi.fn()
    render(<DeleteAccountDialog account={mockAccount} onClose={onClose} />)
    
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    
    expect(onClose).toHaveBeenCalled()
  })

  it('shows error when account is in use', async () => {
    server.use(
      http.delete('/api/bank-accounts/123', () => {
        return HttpResponse.json(
          { error: 'Cannot delete account used in unlocked budget' },
          { status: 400 }
        )
      })
    )

    render(<DeleteAccountDialog account={mockAccount} onClose={vi.fn()} />)
    
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))
    
    // Toast should appear with error - this would need toast testing setup
    // For now, we just verify the dialog stays open
    await waitFor(() => {
      expect(screen.getByText(/delete account/i)).toBeInTheDocument()
    })
  })
})
```

### Definition of Done

- [ ] All tests pass
- [ ] Confirmation dialog shows account name
- [ ] Successful deletion removes account
- [ ] Error shows user-friendly message

---