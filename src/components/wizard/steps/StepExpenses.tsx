import { useState, useMemo } from 'react'
import { Plus, Trash2, Repeat, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AccountSelect } from '@/components/accounts'
import { useWizard } from '../WizardContext'
import { useAccounts, useRecurringExpenses, useIsMobile } from '@/hooks'
import { cn, formatCurrency, generateId } from '@/lib/utils'
import { WizardItemCard } from '../WizardItemCard'
import { WizardItemEditModal } from '../WizardItemEditModal'
import { useCopyAnimation } from '../hooks'
import { CollapseWrapper } from '../CollapseWrapper'
import {
  TOTAL_ANIMATION_DURATION,
  CASCADE_STAGGER_DELAY,
} from '../constants'
import type { RecurringExpense } from '@/api/types'
import type { WizardExpenseItem } from '../types'

export function StepExpenses() {
  const { state, dispatch } = useWizard()
  const { data: accountsData } = useAccounts()
  const { data: recurringData } = useRecurringExpenses()
  const isMobile = useIsMobile()
  const {
    copyingIds,
    newlyAddedIds,
    startCopyAnimation,
    isLastItemsCopying: checkLastItemsCopying,
  } = useCopyAnimation()
  const [editingItem, setEditingItem] = useState<WizardExpenseItem | null>(null)
  const [isAddingAllDue, setIsAddingAllDue] = useState(false)

  const accounts = accountsData?.accounts ?? []

  // Calculate totals for balance display
  const totalIncome = state.incomeItems.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  )

  // Memoize recurring expenses to avoid dependency array issues
  const recurringExpenses = useMemo(
    () => recurringData?.expenses ?? [],
    [recurringData?.expenses]
  )

  // Track which recurring expenses have been added
  const addedRecurringExpenseIds = useMemo(() => {
    const ids = new Set<string>()
    for (const item of state.expenseItems) {
      if (item.recurringExpenseId) {
        ids.add(item.recurringExpenseId)
      }
    }
    return ids
  }, [state.expenseItems])

  // Filter and sort recurring expenses: due first, then by name
  // Keep items in the list while they're animating (copyingIds)
  const availableRecurring = useMemo(() => {
    return recurringExpenses
      .filter(
        (exp) =>
          !addedRecurringExpenseIds.has(exp.id) || copyingIds.has(exp.id)
      )
      .sort((a, b) => {
        if (a.isDue !== b.isDue) return a.isDue ? -1 : 1
        return a.name.localeCompare(b.name)
      })
  }, [recurringExpenses, addedRecurringExpenseIds, copyingIds])

  // Separate into due and not due
  const dueExpenses = availableRecurring.filter((exp) => exp.isDue)
  const otherExpenses = availableRecurring.filter((exp) => !exp.isDue)

  // Check if all remaining available items are being copied (Card should collapse)
  const isLastItemsCopying = checkLastItemsCopying(availableRecurring)

  const totalExpenses = state.expenseItems.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  )
  const remainingBalance = totalIncome - totalExpenses

  const handleAddItem = () => {
    const newItem = {
      id: generateId(),
      name: '',
      amount: 0,
      bankAccountId: '',
      bankAccountName: '',
      isManual: false,
    }

    dispatch({ type: 'ADD_EXPENSE_ITEM', item: newItem })

    // Auto-open modal on mobile
    if (isMobile) {
      setEditingItem(newItem)
    }
  }

  const handleAddRecurring = (recurring: RecurringExpense) => {
    startCopyAnimation(recurring.id, (newId) => {
      dispatch({
        type: 'ADD_EXPENSE_ITEM',
        item: {
          id: newId,
          name: recurring.name,
          amount: recurring.amount,
          bankAccountId: '',
          bankAccountName: '',
          isManual: recurring.isManual,
          recurringExpenseId: recurring.id,
        },
      })
    })
  }

  const handleAddAllDue = () => {
    if (isAddingAllDue) return

    const itemsToAdd = dueExpenses.filter((exp) => !copyingIds.has(exp.id))
    if (itemsToAdd.length === 0) return

    setIsAddingAllDue(true)

    // Stagger each item for cascade effect
    itemsToAdd.forEach((recurring, index) => {
      setTimeout(() => {
        handleAddRecurring(recurring)
      }, index * CASCADE_STAGGER_DELAY)
    })

    // Reset state after all animations complete
    const totalTime = (itemsToAdd.length - 1) * CASCADE_STAGGER_DELAY + TOTAL_ANIMATION_DURATION
    setTimeout(() => {
      setIsAddingAllDue(false)
    }, totalTime)
  }

  const handleUpdateItem = (
    id: string,
    field: keyof WizardExpenseItem,
    value: string | number | boolean
  ) => {
    if (field === 'bankAccountId') {
      const account = accounts.find((a) => a.id === value)
      dispatch({
        type: 'UPDATE_EXPENSE_ITEM',
        id,
        updates: {
          bankAccountId: value as string,
          bankAccountName: account?.name ?? '',
        },
      })
    } else {
      dispatch({
        type: 'UPDATE_EXPENSE_ITEM',
        id,
        updates: { [field]: value },
      })
    }
  }

  const handleRemoveItem = (id: string) => {
    dispatch({ type: 'REMOVE_EXPENSE_ITEM', id })
  }

  const handleSaveItem = (id: string, updates: Partial<WizardExpenseItem>) => {
    dispatch({ type: 'UPDATE_EXPENSE_ITEM', id, updates })
  }

  const renderQuickAddItem = (recurring: RecurringExpense, withSpacing = true) => {
    const isCopying = copyingIds.has(recurring.id)

    return (
      <CollapseWrapper
        key={recurring.id}
        isCollapsing={isCopying}
        withSpacing={withSpacing}
        className="rounded-xl shadow-card"
      >
        <WizardItemCard
          variant="quick-add"
          name={recurring.name}
          amount={recurring.amount}
          bankAccountName=""
          isDue={recurring.isDue}
          isManual={recurring.isManual}
          amountColorClass="text-expense"
          onQuickAdd={() => handleAddRecurring(recurring)}
          isCopying={isCopying}
        />
      </CollapseWrapper>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Expenses</h2>
          <p className="text-sm text-muted-foreground">
            Add your planned expenses for this month.
          </p>
        </div>
      </div>

      {/* Running balance display */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-xl">
        <div>
          <p className="text-xs text-muted-foreground uppercase">Income</p>
          <p className="text-lg font-semibold text-income">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase">Remaining</p>
          <p
            className={cn(
              'text-lg font-semibold',
              remainingBalance >= 0 ? 'text-income' : 'text-expense'
            )}
          >
            {formatCurrency(remainingBalance)}
          </p>
        </div>
      </div>

      {remainingBalance < 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your planned expenses exceed your income by{' '}
            {formatCurrency(Math.abs(remainingBalance))}. Consider reducing your
            expenses.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick-add from recurring expenses */}
      {availableRecurring.length > 0 && (
        <div
          className={cn(
            'grid overflow-hidden',
            isLastItemsCopying ? 'animate-collapse-row' : 'grid-rows-[1fr]'
          )}
        >
          <div className="overflow-hidden min-h-0 space-y-4 pb-1">
            {dueExpenses.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-expense uppercase tracking-wide">
                    Due this month
                  </h4>
                  {dueExpenses.some((exp) => !copyingIds.has(exp.id)) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAddAllDue}
                      disabled={isAddingAllDue}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add All ({dueExpenses.filter((exp) => !copyingIds.has(exp.id)).length})
                    </Button>
                  )}
                </div>
                <div className="flex flex-col">
                  {dueExpenses.map((item, index) => renderQuickAddItem(item, index > 0))}
                </div>
              </div>
            )}
            {otherExpenses.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  {dueExpenses.length > 0 ? 'Other recurring' : 'Quick add from recurring'}
                </h4>
                <div className="flex flex-col">
                  {otherExpenses.map((item, index) => renderQuickAddItem(item, index > 0))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All recurring expenses added message */}
      {recurringExpenses.length > 0 && availableRecurring.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4 animate-fade-in-subtle">
          All recurring expenses have been added.
        </p>
      )}

      {/* Desktop Expenses table */}
      <div className="hidden md:block bg-popover rounded-2xl shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Name</TableHead>
              <TableHead className="w-[25%]">Account</TableHead>
              <TableHead className="text-right w-[20%]">Amount</TableHead>
              <TableHead className="w-[15%] text-center">Manual</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.expenseItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  No expenses yet. Add expenses manually or use quick-add above.
                </TableCell>
              </TableRow>
            ) : (
              state.expenseItems.map((item) => (
                <TableRow
                  key={item.id}
                  className={cn(
                    newlyAddedIds.has(item.id) && 'animate-fade-in-subtle',
                    item.recurringExpenseId && 'bg-savings-muted/50'
                  )}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        value={item.name}
                        onChange={(e) =>
                          handleUpdateItem(item.id, 'name', e.target.value)
                        }
                        placeholder="e.g., Rent, Groceries"
                        className="border-0 shadow-none focus-visible:ring-0 px-0"
                      />
                      {item.recurringExpenseId && (
                        <Repeat className="w-3 h-3 text-savings flex-shrink-0" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <AccountSelect
                      value={item.bankAccountId}
                      onValueChange={(accountId, accountName) => {
                        dispatch({
                          type: 'UPDATE_EXPENSE_ITEM',
                          id: item.id,
                          updates: {
                            bankAccountId: accountId,
                            bankAccountName: accountName,
                          },
                        })
                      }}
                      placeholder="Select account"
                      triggerClassName="border-0 shadow-none focus:ring-0 px-0"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      value={item.amount || ''}
                      onChange={(e) =>
                        handleUpdateItem(
                          item.id,
                          'amount',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                      className="border-0 shadow-none focus-visible:ring-0 px-0 text-right"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        id={`manual-${item.id}`}
                        checked={item.isManual}
                        onCheckedChange={(checked) =>
                          handleUpdateItem(item.id, 'isManual', checked === true)
                        }
                        aria-label="Manual payment"
                      />
                      <Label
                        htmlFor={`manual-${item.id}`}
                        className="sr-only"
                      >
                        Manual payment
                      </Label>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {state.expenseItems.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="font-medium">
                  Total
                </TableCell>
                <TableCell className="text-right font-semibold text-expense">
                  {formatCurrency(totalExpenses)}
                </TableCell>
                <TableCell colSpan={2}></TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      {/* Mobile Expenses Cards */}
      <div className="md:hidden space-y-3">
        {state.expenseItems.length === 0 ? (
          <div className="bg-popover rounded-2xl shadow-card p-6 text-center text-muted-foreground">
            No expenses yet. Add expenses manually or use quick-add above.
          </div>
        ) : (
          <>
            {state.expenseItems.map((item) => (
              <div
                key={item.id}
                className={cn(newlyAddedIds.has(item.id) && 'animate-fade-in-subtle')}
              >
                <WizardItemCard
                  name={item.name}
                  amount={item.amount}
                  bankAccountName={item.bankAccountName}
                  isRecurring={!!item.recurringExpenseId}
                  isManual={item.isManual}
                  amountColorClass="text-expense"
                  onClick={() => setEditingItem(item)}
                />
              </div>
            ))}

            {/* Total summary */}
            <div className="border-t border-border pt-4 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-semibold text-expense">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
          </>
        )}
      </div>

      <Button variant="outline" onClick={handleAddItem}>
        <Plus className="w-4 h-4 mr-2" />
        Add Expense
      </Button>

      {/* Edit Modal */}
      <WizardItemEditModal
        itemType="expense"
        item={editingItem}
        open={editingItem !== null}
        onOpenChange={(open) => !open && setEditingItem(null)}
        onSave={handleSaveItem}
        onDelete={handleRemoveItem}
      />
    </div>
  )
}
