import { Repeat, HandCoins, Plus, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency } from '@/lib/utils'

interface WizardItemCardProps {
  name: string
  amount: number
  bankAccountName: string
  isRecurring?: boolean
  isManual?: boolean
  isDue?: boolean
  amountColorClass: 'text-expense' | 'text-income' | 'text-savings'
  onClick?: () => void
  onQuickAdd?: () => void
  isCopying?: boolean
  variant?: 'default' | 'quick-add'
}

export function WizardItemCard({
  name,
  amount,
  bankAccountName,
  isRecurring,
  isManual,
  isDue,
  amountColorClass,
  onClick,
  onQuickAdd,
  isCopying,
  variant = 'default',
}: WizardItemCardProps) {
  const isQuickAdd = variant === 'quick-add'

  // Quick-add variant: two-row layout without account badge
  if (isQuickAdd) {
    return (
      <div
        className={cn(
          'w-full bg-popover rounded-xl shadow-card p-4 transition-colors duration-150',
          isCopying && 'bg-income-muted'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {/* Row 1: Icons + Name */}
            <div className="flex items-center gap-2 min-w-0">
              {isRecurring && (
                <Repeat
                  className="w-4 h-4 shrink-0 text-savings/70"
                  aria-label="Recurring"
                />
              )}
              {isDue && (
                <Badge variant="destructive" className="text-xs py-0 shrink-0">
                  Due
                </Badge>
              )}
              <span className="font-medium truncate text-muted-foreground/70">
                {name || 'Unnamed'}
              </span>
            </div>

            {/* Row 2: Amount only */}
            <div className="mt-1">
              <span className="font-semibold text-muted-foreground/70">
                {formatCurrency(amount)}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onQuickAdd}
            disabled={isCopying}
            aria-label={`Add ${name}`}
            className="h-8 w-8 p-0 shrink-0"
          >
            <div className="relative w-4 h-4">
              <Plus
                className={cn(
                  'w-4 h-4 text-muted-foreground absolute inset-0 transition-all duration-100',
                  isCopying && 'opacity-0 rotate-90 scale-0'
                )}
              />
              <Check
                className={cn(
                  'w-4 h-4 text-income absolute inset-0',
                  isCopying ? 'animate-pop-check' : 'opacity-0 scale-0'
                )}
              />
            </div>
          </Button>
        </div>
      </div>
    )
  }

  // Default variant: two-row layout (Name row + Account/Amount row)
  const cardContent = (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        {/* Row 1: Icons + Name */}
        <div className="flex items-center gap-2 min-w-0">
          {isRecurring && (
            <Repeat
              className="w-4 h-4 shrink-0 text-savings"
              aria-label="Recurring"
            />
          )}
          {isManual && (
            <HandCoins
              className="w-4 h-4 shrink-0 text-amber-500"
              aria-label="Manual payment"
            />
          )}
          <span className="font-medium truncate">
            {name || 'Unnamed'}
          </span>
        </div>

        {/* Row 2: Bank account badge + Amount */}
        <div className="flex items-center justify-between mt-2">
          {bankAccountName ? (
            <Badge variant="secondary" className="text-xs font-normal">
              {bankAccountName}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-xs font-normal text-muted-foreground"
            >
              No account
            </Badge>
          )}
          <span className={`font-semibold ${amountColorClass}`}>
            {formatCurrency(amount)}
          </span>
        </div>
      </div>
    </div>
  )

  // Default variant: clickable button
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-popover rounded-xl shadow-card p-4 text-left transition-colors hover:bg-accent active:bg-accent"
    >
      {cardContent}
    </button>
  )
}
