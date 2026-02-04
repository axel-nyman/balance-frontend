/**
 * Animation Timing Constants
 *
 * These values must stay synchronized with the CSS animations in src/index.css.
 * If you change any values here, update the corresponding CSS as well.
 *
 * Animation sequence for quick-add copy:
 * 1. User clicks item → pop-check animation starts (200ms)
 * 2. After COLLAPSE_DELAY (250ms) → item collapses, new item added
 * 3. New item appears with fade-in-subtle (250ms)
 * 4. After TOTAL_ANIMATION_DURATION (700ms) → cleanup copying state
 */

/** Duration of the pop-check animation (scale bounce for check icon) */
export const POP_CHECK_DURATION = 200

/** Duration of the collapse-row animation */
export const COLLAPSE_DURATION = 250

/** Delay before collapse-row animation starts (pause after check icon) */
export const COLLAPSE_DELAY = 250

/** Duration of the fade-in-subtle entrance animation */
export const ENTRANCE_DURATION = 250

/**
 * Delay before executing the copy action.
 * This is when the collapse animation starts.
 */
export const COPY_ACTION_DELAY = COLLAPSE_DELAY

/**
 * Delay before clearing the entrance animation class.
 * Copy action + entrance animation duration.
 */
export const ENTRANCE_CLEANUP_DELAY = COLLAPSE_DELAY + ENTRANCE_DURATION

/**
 * Total animation duration for the full copy sequence.
 * pop-check + pause + collapse
 */
export const TOTAL_ANIMATION_DURATION = POP_CHECK_DURATION + COLLAPSE_DELAY + COLLAPSE_DURATION

/**
 * Stagger delay between items when adding multiple items (e.g., "Add All Due").
 */
export const CASCADE_STAGGER_DELAY = 100
