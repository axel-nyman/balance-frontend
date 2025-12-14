# Balance — Frontend Stories: Epic 2 (Accounts)

This document contains detailed, implementable stories for the Accounts epic. Complete Epic 1 (Infrastructure) before starting this epic.

---

## Epic Overview

The Accounts feature allows users to:
- View all bank accounts with balances
- Create new accounts
- Edit account details (name, description)
- Update account balances manually
- View balance history
- Delete accounts (with restrictions)

**Dependencies:** Epic 1 (Infrastructure) must be complete.

**API Endpoints Used:**
- `GET /api/bank-accounts`
- `POST /api/bank-accounts`
- `PUT /api/bank-accounts/:id`
- `DELETE /api/bank-accounts/:id`
- `POST /api/bank-accounts/:id/balance`
- `GET /api/bank-accounts/:id/balance-history`

---

## Story 2.1: Accounts Page Shell

**As a** user  
**I want to** see a dedicated page for managing accounts  
**So that** I have a clear place to view and manage my bank accounts

### Acceptance Criteria

- [ ] Page renders at `/accounts` route
- [ ] Page header shows "Accounts" title
- [ ] "New Account" button visible in header
- [ ] Summary card placeholder for total balance
- [ ] Main content area ready for account list

### Implementation

**Update `src/pages/AccountsPage.tsx`:**

```typescript
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared'

export function AccountsPage() {
  return (
    <div>
      <PageHeader
        title="Accounts"
        description="Manage your bank accounts"
        action={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Account
          </Button>
        }
      />

      {/* Summary Card - to be implemented in 2.2 */}
      <div className="mb-6">
        {/* AccountsSummary component will go here */}
      </div>

      {/* Accounts List - to be implemented in 2.2 */}
      <div>
        {/* AccountsList component will go here */}
      </div>
    </div>
  )
}
```

### Test File: `src/pages/AccountsPage.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { AccountsPage } from './AccountsPage'

describe('AccountsPage', () => {
  it('renders page header with title', () => {
    render(<AccountsPage />)
    
    expect(screen.getByRole('heading', { name: /accounts/i })).toBeInTheDocument()
  })

  it('renders new account button', () => {
    render(<AccountsPage />)
    
    expect(screen.getByRole('button', { name: /new account/i })).toBeInTheDocument()
  })
})
```

### Definition of Done

- [ ] Tests pass
- [ ] Page renders at `/accounts`
- [ ] Header and button visible

---

## Story 2.2: Accounts List

**As a** user  
**I want to** see all my bank accounts with their balances  
**So that** I can get an overview of my finances

### Acceptance Criteria

- [ ] Displays total balance across all accounts
- [ ] Shows account count
- [ ] Lists all accounts in a table (desktop) or cards (mobile)
- [ ] Each account shows: name, description, balance
- [ ] Shows loading state while fetching
- [ ] Shows empty state when no accounts exist
- [ ] Shows error state with retry on failure
- [ ] Clicking a row opens balance history drawer

### Components to Create

1. `AccountsSummary` — Total balance card
2. `AccountsList` — Table/card list of accounts
3. `AccountRow` — Individual account row/card

### Implementation

**Create `src/components/accounts/AccountsSummary.tsx`:**

```typescript
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'

interface AccountsSummaryProps {
  totalBalance: number
  accountCount: number
  isLoading?: boolean
}

export function AccountsSummary({ totalBalance, accountCount, isLoading }: AccountsSummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-gray-500 mb-1">
          Total Balance ({accountCount} {accountCount === 1 ? 'account' : 'accounts'})
        </p>
        <p className="text-2xl font-semibold text-gray-900">
          {formatCurrency(totalBalance)}
        </p>
      </CardContent>
    </Card>
  )
}
```

**Create `src/components/accounts/AccountRow.tsx`:**

```typescript
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { BankAccount } from '@/api/types'

interface AccountRowProps {
  account: BankAccount
  onEdit: (account: BankAccount) => void
  onDelete: (account: BankAccount) => void
  onClick: (account: BankAccount) => void
}

