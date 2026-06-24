import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import type { BankAccount } from '@/api/types'

interface AllocationImpactProps {
  account: BankAccount
  /** This goal's existing earmark on the account (0 when creating a goal). */
  currentAllocation: number
  /** The proposed new absolute earmark for this account. */
  value: number
  /** Called as the slider is dragged. */
  onValueChange: (value: number) => void
}

/**
 * Visual allocation control for a single account. A slider (capped at what the
 * account can actually earmark) drives the amount, and a stacked bar shows how
 * the account's balance splits up: money already earmarked by *other* goals,
 * the slice this goal would take, and what stays free. The remaining-free
 * figure is called out as the one number that matters — turning red the moment
 * the earmark would overdraw the account.
 */
export function AllocationImpact({
  account,
  currentAllocation,
  value,
  onValueChange,
}: AllocationImpactProps) {
  const balance = account.currentBalance
  // What other goals already earmark here — untouchable by this allocation.
  const otherEarmarks = Math.max(0, (account.allocatedAmount ?? 0) - currentAllocation)
  // The most this goal can earmark from the account.
  const max = Math.max(0, balance - otherEarmarks)
  const sliderValue = Math.min(Math.max(value, 0), max)
  const freeAfter = balance - otherEarmarks - value

  const widthPct = (amount: number) =>
    balance > 0 ? Math.min(100, Math.max(0, (amount / balance) * 100)) : 0

  return (
    <div className="space-y-2 rounded-lg bg-muted/50 p-3">
      <input
        type="range"
        min={0}
        max={max || 1}
        step={1}
        value={sliderValue}
        disabled={max <= 0}
        onChange={(e) => onValueChange(Number(e.target.value))}
        aria-label={`Amount to earmark from ${account.name}`}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary disabled:cursor-not-allowed disabled:opacity-50"
      />

      {/* Stacked bar over the account balance: other goals' earmarks, this
          goal's slice, then free space. */}
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="bg-muted-foreground/40" style={{ width: `${widthPct(otherEarmarks)}%` }} />
        <div
          className={cn(freeAfter < 0 ? 'bg-destructive' : 'bg-primary')}
          style={{ width: `${widthPct(Math.min(value, max))}%` }}
        />
      </div>

      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">Still free in {account.name}</span>
        <span
          className={cn(
            'text-sm font-medium tabular-nums',
            freeAfter < 0 ? 'text-destructive' : 'text-foreground'
          )}
        >
          {formatCurrency(freeAfter)}
        </span>
      </div>
    </div>
  )
}
