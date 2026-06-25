import { describe, it, expect } from 'vitest'
import {
  buildAllocationSeries,
  computeProgress,
  inferMonthlyVelocity,
  projectCompletion,
  assessEndDate,
  monthsBetween,
  type AllocationPoint,
} from './goal-projection'
import type { GoalAllocationChange } from '@/api/types'

function change(createdAt: string, changeAmount: number, resultingAmount = 0): GoalAllocationChange {
  return {
    id: createdAt,
    bankAccountId: '1',
    bankAccountName: 'Checking',
    changeAmount,
    resultingAmount,
    source: 'MANUAL',
    createdAt,
  }
}

function points(...pairs: [string, number][]): AllocationPoint[] {
  return pairs.map(([date, total]) => ({ date, total }))
}

describe('buildAllocationSeries', () => {
  it('reconstructs a cumulative total from the signed-delta ledger', () => {
    // Ledger arrives newest-first; deltas can span multiple backing accounts.
    const changes = [
      change('2025-03-01T00:00:00Z', 1000),
      change('2025-02-01T00:00:00Z', 2000),
      change('2025-01-01T00:00:00Z', 1500),
    ]
    expect(buildAllocationSeries(changes)).toEqual([
      { date: '2025-01-01T00:00:00Z', total: 1500 },
      { date: '2025-02-01T00:00:00Z', total: 3500 },
      { date: '2025-03-01T00:00:00Z', total: 4500 },
    ])
  })

  it('handles reductions (negative deltas) in the running total', () => {
    const series = buildAllocationSeries([
      change('2025-02-01T00:00:00Z', -500),
      change('2025-01-01T00:00:00Z', 2000),
    ])
    expect(series[series.length - 1].total).toBe(1500)
  })

  it('returns an empty series for no history', () => {
    expect(buildAllocationSeries([])).toEqual([])
  })
})

describe('computeProgress', () => {
  it('computes remaining and percent', () => {
    expect(computeProgress({ targetAmount: 10000, totalAllocated: 4000 })).toEqual({
      remaining: 6000,
      percent: 40,
    })
  })

  it('clamps remaining at zero when over-funded but keeps percent above 100', () => {
    expect(computeProgress({ targetAmount: 10000, totalAllocated: 12000 })).toEqual({
      remaining: 0,
      percent: 120,
    })
  })

  it('returns null when there is no positive target', () => {
    expect(computeProgress({ targetAmount: null, totalAllocated: 4000 })).toBeNull()
    expect(computeProgress({ targetAmount: 0, totalAllocated: 0 })).toBeNull()
  })
})

describe('inferMonthlyVelocity', () => {
  it('infers a monthly pace from two points a month apart', () => {
    const v = inferMonthlyVelocity(
      points(['2025-01-01T00:00:00Z', 1000], ['2025-02-01T00:00:00Z', 2000])
    )
    expect(v).not.toBeNull()
    expect(v!).toBeCloseTo(1000 / monthsBetween('2025-01-01T00:00:00Z', '2025-02-01T00:00:00Z'), 5)
  })

  it('returns null with only one data point', () => {
    expect(inferMonthlyVelocity(points(['2025-01-01T00:00:00Z', 1000]))).toBeNull()
  })

  it('returns null when the span is shorter than the minimum history window', () => {
    expect(
      inferMonthlyVelocity(
        points(['2025-01-01T00:00:00Z', 1000], ['2025-01-05T00:00:00Z', 3000])
      )
    ).toBeNull()
  })

  it('returns null when the trend is flat or negative', () => {
    expect(
      inferMonthlyVelocity(
        points(['2025-01-01T00:00:00Z', 3000], ['2025-03-01T00:00:00Z', 2000])
      )
    ).toBeNull()
  })
})