export function AccountRow({ account, onEdit, onDelete, onClick }: AccountRowProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(account)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(account)
  }

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer"
      onClick={() => onClick(account)}
    >
      <td className="px-4 py-3 font-medium text-gray-900">{account.name}</td>
      <td className="px-4 py-3 text-gray-500">{account.description || '—'}</td>
      <td className="px-4 py-3 text-right font-medium text-gray-900">
        {formatCurrency(account.currentBalance)}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            aria-label={`Edit ${account.name}`}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            aria-label={`Delete ${account.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}
```

**Create `src/components/accounts/AccountCard.tsx`:** (Mobile version)

```typescript
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { BankAccount } from '@/api/types'

interface AccountCardProps {
  account: BankAccount
  onEdit: (account: BankAccount) => void
  onDelete: (account: BankAccount) => void
  onClick: (account: BankAccount) => void
}

export function AccountCard({ account, onEdit, onDelete, onClick }: AccountCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(account)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(account)
  }

  return (
    <Card
      className="cursor-pointer hover:border-gray-300 transition-colors"
      onClick={() => onClick(account)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{account.name}</h3>
            <p className="text-sm text-gray-500 truncate">
              {account.description || 'No description'}
            </p>
            <p className="text-lg font-semibold text-gray-900 mt-2">
              {formatCurrency(account.currentBalance)}
            </p>
          </div>
          <div className="flex gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              aria-label={`Edit ${account.name}`}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              aria-label={`Delete ${account.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Create `src/components/accounts/AccountsList.tsx`:**

```typescript
import { Wallet } from 'lucide-react'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LoadingState, EmptyState, ErrorState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { AccountRow } from './AccountRow'
import { AccountCard } from './AccountCard'
import type { BankAccount } from '@/api/types'

interface AccountsListProps {
  accounts: BankAccount[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onEdit: (account: BankAccount) => void
  onDelete: (account: BankAccount) => void
  onClick: (account: BankAccount) => void
  onCreateNew: () => void
}

export function AccountsList({
  accounts,
  isLoading,
  isError,
  onRetry,
  onEdit,
  onDelete,
  onClick,
  onCreateNew,
}: AccountsListProps) {
  if (isLoading) {
    return <LoadingState variant="table" rows={3} />
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load accounts"
        message="We couldn't load your accounts. Please try again."
        onRetry={onRetry}
      />
    )
  }

  if (accounts.length === 0) {
    return (
      <EmptyState
        icon={<Wallet className="w-12 h-12" />}
        title="No accounts yet"
        description="Create your first bank account to start tracking your finances."
        action={
          <Button onClick={onCreateNew}>Create Account</Button>
        }
      />
    )
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                onEdit={onEdit}
                onDelete={onDelete}
                onClick={onClick}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onEdit={onEdit}
            onDelete={onDelete}
            onClick={onClick}
          />
        ))}
      </div>

      {/* Helper text */}
      <p className="text-sm text-gray-500 mt-4 text-center">
        Click any account to view balance history
      </p>
    </>
  )
}
```

**Create barrel export `src/components/accounts/index.ts`:**

```typescript
export { AccountsSummary } from './AccountsSummary'
export { AccountsList } from './AccountsList'
export { AccountRow } from './AccountRow'
export { AccountCard } from './AccountCard'
```

**Update `src/pages/AccountsPage.tsx`:**

```typescript
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared'
import { AccountsSummary, AccountsList } from '@/components/accounts'
import { useAccounts } from '@/hooks'
import type { BankAccount } from '@/api/types'

export function AccountsPage() {
  const { data, isLoading, isError, refetch } = useAccounts()
  
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<BankAccount | null>(null)
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false)

  const handleAccountClick = (account: BankAccount) => {
    setSelectedAccount(account)
    setIsHistoryDrawerOpen(true)
  }

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account)
  }

  const handleDelete = (account: BankAccount) => {
    setDeletingAccount(account)
  }

  return (
    <div>
      <PageHeader
        title="Accounts"
        description="Manage your bank accounts"
        action={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Account
          </Button>
        }
      />

      <div className="mb-6">
        <AccountsSummary
          totalBalance={data?.totalBalance ?? 0}
          accountCount={data?.accountCount ?? 0}
          isLoading={isLoading}
        />
      </div>

      <AccountsList
        accounts={data?.accounts ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onClick={handleAccountClick}
        onCreateNew={() => setIsCreateModalOpen(true)}
      />

      {/* Modals and Drawer - to be implemented in subsequent stories */}
      {/* <CreateAccountModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} /> */}
      {/* <EditAccountModal account={editingAccount} onClose={() => setEditingAccount(null)} /> */}
      {/* <DeleteAccountDialog account={deletingAccount} onClose={() => setDeletingAccount(null)} /> */}
      {/* <BalanceHistoryDrawer account={selectedAccount} open={isHistoryDrawerOpen} onOpenChange={setIsHistoryDrawerOpen} /> */}
    </div>
  )
}
```

### Test File: `src/components/accounts/AccountsSummary.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { AccountsSummary } from './AccountsSummary'

describe('AccountsSummary', () => {
  it('displays total balance formatted as SEK', () => {
    render(<AccountsSummary totalBalance={12500} accountCount={3} />)
    
    expect(screen.getByText(/12 500,00 kr/)).toBeInTheDocument()
  })

  it('displays account count with singular form', () => {
    render(<AccountsSummary totalBalance={1000} accountCount={1} />)
    
    expect(screen.getByText(/1 account/)).toBeInTheDocument()
  })

  it('displays account count with plural form', () => {
    render(<AccountsSummary totalBalance={1000} accountCount={3} />)
    
    expect(screen.getByText(/3 accounts/)).toBeInTheDocument()
  })

  it('shows skeleton when loading', () => {
    const { container } = render(
      <AccountsSummary totalBalance={0} accountCount={0} isLoading />
    )
    
    expect(container.querySelector('[class*="animate-pulse"]')).toBeInTheDocument()
  })
})
```

### Test File: `src/components/accounts/AccountsList.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { AccountsList } from './AccountsList'
import type { BankAccount } from '@/api/types'

const mockAccounts: BankAccount[] = [
  { id: '1', name: 'Checking', description: 'Main account', currentBalance: 5000, createdAt: '2025-01-01' },
  { id: '2', name: 'Savings', description: null, currentBalance: 10000, createdAt: '2025-01-01' },
]

const defaultProps = {
  accounts: mockAccounts,
  isLoading: false,
  isError: false,
  onRetry: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onClick: vi.fn(),
  onCreateNew: vi.fn(),
}

describe('AccountsList', () => {
  it('renders loading state', () => {
    render(<AccountsList {...defaultProps} isLoading={true} accounts={[]} />)
    
    expect(screen.queryByText('Checking')).not.toBeInTheDocument()
  })

  it('renders error state with retry button', async () => {
    const onRetry = vi.fn()
    render(<AccountsList {...defaultProps} isError={true} accounts={[]} onRetry={onRetry} />)
    
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    
    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('renders empty state when no accounts', () => {
    render(<AccountsList {...defaultProps} accounts={[]} />)
    
    expect(screen.getByText(/no accounts yet/i)).toBeInTheDocument()
  })

  it('renders empty state with create button', async () => {
    const onCreateNew = vi.fn()
    render(<AccountsList {...defaultProps} accounts={[]} onCreateNew={onCreateNew} />)
    
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(onCreateNew).toHaveBeenCalled()
  })

  it('renders account names', () => {
    render(<AccountsList {...defaultProps} />)
    
    expect(screen.getByText('Checking')).toBeInTheDocument()
    expect(screen.getByText('Savings')).toBeInTheDocument()
  })

  it('renders account balances', () => {
    render(<AccountsList {...defaultProps} />)
    
    expect(screen.getByText(/5 000,00 kr/)).toBeInTheDocument()
    expect(screen.getByText(/10 000,00 kr/)).toBeInTheDocument()
  })

  it('calls onClick when account row is clicked', async () => {
    const onClick = vi.fn()
    render(<AccountsList {...defaultProps} onClick={onClick} />)
    
    await userEvent.click(screen.getByText('Checking'))
    
    expect(onClick).toHaveBeenCalledWith(mockAccounts[0])
  })

  it('calls onEdit when edit button is clicked', async () => {
    const onEdit = vi.fn()
    render(<AccountsList {...defaultProps} onEdit={onEdit} />)
    
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    await userEvent.click(editButtons[0])
    
    expect(onEdit).toHaveBeenCalledWith(mockAccounts[0])
  })

  it('calls onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn()
    render(<AccountsList {...defaultProps} onDelete={onDelete} />)
    
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    await userEvent.click(deleteButtons[0])
    
    expect(onDelete).toHaveBeenCalledWith(mockAccounts[0])
  })

  it('edit button click does not trigger row click', async () => {
    const onClick = vi.fn()
    const onEdit = vi.fn()
    render(<AccountsList {...defaultProps} onClick={onClick} onEdit={onEdit} />)
    
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    await userEvent.click(editButtons[0])
    
    expect(onEdit).toHaveBeenCalled()
    expect(onClick).not.toHaveBeenCalled()
  })
})
```

### Definition of Done

- [ ] All tests pass
- [ ] Summary card shows total balance and count
- [ ] Table view works on desktop
- [ ] Card view works on mobile
- [ ] Loading, error, and empty states work
- [ ] Click handlers fire correctly

---

## Story 2.3: Create Account Modal

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

## Story 2.4: Edit Account Modal

**As a** user  
**I want to** edit an existing account's name and description  
**So that** I can keep my account information current

### Acceptance Criteria

- [ ] Modal opens when edit button is clicked
- [ ] Form pre-filled with current values
- [ ] Can update name and description only (not balance)
- [ ] Validation: Name is required
- [ ] Success: Close modal, show toast, refresh list
- [ ] Error: Show error message inline

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

- [ ] All tests pass
- [ ] Modal shows when account provided
- [ ] Form pre-fills with current values
- [ ] Updates save correctly
- [ ] Balance field is not present

---

## Story 2.5: Delete Account Flow

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

## Story 2.6: Balance History Drawer

**As a** user  
**I want to** see the balance history for an account  
**So that** I can track how my balance has changed over time

### Acceptance Criteria

- [ ] Drawer slides in when account row is clicked
- [ ] Shows account name and current balance
- [ ] Lists balance history entries (newest first)
- [ ] Each entry shows: date, balance, change amount, source badge
- [ ] MANUAL entries show comment
- [ ] AUTOMATIC entries show linked budget
- [ ] "Load More" pagination
- [ ] "Update Balance" button opens update modal
- [ ] Close via X, clicking outside, or Escape

### Implementation

**Create `src/components/accounts/BalanceHistoryDrawer.tsx`:**

```typescript
import { useState } from 'react'
import { X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useBalanceHistory } from '@/hooks'
import { formatCurrency, formatDate } from '@/lib/utils'
import { UpdateBalanceModal } from './UpdateBalanceModal'
import type { BankAccount, BalanceHistoryEntry } from '@/api/types'

interface BalanceHistoryDrawerProps {
  account: BankAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function HistoryEntry({ entry }: { entry: BalanceHistoryEntry }) {
  const changeColor = entry.changeAmount >= 0 ? 'text-green-600' : 'text-red-600'
  const changePrefix = entry.changeAmount >= 0 ? '+' : ''

  return (
    <div className="p-4 border-b border-gray-100 last:border-b-0">
      <div className="flex justify-between items-start mb-1">
        <span className="text-sm text-gray-500">{formatDate(entry.changeDate)}</span>
        <Badge variant={entry.source === 'MANUAL' ? 'secondary' : 'default'}>
          {entry.source}
        </Badge>
      </div>
      <div className="flex justify-between items-baseline">
        <span className="font-medium">{formatCurrency(entry.balance)}</span>
        <span className={`text-sm ${changeColor}`}>
          {changePrefix}{formatCurrency(entry.changeAmount)}
        </span>
      </div>
      {entry.comment && (
        <p className="text-sm text-gray-500 mt-1">"{entry.comment}"</p>
      )}
      {entry.source === 'AUTOMATIC' && entry.budgetId && (
        <p className="text-sm text-gray-500 mt-1">From budget</p>
      )}
    </div>
  )
}

export function BalanceHistoryDrawer({ account, open, onOpenChange }: BalanceHistoryDrawerProps) {
  const [page, setPage] = useState(0)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  
  const { data, isLoading, isFetching } = useBalanceHistory(
    account?.id ?? '',
    page
  )

  const handleLoadMore = () => {
    setPage((prev) => prev + 1)
  }

  const hasMore = data && data.page.number < data.page.totalPages - 1

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Balance History</SheetTitle>
            {account && (
              <div className="text-left">
                <p className="font-medium text-gray-900">{account.name}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(account.currentBalance)}
                </p>
              </div>
            )}
          </SheetHeader>

          <Button
            className="w-full mb-4"
            onClick={() => setIsUpdateModalOpen(true)}
          >
            Update Balance
          </Button>

          <div className="border rounded-lg bg-white">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                ))}
              </div>
            ) : data?.content.length === 0 ? (
              <p className="p-4 text-center text-gray-500">No history yet</p>
            ) : (
              <>
                {data?.content.map((entry) => (
                  <HistoryEntry key={entry.id} entry={entry} />
                ))}
                
                {hasMore && (
                  <div className="p-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleLoadMore}
                      disabled={isFetching}
                    >
                      {isFetching ? 'Loading...' : 'Load More'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {account && (
        <UpdateBalanceModal
          account={account}
          open={isUpdateModalOpen}
          onOpenChange={setIsUpdateModalOpen}
        />
      )}
    </>
  )
}
```

### Test File: `src/components/accounts/BalanceHistoryDrawer.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { BalanceHistoryDrawer } from './BalanceHistoryDrawer'
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

const mockHistoryResponse = {
  content: [
    {
      id: '1',
      balance: 5000,
      changeAmount: 500,
      changeDate: '2025-01-15T10:00:00Z',
      comment: 'Paycheck',
      source: 'MANUAL' as const,
      budgetId: null,
    },
    {
      id: '2',
      balance: 4500,
      changeAmount: 200,
      changeDate: '2025-01-01T10:00:00Z',
      comment: null,
      source: 'AUTOMATIC' as const,
      budgetId: 'budget-123',
    },
  ],
  page: { size: 20, number: 0, totalElements: 2, totalPages: 1 },
}

describe('BalanceHistoryDrawer', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/bank-accounts/123/balance-history', () => {
        return HttpResponse.json(mockHistoryResponse)
      })
    )
  })

  it('renders when open with account', async () => {
    render(
      <BalanceHistoryDrawer
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )
    
    expect(screen.getByText('Balance History')).toBeInTheDocument()
    expect(screen.getByText('Checking')).toBeInTheDocument()
  })

  it('shows current balance', () => {
    render(
      <BalanceHistoryDrawer
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )
    
    expect(screen.getByText(/5 000,00 kr/)).toBeInTheDocument()
  })

  it('renders history entries', async () => {
    render(
      <BalanceHistoryDrawer
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText(/Paycheck/)).toBeInTheDocument()
    })
  })

  it('shows source badges', async () => {
    render(
      <BalanceHistoryDrawer
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText('MANUAL')).toBeInTheDocument()
      expect(screen.getByText('AUTOMATIC')).toBeInTheDocument()
    })
  })

  it('shows change amounts with correct formatting', async () => {
    render(
      <BalanceHistoryDrawer
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText(/\+500,00 kr/)).toBeInTheDocument()
    })
  })

  it('renders Update Balance button', () => {
    render(
      <BalanceHistoryDrawer
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )
    
    expect(screen.getByRole('button', { name: /update balance/i })).toBeInTheDocument()
  })

  it('shows loading state', () => {
    server.use(
      http.get('/api/bank-accounts/123/balance-history', async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return HttpResponse.json(mockHistoryResponse)
      })
    )

    const { container } = render(
      <BalanceHistoryDrawer
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )
    
    expect(container.querySelector('[class*="animate-pulse"]')).toBeInTheDocument()
  })
})
```

### Definition of Done

- [ ] All tests pass
- [ ] Drawer opens/closes correctly
- [ ] History entries display properly
- [ ] Source badges show correctly
- [ ] Update Balance button visible
- [ ] Pagination works with "Load More" button
- [ ] Shows count of entries (e.g., "Visar 20 av 150 poster")

### Pagination Implementation

**Update `src/hooks/use-accounts.ts` for infinite query:**

```typescript
import { useInfiniteQuery } from '@tanstack/react-query'
import { getBalanceHistory } from '@/api'
import { queryKeys } from './query-keys'

