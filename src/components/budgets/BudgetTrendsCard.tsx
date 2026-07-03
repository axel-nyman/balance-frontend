import { useMemo } from 'react'
import { TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrencyCompact } from '@/lib/utils'
import { selectTrendBudgets } from '@/lib/budget-trends'
import type { BudgetSummary } from '@/api/types'

const VIEW_W = 600
const VIEW_H = 180
const PAD_X = 8
const PAD_TOP = 12
const PAD_BOTTOM = 12

const SERIES = [
  { key: 'income', label: 'Income', className: 'text-income' },
  { key: 'expenses', label: 'Expenses', className: 'text-expense' },
  { key: 'savings', label: 'Savings', className: 'text-savings' },
] as const

function shortMonthYear(month: number, year: number): string {
  return new Intl.DateTimeFormat('sv-SE', { month: 'short', year: 'numeric' }).format(
    new Date(year, month - 1)
  )
}

function savingsRate(totals: BudgetSummary['totals']): number {
  return totals.income > 0 ? Math.round((totals.savings / totals.income) * 100) : 0
}

interface BudgetTrendsCardProps {
  budgets: BudgetSummary[]
}

/**
 * Month-over-month income/expenses/savings trends for locked budgets (item
 * 110). Drafts are plans, not outcomes, so they are excluded; with fewer than
 * two locked budgets there is no trend to show and the card renders nothing.
 * Dependency-free inline SVG in the same style as `GoalHistoryChart`.
 */
export function BudgetTrendsCard({ budgets }: BudgetTrendsCardProps) {
  const trend = useMemo(() => selectTrendBudgets(budgets), [budgets])

  const geometry = useMemo(() => {
    if (trend.length < 2) return null

    const maxValue = Math.max(
      ...trend.flatMap((b) => [b.totals.income, b.totals.expenses, b.totals.savings]),
      1
    )
    const plotW = VIEW_W - PAD_X * 2
    const plotH = VIEW_H - PAD_TOP - PAD_BOTTOM
    const x = (index: number) => PAD_X + (index / (trend.length - 1)) * plotW
    const y = (value: number) => PAD_TOP + (1 - value / maxValue) * plotH

    const lines = SERIES.map((series) => ({
      ...series,
      coords: trend.map((budget, i) => ({ px: x(i), py: y(budget.totals[series.key]) })),
      path: trend
        .map((budget, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(budget.totals[series.key])}`)
        .join(' '),
    }))

    return { lines, baseY: PAD_TOP + plotH }
  }, [trend])

  if (trend.length < 2 || !geometry) return null

  const latest = trend[trend.length - 1]
  const latestRate = savingsRate(latest.totals)
  const averageRate = Math.round(
    trend.reduce((sum, budget) => sum + savingsRate(budget.totals), 0) / trend.length
  )
  const firstLabel = shortMonthYear(trend[0].month, trend[0].year)
  const lastLabel = shortMonthYear(latest.month, latest.year)

  return (
    <Card className="mb-6" data-testid="budget-trends-card">
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-foreground">Trends</h2>
          </div>
          <ul className="flex items-center gap-4">
            {SERIES.map((series) => (
              <li key={series.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span aria-hidden className={`w-2 h-2 rounded-full bg-current ${series.className}`} />
                {series.label}
              </li>
            ))}
          </ul>
        </div>

        <figure className="space-y-1">
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="w-full h-40"
            preserveAspectRatio="none"
            role="img"
            aria-label={`Income, expenses and savings per month for ${trend.length} locked budgets, ${firstLabel} to ${lastLabel}`}
          >
            <line
              x1={PAD_X}
              x2={VIEW_W - PAD_X}
              y1={geometry.baseY}
              y2={geometry.baseY}
              className="text-border"
              stroke="currentColor"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            {geometry.lines.map((line) => (
              <g key={line.key} className={line.className} data-testid={`trends-line-${line.key}`}>
                <path
                  d={line.path}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                {line.coords.map((c, i) => (
                  <circle key={i} cx={c.px} cy={c.py} r={2.5} fill="currentColor" />
                ))}
              </g>
            ))}
          </svg>
          <figcaption className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
            <span>{firstLabel}</span>
            <span>{lastLabel}</span>
          </figcaption>
        </figure>

        <p className="text-sm text-foreground border-t border-border pt-3">
          Savings rate <span className="font-medium tabular-nums">{latestRate}%</span> in {lastLabel}{' '}
          (<span className="tabular-nums">{formatCurrencyCompact(latest.totals.savings)}</span> of{' '}
          <span className="tabular-nums">{formatCurrencyCompact(latest.totals.income)}</span>) ·{' '}
          <span className="tabular-nums">{averageRate}%</span> average over these {trend.length} months
        </p>
      </CardContent>
    </Card>
  )
}
