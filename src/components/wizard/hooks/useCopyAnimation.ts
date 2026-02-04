import { useState, useCallback } from 'react'
import {
  COPY_ACTION_DELAY,
  ENTRANCE_CLEANUP_DELAY,
  TOTAL_ANIMATION_DURATION,
} from '../constants'

interface CopyAnimationItem {
  id: string
}

interface UseCopyAnimationReturn {
  /** IDs currently being copied (showing check icon, collapsing) */
  copyingIds: Set<string>
  /** IDs just added (showing entrance animation) */
  newlyAddedIds: Set<string>
  /** Check if a specific item is being copied */
  isCopying: (id: string) => boolean
  /** Check if a specific item was just added */
  isNewlyAdded: (id: string) => boolean
  /** Start the copy animation for an item */
  startCopyAnimation: (sourceId: string, onCopy: (newId: string) => void) => void
  /** Check if all available items are being copied (for collapse detection) */
  isLastItemsCopying: <T extends CopyAnimationItem>(availableItems: T[]) => boolean
}

/**
 * Hook for managing copy animation state and timing.
 *
 * Handles the animation sequence when copying items from "quick-add" sections:
 * 1. User clicks → check icon pops, copying state set
 * 2. After COPY_ACTION_DELAY → onCopy callback fires, new item appears
 * 3. New item shows entrance animation
 * 4. After TOTAL_ANIMATION_DURATION → copying state cleared
 */
export function useCopyAnimation(): UseCopyAnimationReturn {
  const [copyingIds, setCopyingIds] = useState<Set<string>>(new Set())
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set())

  const isCopying = useCallback(
    (id: string) => copyingIds.has(id),
    [copyingIds]
  )

  const isNewlyAdded = useCallback(
    (id: string) => newlyAddedIds.has(id),
    [newlyAddedIds]
  )

  const startCopyAnimation = useCallback(
    (sourceId: string, onCopy: (newId: string) => void) => {
      // Prevent double-clicks
      if (copyingIds.has(sourceId)) return

      // Start animation - show check icon
      setCopyingIds((prev) => new Set(prev).add(sourceId))

      // Generate ID for the new item
      const newId = crypto.randomUUID()

      // After collapse delay, execute the copy and show entrance animation
      setTimeout(() => {
        setNewlyAddedIds((prev) => new Set(prev).add(newId))
        onCopy(newId)
      }, COPY_ACTION_DELAY)

      // Clear entrance animation class after it completes
      setTimeout(() => {
        setNewlyAddedIds((prev) => {
          const next = new Set(prev)
          next.delete(newId)
          return next
        })
      }, ENTRANCE_CLEANUP_DELAY)

      // Clear copying state after full animation completes
      setTimeout(() => {
        setCopyingIds((prev) => {
          const next = new Set(prev)
          next.delete(sourceId)
          return next
        })
      }, TOTAL_ANIMATION_DURATION)
    },
    [copyingIds]
  )

  const isLastItemsCopying = useCallback(
    <T extends CopyAnimationItem>(availableItems: T[]) => {
      return (
        availableItems.length > 0 &&
        availableItems.every((item) => copyingIds.has(item.id))
      )
    },
    [copyingIds]
  )

  return {
    copyingIds,
    newlyAddedIds,
    isCopying,
    isNewlyAdded,
    startCopyAnimation,
    isLastItemsCopying,
  }
}