interface UseBalanceHistoryOptions {
  accountId: string
  enabled?: boolean
  pageSize?: number
}

export function useBalanceHistory({
  accountId,
  enabled = true,
  pageSize = 20,
}: UseBalanceHistoryOptions) {
  return useInfiniteQuery({
    queryKey: queryKeys.accounts.history(accountId),
    queryFn: ({ pageParam = 0 }) => getBalanceHistory(accountId, pageParam, pageSize),
    getNextPageParam: (lastPage) => {
      const { number, totalPages } = lastPage.page
      // Return next page number if there are more pages, otherwise undefined
      return number + 1 < totalPages ? number + 1 : undefined
    },
    enabled: enabled && !!accountId,
    staleTime: 30_000, // 30 seconds
  })
}
```

**Update BalanceHistoryDrawer with pagination:**

```typescript
const {
  data,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
} = useBalanceHistory({
  accountId: account?.id ?? '',
  enabled: open && !!account,
})

// Flatten all pages into a single array
const allEntries = useMemo(() => {
  if (!data?.pages) return []
  return data.pages.flatMap(page => page.content)
}, [data])

// Get pagination info from the last page
const pageInfo = data?.pages?.[data.pages.length - 1]?.page

// In JSX:
{/* Load More Button */}
{hasNextPage && (
  <Button
    variant="outline"
    className="w-full"
    onClick={() => fetchNextPage()}
    disabled={isFetchingNextPage}
  >
    {isFetchingNextPage ? (
      <>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Laddar...
      </>
    ) : (
      'Ladda fler'
    )}
  </Button>
)}

