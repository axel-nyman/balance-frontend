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
        isClickable && 'hover:bg-gray-50 cursor-pointer',
        !isClickable && 'cursor-not-allowed opacity-60',
        status === 'current' && 'bg-blue-50/50'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div
          className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
            status === 'complete' && 'bg-green-100 text-green-600',
            status === 'current' && 'bg-blue-100 text-blue-600',
            status === 'upcoming' && 'bg-gray-100 text-gray-400'
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
              status === 'current' ? 'text-gray-900' : 'text-gray-700'
            )}
          >
            {title}
          </h3>
          {!isExpanded && summary ? (
            <p className="text-xs text-gray-500 mt-0.5">{summary}</p>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5">{description}</p>
          )}
        </div>
      </div>

      {/* Expand indicator */}
      {isClickable && (
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-400 transition-transform duration-200',
            isExpanded && 'rotate-180'
          )}
        />
      )}
    </button>
  )
}
