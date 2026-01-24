import { useState, useMemo, useRef, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
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
  const changeColor = entry.changeAmount >= 0 ? 'text-income' : 'text-expense'
  const changePrefix = entry.changeAmount >= 0 ? '+' : ''

  return (
    <div className="p-4 border-b border-border last:border-b-0">
      <div className="flex justify-between items-start mb-1">
        <span className="text-sm text-muted-foreground">{formatDate(entry.changeDate)}</span>
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
        <p className="text-sm text-muted-foreground mt-1">"{entry.comment}"</p>
      )}
      {entry.source === 'AUTOMATIC' && entry.budgetId && (
        <p className="text-sm text-muted-foreground mt-1">From budget</p>
      )}
    </div>
  )
}

export function BalanceHistoryDrawer({ account, open, onOpenChange }: BalanceHistoryDrawerProps) {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useBalanceHistory(account?.id ?? '', open && !!account)

  // Flatten all pages into a single array
  const allEntries = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap(page => page.content)
  }, [data])

  // Get pagination info from the last page
  const pageInfo = data?.pages?.[data.pages.length - 1]?.page

  // Sentinel ref for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Set up IntersectionObserver for automatic loading
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0,
      }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Balance History</SheetTitle>
          {account && (
            <div className="text-left">
              <p className="font-medium text-foreground">{account.name}</p>
              <p className="text-2xl font-semibold text-foreground">
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

        <div className="rounded-2xl bg-card shadow-sm">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ))}
            </div>
          ) : allEntries.length === 0 ? (
            <p className="p-4 text-center text-muted-foreground">No history yet</p>
          ) : (
            <>
              {allEntries.map((entry) => (
                <HistoryEntry key={entry.id} entry={entry} />
              ))}

              {/* Infinite scroll sentinel and loading indicator */}
              {hasNextPage && (
                <div ref={sentinelRef} className="p-4 flex justify-center">
                  {isFetchingNextPage && (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  )}
                </div>
              )}

              {pageInfo && (
                <p className="text-xs text-center text-muted-foreground pb-4">
                  Showing {allEntries.length} of {pageInfo.totalElements} entries
                </p>
              )}
            </>
          )}
        </div>

        {account && (
          <UpdateBalanceModal
            account={account}
            open={isUpdateModalOpen}
            onOpenChange={setIsUpdateModalOpen}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