{/* Page Info */}
{pageInfo && (
  <p className="text-xs text-center text-gray-400 pt-2">
    Visar {allEntries.length} av {pageInfo.totalElements} poster
  </p>
)}
```

**Backend API reference:**
```
GET /api/bank-accounts/{id}/balance-history?page=0&size=20

Response:
{
  "content": [...],
  "page": {
    "size": 20,
    "number": 0,
    "totalElements": 150,
    "totalPages": 8
  }
}
```

---

## Story 2.7: Update Balance Modal

**As a** user  
**I want to** manually update an account balance  
**So that** I can keep it synchronized with my actual bank

### Acceptance Criteria

- [ ] Modal opens from Balance History drawer
- [ ] Shows account name and current balance (read-only)
- [ ] Form fields: New Balance (required), Date (required, defaults to today), Comment (optional)
- [ ] Date cannot be in the future
- [ ] Success: Close modal, show toast, refresh drawer and list
- [ ] Error: Show error message inline

### Implementation

**Create `src/components/accounts/UpdateBalanceModal.tsx`:**

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
import { useUpdateBalance } from '@/hooks'
import { formatCurrency } from '@/lib/utils'
import { updateBalanceSchema, type UpdateBalanceFormData } from './schemas'
import type { BankAccount } from '@/api/types'

interface UpdateBalanceModalProps {
  account: BankAccount
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function UpdateBalanceModal({ account, open, onOpenChange }: UpdateBalanceModalProps) {
  const updateBalance = useUpdateBalance()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateBalanceFormData>({
    resolver: zodResolver(updateBalanceSchema),
    defaultValues: {
      newBalance: account.currentBalance,
      date: getTodayString(),
      comment: '',
    },
  })

  const onSubmit = async (data: UpdateBalanceFormData) => {
    try {
      await updateBalance.mutateAsync({
        id: account.id,
        data: {
          newBalance: data.newBalance,
          date: data.date,
          comment: data.comment || undefined,
        },
      })
      toast.success('Balance updated')
      reset({
        newBalance: data.newBalance,
        date: getTodayString(),
        comment: '',
      })
      onOpenChange(false)
    } catch (error) {
      // Error displayed inline
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
          <DialogTitle>Update Balance</DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">{account.name}</p>
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
              <p className="text-sm text-red-600">{errors.newBalance.message}</p>
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
              <p className="text-sm text-red-600">{errors.date.message}</p>
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

          {updateBalance.error && (
            <p className="text-sm text-red-600">
              {updateBalance.error.message}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateBalance.isPending}>
              {updateBalance.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### Test File: `src/components/accounts/UpdateBalanceModal.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { UpdateBalanceModal } from './UpdateBalanceModal'
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

