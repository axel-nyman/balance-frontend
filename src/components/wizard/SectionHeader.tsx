import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  description: string
  status: 'complete' | 'current' | 'upcoming'
  summary?: string
  isExpanded: boolean
  onClick: () => void
}

export function SectionHeader({
  title,
  description,
  status,
  summary,
  isExpanded,
  onClick,
}: SectionHeaderProps) {
  const isClickable = status !== 'upcoming'

  return (
    <button
      type="button"
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={cn(
        'w-full flex items-center justify-between p-4 text-left transition-colors',
        isClickable && 'hover:bg-accent cursor-pointer',
        !isClickable && 'cursor-not-allowed opacity-60',
        status === 'current' && 'bg-accent'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div
          className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
            status === 'complete' && 'bg-income-muted text-income',
            status === 'current' && 'bg-savings-muted text-savings',
            status === 'upcoming' && 'bg-muted text-muted-foreground'
          )}
        >
          {status === 'complete' ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-current" />
          )}
        </div>

        {/* Title and description */}
        <div>
          <h3
            className={cn(
              'text-sm font-medium',
              status === 'current' ? 'text-foreground' : 'text-foreground/80'
            )}
          >
            {title}
          </h3>
          {!isExpanded && summary ? (
            <p className="text-xs text-muted-foreground mt-0.5">{summary}</p>
          ) : (
            <p className="text-xs text-muted-foreground/70 mt-0.5">{description}</p>
          )}
        </div>
      </div>

      {/* Expand indicator */}
      {isClickable && (
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform duration-200',
            isExpanded && 'rotate-180'
          )}
        />
      )}
    </button>
  )
}
