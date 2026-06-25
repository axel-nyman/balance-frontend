import { useMemo } from 'react'
import type { AllocationPoint } from '@/lib/goal-projection'
import { formatCurrencyCompact } from '@/lib/utils'

interface GoalHistoryChartProps {
  /** Cumulative allocated-over-time points, oldest first. */
  points: AllocationPoint[]
  /** Optional target, drawn as a dashed reference line when in range. */
  targetAmount?: number | null
}

const VIEW_W = 600
const VIEW_H = 160
const PAD_X = 8
const PAD_TOP = 12
const PAD_BOTTOM = 22

function shortDate(date: string): string {
  return new Intl.DateTimeFormat('sv-SE', { month: 'short', year: 'numeric' }).format(new Date(date))
}

/**
 * A lightweight, dependency-free area+line chart of a goal's allocated total
 * over time. A focused single-goal view (item 070e) doesn't warrant a charting
 * library, so this renders plain SVG scaled to its container via `viewBox`.
 */
export function GoalHistoryChart({ points, targetAmount }: GoalHistoryChartProps) {
  const geometry = useMemo(() => {
    const times = points.map((p) => new Date(p.date).getTime())
    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)
    const timeSpan = maxTime - minTime || 1
    const hasTarget = targetAmount != null && targetAmount > 0
    const maxTotal = Math.max(...points.map((p) => p.total), hasTarget ? targetAmount! : 0, 1)

    const plotW = VIEW_W - PAD_X * 2
    const plotH = VIEW_H - PAD_TOP - PAD_BOTTOM
    const x = (time: number) => PAD_X + ((time - minTime) / timeSpan) * plotW
    const y = (total: number) => PAD_TOP + (1 - total / maxTotal) * plotH

    const coords = points.map((p) => ({ px: x(new Date(p.date).getTime()), py: y(p.total) }))
    const last = coords[coords.length - 1]
    const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.px} ${c.py}`).join(' ')
    const baseY = PAD_TOP + plotH
    const area = `${line} L ${last.px} ${baseY} L ${coords[0].px} ${baseY} Z`
    const targetY = hasTarget ? y(targetAmount!) : null

    return { coords, line, area, targetY, maxTotal }
  }, [points, targetAmount])

  const lastPoint = points[points.length - 1]
  const label = `Allocated from ${formatCurrencyCompact(points[0].total)} to ${formatCurrencyCompact(
    lastPoint.total
  )} over ${shortDate(points[0].date)}–${shortDate(lastPoint.date)}`

  return (
    <figure className="space-y-1" data-testid="goal-history-chart">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-40 text-primary"
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
      >
        <path d={geometry.area} fill="currentColor" fillOpacity={0.08} stroke="none" />
        {geometry.targetY !== null && (
          <line
            x1={PAD_X}
            x2={VIEW_W - PAD_X}
            y1={geometry.targetY}
            y2={geometry.targetY}
            className="text-muted-foreground"
            stroke="currentColor"
            strokeOpacity={0.5}
            strokeWidth={1}
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
          />
        )}
        <path
          d={geometry.line}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {geometry.coords.map((c, i) => (
          <circle key={i} cx={c.px} cy={c.py} r={2.5} fill="currentColor" />
        ))}
      </svg>
      <figcaption className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
        <span>{shortDate(points[0].date)}</span>
        {targetAmount != null && targetAmount > 0 && (
          <span className="text-muted-foreground/80">Target {formatCurrencyCompact(targetAmount)}</span>
        )}
        <span>{shortDate(lastPoint.date)}</span>
      </figcaption>
    </figure>
  )
}