describe('UpdateBalanceModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when open', () => {
    render(
      <UpdateBalanceModal
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )
    
    expect(screen.getByText('Update Balance')).toBeInTheDocument()
  })

  it('shows account name and current balance', () => {
    render(
      <UpdateBalanceModal
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )
    
    expect(screen.getByText('Checking')).toBeInTheDocument()
    expect(screen.getByText(/5 000,00 kr/)).toBeInTheDocument()
  })

  it('has form fields', () => {
    render(
      <UpdateBalanceModal
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )
    
    expect(screen.getByLabelText(/new balance/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/comment/i)).toBeInTheDocument()
  })

  it('defaults date to today', () => {
    render(
      <UpdateBalanceModal
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )
    
    const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement
    const today = new Date().toISOString().split('T')[0]
    expect(dateInput.value).toBe(today)
  })

  it('submits valid form data', async () => {
    let requestBody: unknown
    server.use(
      http.post('/api/bank-accounts/123/balance', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({
          id: '123',
          currentBalance: 6000,
          previousBalance: 5000,
          changeAmount: 1000,
        })
      })
    )

    const onOpenChange = vi.fn()
    render(
      <UpdateBalanceModal
        account={mockAccount}
        open={true}
        onOpenChange={onOpenChange}
      />
    )
    
    await userEvent.clear(screen.getByLabelText(/new balance/i))
    await userEvent.type(screen.getByLabelText(/new balance/i), '6000')
    await userEvent.type(screen.getByLabelText(/comment/i), 'Test update')
    await userEvent.click(screen.getByRole('button', { name: /update/i }))
    
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
    
    expect(requestBody).toMatchObject({
      newBalance: 6000,
      comment: 'Test update',
    })
  })

  it('shows error for future date', async () => {
    render(
      <UpdateBalanceModal
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )
    
    // The date input has max={today} so this would be handled by browser
    // But we can also test API error handling
    server.use(
      http.post('/api/bank-accounts/123/balance', () => {
        return HttpResponse.json(
          { error: 'Date cannot be in the future' },
          { status: 403 }
        )
      })
    )

    await userEvent.click(screen.getByRole('button', { name: /update/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/cannot be in the future/i)).toBeInTheDocument()
    })
  })
})
```

### Definition of Done

- [ ] All tests pass
- [ ] Shows current account info
- [ ] Date defaults to today
- [ ] Cannot select future dates
- [ ] Successful update refreshes data
- [ ] Error messages display correctly

---

## Final: Update AccountsPage with All Components

**Update `src/pages/AccountsPage.tsx`:**

```typescript
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared'
import {
  AccountsSummary,
  AccountsList,
  CreateAccountModal,
  EditAccountModal,
  DeleteAccountDialog,
  BalanceHistoryDrawer,
} from '@/components/accounts'
import { useAccounts } from '@/hooks'
import type { BankAccount } from '@/api/types'

