import type { GoalAllocationChange } from '@/api/types'

/**
 * Pure functions for the goal detail page's progress, history and projection
 * views (item 070e). Kept dependency-free and side-effect-free so they can be
 * unit-tested in isolation, mirroring `budget-lifecycle.ts`.
 *
 * "Now" is always passed in rather than read from the clock, so projections are
 * deterministic under test.
 */

/** Average days per month (365.25 / 12) for converting day spans to months. */
const DAYS_PER_MONTH = 30.4375
const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Minimum span of allocation history required to infer a saving pace. Below
 * this we treat the history as too thin to project from and fall back to a
 * "not enough history yet" message rather than a misleading guess.
 */
export const MIN_HISTORY_DAYS = 14

export interface AllocationPoint {
  /** ISO timestamp of the data point. */
  date: string
  /** The goal's cumulative allocated total at this point. */
  total: number
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Reconstruct the goal's allocated-total-over-time from its allocation-change
 * ledger. Each change carries a signed `changeAmount` (the delta applied to one
 * backing account); summing them in chronological order yields the goal's total
 * after every change. The ledger arrives newest-first, so we sort ascending.
 */
export function buildAllocationSeries(changes: GoalAllocationChange[]): AllocationPoint[] {
  const ordered = [...changes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
  let running = 0
  return ordered.map((change) => {
    running += change.changeAmount
    return { date: change.createdAt, total: round2(running) }
  })
}

/** Month span between two instants; fractional, and negative if `to` precedes `from`. */
export function monthsBetween(from: Date | string, to: Date | string): number {
  const ms = new Date(to).getTime() - new Date(from).getTime()
  return ms / (DAYS_PER_MONTH * MS_PER_DAY)
}

function addMonths(from: Date, months: number): Date {
  return new Date(from.getTime() + months * DAYS_PER_MONTH * MS_PER_DAY)
}

export interface GoalProgress {
  /** Amount still needed to reach the target (never negative). */
  remaining: number
  /** Allocated / target as a percentage (can exceed 100). */
  percent: number
}

/** Allocated-vs-target progress. Null when the goal has no positive target. */
export function computeProgress(goal: {
  targetAmount: number | null
  totalAllocated: number
}): GoalProgress | null {
  if (goal.targetAmount === null || goal.targetAmount <= 0) return null
  return {
    remaining: Math.max(0, round2(goal.targetAmount - goal.totalAllocated)),
    percent: (goal.totalAllocated / goal.targetAmount) * 100,
  }
}

/**
 * Average monthly saving pace inferred from the allocation series: the net
 * growth between the first and last data points divided by the months between
 * them. Returns null when there isn't enough history (fewer than two points, a
 * span shorter than {@link MIN_HISTORY_DAYS}, or a non-positive trend) to avoid
 * a misleading projection.
 */
export function inferMonthlyVelocity(series: AllocationPoint[]): number | null {
  if (series.length < 2) return null
  const first = series[0]
  const last = series[series.length - 1]
  const spanDays = (new Date(last.date).getTime() - new Date(first.date).getTime()) / MS_PER_DAY
  if (spanDays < MIN_HISTORY_DAYS) return null
  const gain = last.total - first.total
  if (gain <= 0) return null
  return gain / monthsBetween(first.date, last.date)
}

export type ProjectionResult =
  | { status: 'no-target' }
  | { status: 'reached' }
  | { status: 'insufficient' }
  | {
      status: 'projected'
      perMonth: number
      remaining: number
      monthsToTarget: number
      date: Date
    }

/**
 * Estimate when the target will be reached at the current pace. Reports
 * `no-target` when there's nothing to project towards, `reached` when already
 * funded, and `insufficient` when history is too thin to infer a pace.
 */
export function projectCompletion(
  goal: { targetAmount: number | null; totalAllocated: number },
  series: AllocationPoint[],
  now: Date
): ProjectionResult {
  if (goal.targetAmount === null || goal.targetAmount <= 0) return { status: 'no-target' }
  const remaining = goal.targetAmount - goal.totalAllocated
  if (remaining <= 0) return { status: 'reached' }
  const perMonth = inferMonthlyVelocity(series)
  if (perMonth === null) return { status: 'insufficient' }
  const monthsToTarget = remaining / perMonth
  return {
    status: 'projected',
    perMonth,
    remaining: round2(remaining),
    monthsToTarget,
    date: addMonths(now, monthsToTarget),
  }
}

export type EndDateResult =
  | { status: 'no-end-date' }
  | { status: 'reached' }
  | { status: 'past' }
  | {
      status: 'assessable'
      remaining: number
      monthsRemaining: number
      requiredPerMonth: number
      /** Inferred current pace, or null when history is too thin to know it. */
      currentPerMonth: number | null
      /** Whether the current pace meets the required pace; null when unknown. */
      onTrack: boolean | null
    }

/**
 * For a goal with an end date, the monthly contribution required to hit the
 * target by then, compared against the current inferred pace. `past` means the
 * end date has already passed without reaching the target.
 */
export function assessEndDate(
  goal: { targetAmount: number | null; endDate: string | null; totalAllocated: number },
  series: AllocationPoint[],
  now: Date
): EndDateResult {
  if (goal.endDate === null || goal.targetAmount === null || goal.targetAmount <= 0) {
    return { status: 'no-end-date' }
  }
  const remaining = goal.targetAmount - goal.totalAllocated
  if (remaining <= 0) return { status: 'reached' }
  const monthsRemaining = monthsBetween(now, goal.endDate)
  if (monthsRemaining <= 0) return { status: 'past' }
  const requiredPerMonth = remaining / monthsRemaining
  const currentPerMonth = inferMonthlyVelocity(series)
  return {
    status: 'assessable',
    remaining: round2(remaining),
    monthsRemaining,
    requiredPerMonth,
    currentPerMonth,
    onTrack: currentPerMonth === null ? null : currentPerMonth >= requiredPerMonth,
  }
}
