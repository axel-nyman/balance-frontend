import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface CollapseWrapperProps {
  /** Whether the content should be collapsing/collapsed */
  isCollapsing: boolean
  /** Whether this item should have top spacing (true for all items except first) */
  withSpacing?: boolean
  /** Additional classes for the outer wrapper (e.g., 'rounded-xl shadow-card') */
  className?: string
  /** Content to wrap with collapse animation */
  children: ReactNode
}

/**
 * Wraps content with a CSS Grid-based collapse animation.
 * When isCollapsing is true, animates from full height to zero with fade-out.
 *
 * Animation timing is defined in src/index.css:
 * - 250ms delay before collapse starts
 * - 250ms collapse duration
 *
 * When withSpacing is true:
 * - Applies mt-3 margin for spacing between items
 * - Uses collapse-row-with-spacing animation that also animates margin to 0
 */
export function CollapseWrapper({
  isCollapsing,
  withSpacing = false,
  className,
  children,
}: CollapseWrapperProps) {
  // Determine which animation class to use
  const animationClass = isCollapsing
    ? withSpacing
      ? 'animate-collapse-row-with-spacing'
      : 'animate-collapse-row'
    : 'grid-rows-[1fr]'

  return (
    <div
      className={cn(
        'grid overflow-hidden',
        animationClass,
        // Apply margin only when not collapsing (animation handles the margin when collapsing)
        withSpacing && !isCollapsing && 'mt-3',
        className
      )}
    >
      <div className="overflow-hidden min-h-0">
        {children}
      </div>
    </div>
  )
}