export function AccountsPage() {
  const { data, isLoading, isError, refetch } = useAccounts()
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<BankAccount | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false)

  const handleAccountClick = (account: BankAccount) => {
    setSelectedAccount(account)
    setIsHistoryDrawerOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Accounts"
        description="Manage your bank accounts"
        action={
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Account
          </Button>
        }
      />

      <div className="mb-6">
        <AccountsSummary
          totalBalance={data?.totalBalance ?? 0}
          accountCount={data?.accountCount ?? 0}
          isLoading={isLoading}
        />
      </div>

      <AccountsList
        accounts={data?.accounts ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onEdit={setEditingAccount}
        onDelete={setDeletingAccount}
        onClick={handleAccountClick}
        onCreateNew={() => setIsCreateModalOpen(true)}
      />

      <CreateAccountModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />

      <EditAccountModal
        account={editingAccount}
        onClose={() => setEditingAccount(null)}
      />

      <DeleteAccountDialog
        account={deletingAccount}
        onClose={() => setDeletingAccount(null)}
      />

      <BalanceHistoryDrawer
        account={selectedAccount}
        open={isHistoryDrawerOpen}
        onOpenChange={setIsHistoryDrawerOpen}
      />
    </div>
  )
}
```

### Update Barrel Export

**Final `src/components/accounts/index.ts`:**

```typescript
export { AccountsSummary } from './AccountsSummary'
export { AccountsList } from './AccountsList'
export { AccountRow } from './AccountRow'
export { AccountCard } from './AccountCard'
export { CreateAccountModal } from './CreateAccountModal'
export { EditAccountModal } from './EditAccountModal'
export { DeleteAccountDialog } from './DeleteAccountDialog'
export { BalanceHistoryDrawer } from './BalanceHistoryDrawer'
export { UpdateBalanceModal } from './UpdateBalanceModal'
export * from './schemas'
```

---

## Epic 2 Complete File Structure

```
src/
├── components/
│   └── accounts/
│       ├── AccountCard.tsx
│       ├── AccountRow.tsx
│       ├── AccountsList.tsx
│       ├── AccountsSummary.tsx
│       ├── BalanceHistoryDrawer.tsx
│       ├── CreateAccountModal.tsx
│       ├── DeleteAccountDialog.tsx
│       ├── EditAccountModal.tsx
│       ├── index.ts
│       ├── schemas.ts
│       └── UpdateBalanceModal.tsx
└── pages/
    └── AccountsPage.tsx
