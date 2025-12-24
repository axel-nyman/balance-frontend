# Story 2.2: Accounts List

**As a** user  
**I want to** see all my bank accounts with their balances  
**So that** I can get an overview of my finances

### Acceptance Criteria

- [x] Displays total balance across all accounts
- [x] Shows account count
- [x] Lists all accounts in a table (desktop) or cards (mobile)
- [x] Each account shows: name, description, balance
- [x] Shows loading state while fetching
- [x] Shows empty state when no accounts exist
- [x] Shows error state with retry on failure
- [x] Clicking a row opens balance history drawer (handler ready, drawer implemented in story 2.5)

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

- [x] All tests pass
- [x] Summary card shows total balance and count
- [x] Table view works on desktop
- [x] Card view works on mobile
- [x] Loading, error, and empty states work
- [x] Click handlers fire correctly

---