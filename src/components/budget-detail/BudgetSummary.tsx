import { Sparkles, Check, ListChecks, CircleCheckBig } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { deriveDetailLifecycleState } from '@/lib/budget-lifecycle'
import type { DetailLifecycleState } from '@/lib/budget-lifecycle'
import { useTodoList } from '@/hooks/use-todo'
import { cn } from '@/lib/utils'
import type { BudgetDetail } from '@/api/types'

interface BudgetSummaryProps {
  budget: BudgetDetail
}

// =============================================================================
// BALANCE BAR (Scale metaphor)
// =============================================================================

function BalanceBar({ income, expenses, savings, subdued }: {
  income: number
  expenses: number
  savings: number
  subdued?: boolean
}) {
  const total = income + expenses + savings
  const overAllocated = expenses + savings > income
  const isBalanced = income > 0 && expenses + savings === income

  if (total === 0) {
    return (
      <div className={cn('space-y-1', subdued && 'opacity-60')}>
        <div className="relative flex justify-center">
          <span className="text-[10px] text-muted-foreground/50">▼</span>
        </div>
        <div className="h-3 rounded-full bg-muted" />
        <div className="flex justify-between text-[10px] text-muted-foreground/60 px-0.5">
          <span>Income</span>
          <span>Spending</span>
        </div>
      </div>
    )
  }

  const incomeWidth = (income / total) * 100
  const expenseWidth = (expenses / total) * 100
  const savingsWidth = (savings / total) * 100

  const fulcrumColor = isBalanced
    ? 'text-income'
    : overAllocated
      ? 'text-expense'
      : 'text-muted-foreground/50'

  return (
    <div className={cn(subdued && 'opacity-60')}>
      {/* Fulcrum marker above bar */}
      <div className="relative flex justify-center mb-0.5">
        <span className={cn('text-[10px] transition-colors duration-300', fulcrumColor)}>▼</span>
      </div>
      {/* Scale bar */}
      <div className={cn(
        'relative h-3 rounded-full overflow-hidden flex',
        overAllocated ? 'bg-expense-muted ring-1 ring-expense/20' : 'bg-muted'
      )}>
        {incomeWidth > 0 && (
          <div
            className="bg-income min-w-[4px] transition-all duration-300 first:rounded-l-full"
            style={{ width: `${incomeWidth}%` }}
          />
        )}
        {expenseWidth > 0 && (
          <div
            className="bg-expense min-w-[4px] transition-all duration-300"
            style={{ width: `${expenseWidth}%` }}
          />
        )}
        {savingsWidth > 0 && (
          <div
            className="bg-savings min-w-[4px] transition-all duration-300 last:rounded-r-full"
            style={{ width: `${savingsWidth}%` }}
          />
        )}
        {/* Center fulcrum line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-foreground/15" />
      </div>
      {/* Side labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground/60 mt-1 px-0.5">
        <span>Income</span>
        <span>Spending</span>
      </div>
    </div>
  )
}

// =============================================================================
// STATS ROW
// =============================================================================

function StatsRow({ income, expenses, savings }: {
  income: number
  expenses: number
  savings: number
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Income</p>
        <p className="text-sm tabular-nums font-medium text-income">{formatCurrency(income)}</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Expenses</p>
        <p className="text-sm tabular-nums font-medium text-expense">{formatCurrency(expenses)}</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Savings</p>
        <p className="text-sm tabular-nums font-medium text-savings">{formatCurrency(savings)}</p>
      </div>
    </div>
  )
}

// =============================================================================
// STAGE RENDERERS
// =============================================================================

function DraftEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Sparkles className="w-8 h-8 text-muted-foreground mb-3" />
      <p className="text-base font-medium">Start building your budget</p>
      <p className="text-sm text-muted-foreground">Add income, expenses, and savings below</p>
    </div>
  )
}

function BalanceRow({ balance }: { balance: number }) {
  const colorClass = balance >= 0 ? 'text-income' : 'text-expense'

  return (
    <div className="border-t border-border pt-3 mt-1 text-center">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Balance</p>
      <p className={cn('text-2xl tabular-nums font-light', colorClass)}>
        {balance > 0 && '+'}{formatCurrency(balance)}
      </p>
    </div>
  )
}

function DraftBuilding({ state }: { state: Extract<DetailLifecycleState, { type: 'draft-building' }> }) {
  const { totals } = state

  return (
    <div className="space-y-3">
      <BalanceBar income={totals.income} expenses={totals.expenses} savings={totals.savings} />
      <StatsRow income={totals.income} expenses={totals.expenses} savings={totals.savings} />
      <BalanceRow balance={totals.balance} />
    </div>
  )
}

function DraftBalanced({ state }: { state: Extract<DetailLifecycleState, { type: 'draft-balanced' }> }) {
  const { totals } = state

  return (
    <div className="space-y-3">
      <BalanceBar income={totals.income} expenses={totals.expenses} savings={totals.savings} />
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-income-muted flex items-center justify-center">
          <Check className="w-3.5 h-3.5 text-income" />
        </div>
        <div>
          <p className="text-income font-medium">Budget balanced</p>
          <p className="text-sm text-muted-foreground">Ready to lock and start tracking</p>
        </div>
      </div>
      <StatsRow income={totals.income} expenses={totals.expenses} savings={totals.savings} />
    </div>
  )
}

function LockedInProgress({ state }: { state: Extract<DetailLifecycleState, { type: 'locked-in-progress' }> }) {
  const { totals, completed, total } = state
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="space-y-3">
      <BalanceBar income={totals.income} expenses={totals.expenses} savings={totals.savings} subdued />
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-muted-foreground" />
          <span className="text-base font-medium">{completed} of {total} todos done</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>
      <StatsRow income={totals.income} expenses={totals.expenses} savings={totals.savings} />
    </div>
  )
}

function LockedComplete({ state, monthName }: {
  state: Extract<DetailLifecycleState, { type: 'locked-complete' }>
  monthName: string
}) {
  const { totals, savingsRate } = state
  const expensePercent = totals.income > 0 ? Math.round((totals.expenses / totals.income) * 100) : 0
  const savingsPercent = totals.income > 0 ? Math.round((totals.savings / totals.income) * 100) : 0

  return (
    <div className="space-y-3 text-center">
      <div className="flex flex-col items-center gap-2">
        <CircleCheckBig className="w-10 h-10 text-income" />
        <p className="text-lg font-semibold tracking-tight">All done for {monthName}!</p>
      </div>
      <div className="bg-card/50 rounded-xl p-3">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Income</p>
            <p className="text-sm tabular-nums font-medium">{formatCurrency(totals.income)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Expenses</p>
            <p className="text-sm tabular-nums font-medium">{formatCurrency(totals.expenses)}</p>
            <p className="text-xs tabular-nums text-muted-foreground">{expensePercent}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Savings</p>
            <p className="text-sm tabular-nums font-medium">{formatCurrency(totals.savings)}</p>
            <p className="text-xs tabular-nums text-muted-foreground">{savingsPercent}%</p>
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Saved {savingsRate}% of income this month</p>
    </div>
  )
}

// =============================================================================
// LOADING STATE
// =============================================================================

function LoadingSkeleton({ totals }: { totals: { income: number; expenses: number; savings: number } }) {
  return (
    <div className="space-y-3">
      <BalanceBar income={totals.income} expenses={totals.expenses} savings={totals.savings} subdued />
      <div className="space-y-2">
        <div className="h-5 w-48 bg-muted animate-pulse rounded" />
        <div className="h-2 w-full bg-muted animate-pulse rounded-full" />
      </div>
      <StatsRow income={totals.income} expenses={totals.expenses} savings={totals.savings} />
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BudgetSummary({ budget }: BudgetSummaryProps) {
  const isLocked = budget.status === 'LOCKED'
  const hasItems = budget.income.length > 0 || budget.expenses.length > 0 || budget.savings.length > 0

  const { data: todoData, isError: todoError } = useTodoList(budget.id, {
    enabled: isLocked,
    staleTime: 5 * 60 * 1000,
  })

  const state = deriveDetailLifecycleState(budget.totals, isLocked, hasItems, todoData?.summary, todoError)

  const isComplete = state?.type === 'locked-complete'

  function renderContent() {
    if (state === null) {
      return <LoadingSkeleton totals={budget.totals} />
    }

    switch (state.type) {
      case 'draft-empty':
        return <DraftEmpty />
      case 'draft-building':
        return <DraftBuilding state={state} />
      case 'draft-balanced':
        return <DraftBalanced state={state} />
      case 'locked-in-progress':
        return <LockedInProgress state={state} />
      case 'locked-complete':
        return <LockedComplete state={state} monthName={getMonthName(budget.month)} />
    }
  }

  return (
    <Card className={cn(isComplete && 'bg-income-muted')}>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  )
}
