# Update #007: Add Pagination to Balance History Drawer

**Purpose:** Implement "Load More" pagination for balance history  
**Files Affected:** `FRONTEND_STORIES_EPIC2.md` (Story 2.6)  
**Priority:** Medium (improves UX for accounts with long history)

---

## Problem Summary

From `ACCOUNTS_FLOW.md`:
> **Pagination**
> - API returns paginated results (20 per page default)
> - "Load More" button at bottom fetches next page
> - Sorted by date descending (newest first)

Epic 2 Story 2.6 (BalanceHistoryDrawer) doesn't implement pagination.

---

## Backend Reference

From `backend-stories.md` (Story 29):
```
GET /api/bank-accounts/{id}/balance-history?page=0&size=20

Success Response (200):
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

## Implementation Required

### 1. Update the Hook for Pagination

**Update `src/hooks/use-accounts.ts`:**

```typescript
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

---

### 2. Update Query Keys

**Update `src/hooks/query-keys.ts`:**

```typescript
export const queryKeys = {
  accounts: {
    all: ['accounts'] as const,
    detail: (id: string) => ['accounts', id] as const,
    history: (id: string) => ['accounts', id, 'history'] as const,
  },
  // ... other keys
}
```

---

### 3. Update BalanceHistoryDrawer Component

**Replace the implementation in Story 2.6:**

```typescript
// src/components/accounts/BalanceHistoryDrawer.tsx

import { useMemo } from 'react'
import { History, Plus, Loader2 } from 'lucide-react'
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
import type { BankAccount, BalanceHistoryEntry } from '@/api/types'

interface BalanceHistoryDrawerProps {
  account: BankAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateBalance?: () => void
}

export function BalanceHistoryDrawer({
  account,
  open,
  onOpenChange,
  onUpdateBalance,
}: BalanceHistoryDrawerProps) {
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

  if (!account) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-1">
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Balance History
          </SheetTitle>
          <p className="text-sm text-gray-500">{account.name}</p>
          <p className="text-lg font-semibold">{formatCurrency(account.currentBalance)}</p>
        </SheetHeader>

        <div className="mt-4 mb-6">
          <Button onClick={onUpdateBalance} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Update Balance
          </Button>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <HistoryEntrySkeleton key={i} />
            ))
          ) : allEntries.length === 0 ? (
            // Empty state
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No balance history yet.</p>
            </div>
          ) : (
            // History entries
            <>
              {allEntries.map((entry) => (
                <HistoryEntryCard key={entry.id} entry={entry} />
              ))}

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
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              )}

              {/* Page Info */}
              {pageInfo && (
                <p className="text-xs text-center text-gray-400 pt-2">
                  Showing {allEntries.length} of {pageInfo.totalElements} entries
                </p>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

interface HistoryEntryCardProps {
  entry: BalanceHistoryEntry
}

function HistoryEntryCard({ entry }: HistoryEntryCardProps) {
  const isPositive = entry.changeAmount >= 0
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600'
  const changePrefix = isPositive ? '+' : ''

  return (
    <div className="p-3 bg-white border border-gray-200 rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm text-gray-500">{formatDate(entry.changeDate)}</span>
        <Badge variant={entry.source === 'MANUAL' ? 'secondary' : 'default'}>
          {entry.source === 'MANUAL' ? '🔵 Manual' : '🟢 Automatic'}
        </Badge>
      </div>

      <div className="flex justify-between items-baseline">
        <span className="font-medium">{formatCurrency(entry.balance)}</span>
        <span className={`text-sm ${changeColor}`}>
          {changePrefix}{formatCurrency(entry.changeAmount)}
        </span>
      </div>

      {entry.comment && (
        <p className="text-sm text-gray-500 mt-2 italic">"{entry.comment}"</p>
      )}

      {entry.source === 'AUTOMATIC' && entry.budgetId && (
        <p className="text-xs text-gray-400 mt-1">
          From budget lock
        </p>
      )}
    </div>
  )
}

function HistoryEntrySkeleton() {
  return (
    <div className="p-3 bg-white border border-gray-200 rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="flex justify-between items-baseline">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  )
}
```

---

### 4. Add Tests for Pagination

**Update tests in Story 2.6:**

```typescript
// Add to BalanceHistoryDrawer.test.tsx

describe('BalanceHistoryDrawer pagination', () => {
  it('shows Load More button when more pages exist', async () => {
    server.use(
      http.get('/api/bank-accounts/:id/balance-history', () => {
        return HttpResponse.json({
          content: [mockEntry],
          page: { size: 20, number: 0, totalElements: 50, totalPages: 3 },
        })
      })
    )

    render(
      <BalanceHistoryDrawer
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument()
    })
  })

  it('hides Load More button when no more pages', async () => {
    server.use(
      http.get('/api/bank-accounts/:id/balance-history', () => {
        return HttpResponse.json({
          content: [mockEntry],
          page: { size: 20, number: 0, totalElements: 1, totalPages: 1 },
        })
      })
    )

    render(
      <BalanceHistoryDrawer
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument()
    })
  })

  it('loads next page when Load More is clicked', async () => {
    let requestCount = 0
    server.use(
      http.get('/api/bank-accounts/:id/balance-history', ({ request }) => {
        const url = new URL(request.url)
        const page = url.searchParams.get('page') ?? '0'
        requestCount++

        return HttpResponse.json({
          content: [{ ...mockEntry, id: `entry-page-${page}` }],
          page: {
            size: 20,
            number: parseInt(page),
            totalElements: 40,
            totalPages: 2,
          },
        })
      })
    )

    render(
      <BalanceHistoryDrawer
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText(/entry-page-0/i)).toBeInTheDocument()
    })

    // Click Load More
    await userEvent.click(screen.getByRole('button', { name: /load more/i }))

    // Wait for second page
    await waitFor(() => {
      expect(screen.getByText(/entry-page-1/i)).toBeInTheDocument()
    })

    expect(requestCount).toBe(2)
  })

  it('shows count of entries', async () => {
    server.use(
      http.get('/api/bank-accounts/:id/balance-history', () => {
        return HttpResponse.json({
          content: Array.from({ length: 20 }, (_, i) => ({ ...mockEntry, id: `e${i}` })),
          page: { size: 20, number: 0, totalElements: 150, totalPages: 8 },
        })
      })
    )

    render(
      <BalanceHistoryDrawer
        account={mockAccount}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/showing 20 of 150 entries/i)).toBeInTheDocument()
    })
  })
})
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/use-accounts.ts` | Replace `useBalanceHistory` with infinite query |
| `src/hooks/query-keys.ts` | Add history key |
| `src/components/accounts/BalanceHistoryDrawer.tsx` | Rewrite with pagination |
| Tests | Add pagination tests |

---

*Created: [Current Date]*
