# Story 2.6: Balance History Drawer

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