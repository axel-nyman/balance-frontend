import { useState, useMemo } from 'react'
import { Plus, Trash2, Check, Repeat, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AccountSelect } from '@/components/accounts'
import { useWizard } from '../WizardContext'
import { useAccounts, useRecurringExpenses } from '@/hooks'
import { cn, formatCurrency, generateId } from '@/lib/utils'
import type { RecurringExpense } from '@/api/types'
import type { WizardExpenseItem } from '../types'

export function StepExpenses() {
  const { state, dispatch } = useWizard()
  const { data: accountsData } = useAccounts()
  const { data: recurringData } = useRecurringExpenses()
  const [copyingIds, setCopyingIds] = useState<Set<string>>(new Set())
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set())

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
  const isLastItemsCopying =
    availableRecurring.length > 0 &&
    availableRecurring.every((item) => copyingIds.has(item.id))

  const totalExpenses = state.expenseItems.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  )
  const remainingBalance = totalIncome - totalExpenses

  const handleAddItem = () => {
    dispatch({
      type: 'ADD_EXPENSE_ITEM',
      item: {
        id: generateId(),
        name: '',
        amount: 0,
        bankAccountId: '',
        bankAccountName: '',
        isManual: false,
      },
    })
  }

  const handleAddRecurring = (recurring: RecurringExpense) => {
    // Prevent double-clicks
    if (copyingIds.has(recurring.id)) return

    // Start animation phase
    setCopyingIds((prev) => new Set(prev).add(recurring.id))

    const newId = generateId()

    // Delay adding the item until collapse starts
    setTimeout(() => {
      setNewlyAddedIds((prev) => new Set(prev).add(newId))

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

      // Clear newly added state after entrance animation
      setTimeout(() => {
        setNewlyAddedIds((prev) => {
          const next = new Set(prev)
          next.delete(newId)
          return next
        })
      }, 250)
    }, 250)

    // Clean up copying state after collapse animation completes
    setTimeout(() => {
      setCopyingIds((prev) => {
        const next = new Set(prev)
        next.delete(recurring.id)
        return next
      })
    }, 700)
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

  const renderQuickAddItem = (recurring: RecurringExpense) => {
    const isCopying = copyingIds.has(recurring.id)

    return (
      <div
        key={recurring.id}
        className={cn('grid overflow-hidden', isCopying ? 'animate-collapse-row' : 'grid-rows-[1fr]')}
      >
        <div className="overflow-hidden min-h-0">
          <div
            className={cn(
              'flex items-center justify-between p-3 rounded-lg border transition-colors duration-150',
              isCopying ? 'bg-income-muted border-income' : 'border-border hover:border-border'
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{recurring.name}</span>
                {recurring.isDue && (
                  <Badge variant="destructive" className="text-xs py-0">
                    Due
                  </Badge>
                )}
                {recurring.isManual && (
                  <Badge variant="secondary" className="text-xs py-0">
                    Manual
                  </Badge>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(recurring.amount)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAddRecurring(recurring)}
              disabled={isCopying}
              aria-label={`Add ${recurring.name}`}
              className="h-8 w-8 p-0"
            >
              <div className="relative w-4 h-4">
                <Plus
                  className={cn(
                    'w-4 h-4 text-muted-foreground absolute inset-0 transition-all duration-100',
                    isCopying && 'opacity-0 rotate-90 scale-0'
                  )}
                />
                <Check
                  className={cn(
                    'w-4 h-4 text-income absolute inset-0',
                    isCopying ? 'animate-pop-check' : 'opacity-0 scale-0'
                  )}
                />
              </div>
            </Button>
          </div>
        </div>
      </div>
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
          <div className="overflow-hidden min-h-0">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium">
                  Quick Add from Recurring
                </CardTitle>
              </CardHeader>
              <CardContent className="py-3 pt-0 space-y-4">
                {dueExpenses.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-expense uppercase tracking-wide mb-2">
                      Due this month
                    </h4>
                    <div className="space-y-2">
                      {dueExpenses.map(renderQuickAddItem)}
                    </div>
                  </div>
                )}
                {otherExpenses.length > 0 && (
                  <div>
                    {dueExpenses.length > 0 && (
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Other recurring
                      </h4>
                    )}
                    <div className="space-y-2">
                      {otherExpenses.map(renderQuickAddItem)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* All recurring expenses added message */}
      {recurringExpenses.length > 0 && availableRecurring.length === 0 && (
        <Card className="animate-fade-in-subtle">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground text-center">
              All recurring expenses have been added.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Desktop Expenses table */}
      <div className="hidden md:block bg-card rounded-2xl shadow-sm">
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
          <div className="bg-card rounded-2xl shadow-sm p-6 text-center text-muted-foreground">
            No expenses yet. Add expenses manually or use quick-add above.
          </div>
        ) : (
          <>
            {state.expenseItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'bg-card rounded-xl shadow-sm p-4 space-y-3',
                  newlyAddedIds.has(item.id) && 'animate-fade-in-subtle',
                  item.recurringExpenseId && 'bg-savings-muted/50'
                )}
              >
                <div className="flex items-start gap-2">
                  <Input
                    value={item.name}
                    onChange={(e) =>
                      handleUpdateItem(item.id, 'name', e.target.value)
                    }
                    placeholder="e.g., Rent, Groceries"
                    className="flex-1"
                  />
                  {item.recurringExpenseId && (
                    <Repeat className="w-4 h-4 text-savings shrink-0 mt-2.5" />
                  )}
                </div>
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
                />
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`manual-mobile-${item.id}`}
                      checked={item.isManual}
                      onCheckedChange={(checked) =>
                        handleUpdateItem(item.id, 'isManual', checked === true)
                      }
                      aria-label="Manual payment"
                    />
                    <Label
                      htmlFor={`manual-mobile-${item.id}`}
                      className="text-sm text-muted-foreground"
                    >
                      Manual
                    </Label>
                  </div>
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
                    className="flex-1 text-right"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(item.id)}
                    aria-label="Remove item"
                    className="shrink-0"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Total summary */}
            <div className="bg-muted rounded-xl p-4 flex justify-between items-center">
              <span className="font-medium">Total</span>
              <span className="font-semibold text-expense">
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
    </div>
  )
}
