import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface CollapseWrapperProps {
  /** Whether the content should be collapsing/collapsed */
  isCollapsing: boolean
  /** Additional classes for the outer wrapper (e.g., 'rounded-xl shadow-card') */
  className?: string
  /** Content to wrap with collapse animation */
  children: ReactNode
}

/**
 * Wraps content with a CSS Grid-based collapse animation.
 * When isCollapsing is true, animates from full height to zero with fade-out.
 *
 * Animation timing is defined in src/index.css (animate-collapse-row):
 * - 250ms delay before collapse starts
 * - 250ms collapse duration
 */
export function CollapseWrapper({
  isCollapsing,
  className,
  children,
}: CollapseWrapperProps) {
  return (
    <div
      className={cn(
        'grid overflow-hidden',
        isCollapsing ? 'animate-collapse-row' : 'grid-rows-[1fr]',
        className
      )}
    >
      <div className="overflow-hidden min-h-0">
        {children}
      </div>
    </div>
  )
}
