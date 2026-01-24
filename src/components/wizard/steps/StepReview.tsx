import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWizard } from '../WizardContext'
import { formatCurrency, formatMonthYear, calculateBudgetTotals, formatBalance } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface StepReviewProps {
  lockAfterSave: boolean
  onLockAfterSaveChange: (checked: boolean) => void
  isBalanced: boolean
}

export function StepReview({ lockAfterSave, onLockAfterSaveChange, isBalanced }: StepReviewProps) {
  const { state } = useWizard()
  const [incomeOpen, setIncomeOpen] = useState(false)
  const [expensesOpen, setExpensesOpen] = useState(false)
  const [savingsOpen, setSavingsOpen] = useState(false)

  // Calculate totals
  const { incomeTotal, expensesTotal, savingsTotal, balance } = calculateBudgetTotals(
    state.incomeItems,
    state.expenseItems,
    state.savingsItems
  )
  const balanceInfo = formatBalance(balance)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Review your budget for {state.month && state.year && formatMonthYear(state.month, state.year)} before saving.
        </p>
      </div>

      {/* Income Section */}
      <Collapsible open={incomeOpen} onOpenChange={setIncomeOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
            <div className="flex items-center gap-2">
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  !incomeOpen && '-rotate-90'
                )}
              />
              <span className="font-medium">Income</span>
              <span className="text-muted-foreground">({state.incomeItems.length} items)</span>
            </div>
            <span className="font-semibold text-income">{formatCurrency(incomeTotal)}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <div className="space-y-2 text-sm">
            {state.incomeItems.map((item) => (
              <div key={item.id} className="flex justify-between">
                <div className="flex flex-col">
                  <span className="text-foreground">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.bankAccountName}</span>
                </div>
                <span>{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Expenses Section */}
      <Collapsible open={expensesOpen} onOpenChange={setExpensesOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
            <div className="flex items-center gap-2">
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  !expensesOpen && '-rotate-90'
                )}
              />
              <span className="font-medium">Expenses</span>
              <span className="text-muted-foreground">({state.expenseItems.length} items)</span>
            </div>
            <span className="font-semibold text-expense">{formatCurrency(expensesTotal)}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <div className="space-y-2 text-sm">
            {state.expenseItems.length === 0 ? (
              <p className="text-muted-foreground">No expenses added</p>
            ) : (
              state.expenseItems.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div className="flex flex-col">
                    <span className="text-foreground">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.bankAccountName}</span>
                  </div>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Savings Section */}
      <Collapsible open={savingsOpen} onOpenChange={setSavingsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
            <div className="flex items-center gap-2">
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  !savingsOpen && '-rotate-90'
                )}
              />
              <span className="font-medium">Savings</span>
              <span className="text-muted-foreground">({state.savingsItems.length} items)</span>
            </div>
            <span className="font-semibold text-savings">{formatCurrency(savingsTotal)}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <div className="space-y-2 text-sm">
            {state.savingsItems.length === 0 ? (
              <p className="text-muted-foreground">No savings planned</p>
            ) : (
              state.savingsItems.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div className="flex flex-col">
                    <span className="text-foreground">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.bankAccountName}</span>
                  </div>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Final Balance */}
      <div className="p-4 bg-muted rounded-xl">
        <div className="flex justify-between items-center">
          <span className="font-medium text-foreground/80">Remaining Balance</span>
          <span className={cn('text-xl font-bold', balanceInfo.colorClass)}>
            {balanceInfo.text}
          </span>
        </div>
        {balance < 0 && (
          <p className="text-sm text-destructive mt-2">
            Your expenses and savings exceed your income. Consider adjusting your budget.
          </p>
        )}
        {balance > 0 && !balanceInfo.isBalanced && (
          <p className="text-sm text-yellow-600 mt-2">
            You have unallocated income. Consider adding savings or expenses.
          </p>
        )}
      </div>

      {/* Lock option - only show when balanced */}
      {isBalanced && (
        <>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="lockAfterSave"
              checked={lockAfterSave}
              onCheckedChange={(checked) => onLockAfterSaveChange(checked === true)}
            />
            <Label htmlFor="lockAfterSave" className="text-sm font-normal cursor-pointer">
              Lock budget after saving
            </Label>
          </div>
          <p className="text-xs text-muted-foreground -mt-4">
            Locking applies savings to account balances and creates a payment todo list.
            You can always lock later from the budget detail page.
          </p>
        </>
      )}

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Save button is handled by WizardNavigation in WizardShell */}
    </div>
  )
}