```

---

## Test Summary

| Component | Test File | Tests (approx) |
|-----------|-----------|----------------|
| AccountsSummary | AccountsSummary.test.tsx | 4 |
| AccountsList | AccountsList.test.tsx | 10 |
| CreateAccountModal | CreateAccountModal.test.tsx | 8 |
| EditAccountModal | EditAccountModal.test.tsx | 6 |
| DeleteAccountDialog | DeleteAccountDialog.test.tsx | 5 |
| BalanceHistoryDrawer | BalanceHistoryDrawer.test.tsx | 7 |
| UpdateBalanceModal | UpdateBalanceModal.test.tsx | 6 |

**Total: ~46 tests for Epic 2**

---

## MSW Handlers Update

Add these handlers to `src/test/mocks/handlers.ts`:

```typescript
// Add to existing handlers array:

// Create account
http.post('/api/bank-accounts', async ({ request }) => {
  const body = await request.json() as { name: string }
  return HttpResponse.json({
    id: crypto.randomUUID(),
    name: body.name,
    currentBalance: 0,
    createdAt: new Date().toISOString(),
  }, { status: 201 })
}),

// Update account
http.put('/api/bank-accounts/:id', async ({ request, params }) => {
  const body = await request.json()
  return HttpResponse.json({
    id: params.id,
    ...body,
    currentBalance: 0,
    createdAt: new Date().toISOString(),
  })
}),

// Delete account
http.delete('/api/bank-accounts/:id', () => {
  return new HttpResponse(null, { status: 204 })
}),

// Update balance
http.post('/api/bank-accounts/:id/balance', async ({ request, params }) => {
  const body = await request.json() as { newBalance: number }
  return HttpResponse.json({
    id: params.id,
    currentBalance: body.newBalance,
    previousBalance: 0,
    changeAmount: body.newBalance,
  })
}),

// Balance history
http.get('/api/bank-accounts/:id/balance-history', () => {
  return HttpResponse.json({
    content: [],
    page: { size: 20, number: 0, totalElements: 0, totalPages: 0 },
  })
}),
```

---

## Next Steps

After completing Epic 2:

1. Run all tests: `npm test`
2. Test manually in browser
3. Verify responsive behavior (desktop table, mobile cards)
4. Proceed to Epic 3: Recurring Expenses

---

*Last updated: December 2024*
