import { Repeat, HandCoins } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

interface WizardItemCardProps {
  name: string
  amount: number
  bankAccountName: string
  isRecurring?: boolean
  isManual?: boolean
  amountColorClass: 'text-expense' | 'text-income' | 'text-savings'
  onClick: () => void
}

export function WizardItemCard({
  name,
  amount,
  bankAccountName,
  isRecurring,
  isManual,
  amountColorClass,
  onClick,
}: WizardItemCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-card rounded-xl shadow-sm p-4 text-left transition-colors hover:bg-accent active:bg-accent"
    >
      {/* Row 1: Icons + Name */}
      <div className="flex items-center gap-2 min-w-0">
        {isRecurring && (
          <Repeat className="w-4 h-4 text-savings shrink-0" aria-label="Recurring" />
        )}
        {isManual && (
          <HandCoins className="w-4 h-4 text-amber-500 shrink-0" aria-label="Manual payment" />
        )}
        <span className="font-medium truncate">{name || 'Unnamed'}</span>
      </div>

      {/* Row 2: Bank account badge + Amount */}
      <div className="flex items-center justify-between mt-2">
        {bankAccountName ? (
          <Badge variant="secondary" className="text-xs font-normal">
            {bankAccountName}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
            No account
          </Badge>
        )}
        <span className={`font-semibold ${amountColorClass}`}>
          {formatCurrency(amount)}
        </span>
      </div>
    </button>
  )
}