describe('projectCompletion', () => {
  const now = new Date('2025-03-01T00:00:00Z')

  it('projects a completion date from sufficient history', () => {
    // 1000 kr/month pace, 6000 remaining -> ~6 months out.
    const series = points(['2025-01-01T00:00:00Z', 1000], ['2025-03-01T00:00:00Z', 3000])
    const result = projectCompletion({ targetAmount: 9000, totalAllocated: 3000 }, series, now)
    expect(result.status).toBe('projected')
    if (result.status !== 'projected') throw new Error('expected projected')
    expect(result.remaining).toBe(6000)
    expect(result.perMonth).toBeCloseTo(1000, -2) // ~1032/mo over a 59-day span
    expect(result.monthsToTarget).toBeCloseTo(6, 0)
    // ~6 months after 1 Mar 2025 lands in late summer / autumn 2025.
    expect(result.date.getFullYear()).toBe(2025)
    expect(result.date.getMonth()).toBe(7) // August (0-indexed)
  })

  it('reports insufficient history when there is only one allocation', () => {
    const series = points(['2025-02-20T00:00:00Z', 1000])
    expect(projectCompletion({ targetAmount: 9000, totalAllocated: 1000 }, series, now).status).toBe(
      'insufficient'
    )
  })

  it('reports reached when already at or above target', () => {
    const series = points(['2025-01-01T00:00:00Z', 1000], ['2025-03-01T00:00:00Z', 9000])
    expect(projectCompletion({ targetAmount: 9000, totalAllocated: 9000 }, series, now).status).toBe(
      'reached'
    )
  })

  it('reports no-target when the goal has no target', () => {
    expect(projectCompletion({ targetAmount: null, totalAllocated: 1000 }, [], now).status).toBe(
      'no-target'
    )
  })
})

describe('assessEndDate', () => {
  const now = new Date('2025-01-01T00:00:00Z')

  it('computes the required monthly contribution and flags being behind pace', () => {
    // 6000 remaining over ~6 months -> ~1000/month required; current pace 500.
    const series = points(['2024-10-01T00:00:00Z', 500], ['2024-12-31T00:00:00Z', 2000])
    const result = assessEndDate(
      { targetAmount: 8000, endDate: '2025-07-01', totalAllocated: 2000 },
      series,
      now
    )
    expect(result.status).toBe('assessable')
    if (result.status !== 'assessable') throw new Error('expected assessable')
    expect(result.remaining).toBe(6000)
    expect(result.monthsRemaining).toBeCloseTo(6, 0)
    expect(result.requiredPerMonth).toBeCloseTo(1000, -2)
    expect(result.currentPerMonth).not.toBeNull()
    expect(result.currentPerMonth!).toBeCloseTo(500, -2)
    expect(result.onTrack).toBe(false)
  })

  it('flags being on track when the current pace meets the requirement', () => {
    // 3000 remaining over ~6 months -> ~500/month required; current pace ~1500.
    const series = points(['2024-10-01T00:00:00Z', 1500], ['2024-12-31T00:00:00Z', 6000])
    const result = assessEndDate(
      { targetAmount: 9000, endDate: '2025-07-01', totalAllocated: 6000 },
      series,
      now
    )
    if (result.status !== 'assessable') throw new Error('expected assessable')
    expect(result.onTrack).toBe(true)
  })

  it('leaves onTrack unknown when history is too thin to infer a pace', () => {
    const result = assessEndDate(
      { targetAmount: 9000, endDate: '2025-07-01', totalAllocated: 2000 },
      points(['2024-12-20T00:00:00Z', 2000]),
      now
    )
    if (result.status !== 'assessable') throw new Error('expected assessable')
    expect(result.currentPerMonth).toBeNull()
    expect(result.onTrack).toBeNull()
  })

  it('reports past when the end date has already passed without reaching target', () => {
    expect(
      assessEndDate(
        { targetAmount: 9000, endDate: '2024-12-01', totalAllocated: 2000 },
        [],
        now
      ).status
    ).toBe('past')
  })

  it('reports reached when the target is already met', () => {
    expect(
      assessEndDate(
        { targetAmount: 9000, endDate: '2025-07-01', totalAllocated: 9000 },
        [],
        now
      ).status
    ).toBe('reached')
  })

  it('reports no-end-date when no end date is set', () => {
    expect(
      assessEndDate({ targetAmount: 9000, endDate: null, totalAllocated: 2000 }, [], now).status
    ).toBe('no-end-date')
  })
})
