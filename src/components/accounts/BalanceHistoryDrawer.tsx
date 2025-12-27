import { useMemo } from 'react'
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

  return (
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

        {/* TODO: UpdateBalanceModal will be implemented in Story 02-07 */}
        <Button
          className="w-full mb-4"
          disabled
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
          ) : allEntries.length === 0 ? (
            <p className="p-4 text-center text-gray-500">No history yet</p>
          ) : (
            <>
              {allEntries.map((entry) => (
                <HistoryEntry key={entry.id} entry={entry} />
              ))}

              {hasNextPage && (
                <div className="p-4">
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
                </div>
              )}

              {pageInfo && (
                <p className="text-xs text-center text-gray-400 pb-4">
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
