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
