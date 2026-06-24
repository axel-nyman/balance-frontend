import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import type { BankAccount } from '@/api/types'

interface AllocationImpactProps {
  account: BankAccount
  /** This goal's existing earmark on the account (0 when creating a goal). */
  currentAllocation: number
  /** The proposed new absolute earmark. */
  newAmount: number
}

/**
 * Live "what happens to this account" breakdown for an allocation. Allocations
 * are absolute earmarks, so this shows the account balance, how this goal's
 * earmark changes (before → after), and how much of the account stays
 * unallocated afterwards — recomputed as the user types. Over-allocation turns
 * the remaining figure red.
 */
export function AllocationImpact({
  account,
  currentAllocation,
  newAmount,
}: AllocationImpactProps) {
  const unallocatedNow = account.unallocatedAmount ?? 0
  // Raising this goal's earmark by (newAmount - currentAllocation) consumes that
  // much of the account's currently-unallocated money.
  const unallocatedAfter = unallocatedNow + currentAllocation - newAmount

  return (
    <div className="space-y-1.5 rounded-lg bg-muted/50 p-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Balance</span>
        <span className="tabular-nums text-foreground">
          {formatCurrency(account.currentBalance)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Earmarked for this goal</span>
        <span className="flex items-center gap-1 tabular-nums text-foreground">
          {formatCurrency(currentAllocation)}
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          {formatCurrency(newAmount)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Unallocated in {account.name}</span>
        <span className="flex items-center gap-1 tabular-nums text-foreground">
          {formatCurrency(unallocatedNow)}
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className={cn(unallocatedAfter < 0 && 'text-destructive')}>
            {formatCurrency(unallocatedAfter)}
          </span>
        </span>
      </div>
    </div>
  )
}
