import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
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
}

export function StepReview({ lockAfterSave, onLockAfterSaveChange }: StepReviewProps) {
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
        <p className="text-sm text-gray-500">
          Review your budget for {state.month && state.year && formatMonthYear(state.month, state.year)} before saving.
        </p>
      </div>

      {/* Income Section */}
      <Collapsible open={incomeOpen} onOpenChange={setIncomeOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
            <div className="flex items-center gap-2">
              {incomeOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="font-medium">Income</span>
              <span className="text-gray-500">({state.incomeItems.length} items)</span>
            </div>
            <span className="font-semibold text-green-600">{formatCurrency(incomeTotal)}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <div className="space-y-2 text-sm">
            {state.incomeItems.map((item) => (
              <div key={item.id} className="flex justify-between">
                <div className="flex flex-col">
                  <span className="text-gray-900">{item.name}</span>
                  <span className="text-xs text-gray-500">{item.bankAccountName}</span>
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
              {expensesOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="font-medium">Expenses</span>
              <span className="text-gray-500">({state.expenseItems.length} items)</span>
            </div>
            <span className="font-semibold text-red-600">{formatCurrency(expensesTotal)}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <div className="space-y-2 text-sm">
            {state.expenseItems.length === 0 ? (
              <p className="text-gray-500">No expenses added</p>
            ) : (
              state.expenseItems.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div className="flex flex-col">
                    <span className="text-gray-900">{item.name}</span>
                    <span className="text-xs text-gray-500">{item.bankAccountName}</span>
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
              {savingsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="font-medium">Savings</span>
              <span className="text-gray-500">({state.savingsItems.length} items)</span>
            </div>
            <span className="font-semibold text-blue-600">{formatCurrency(savingsTotal)}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <div className="space-y-2 text-sm">
            {state.savingsItems.length === 0 ? (
              <p className="text-gray-500">No savings planned</p>
            ) : (
              state.savingsItems.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div className="flex flex-col">
                    <span className="text-gray-900">{item.name}</span>
                    <span className="text-xs text-gray-500">{item.bankAccountName}</span>
                  </div>
                  <span>{formatCurrency(item.amount)}</span>
                </div>
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Final Balance */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">Remaining Balance</span>
          <span className={cn('text-xl font-bold', balanceInfo.colorClass)}>
            {balanceInfo.text}
          </span>
        </div>
        {balance < 0 && (
          <p className="text-sm text-red-600 mt-2">
            Your expenses and savings exceed your income. Consider adjusting your budget.
          </p>
        )}
        {balance > 0 && !balanceInfo.isBalanced && (
          <p className="text-sm text-yellow-600 mt-2">
            You have unallocated income. Consider adding savings or expenses.
          </p>
        )}
      </div>

      {/* Lock option */}
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
      <p className="text-xs text-gray-500 -mt-4">
        Locking applies savings to account balances and creates a payment todo list.
        You can always lock later from the budget detail page.
      </p>

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Save button is handled by WizardNavigation in WizardShell */}
    </div>
  )
}
