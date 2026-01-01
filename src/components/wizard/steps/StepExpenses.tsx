import { useState, useMemo } from 'react'
import { Plus, Trash2, Check, Repeat } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
              isCopying ? 'bg-green-50 border-green-200' : 'border-gray-200 hover:border-gray-300'
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
              <span className="text-sm text-gray-500">
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
                    'w-4 h-4 text-gray-400 absolute inset-0 transition-all duration-100',
                    isCopying && 'opacity-0 rotate-90 scale-0'
                  )}
                />
                <Check
                  className={cn(
                    'w-4 h-4 text-green-600 absolute inset-0',
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
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Expenses</h2>
          <p className="text-sm text-gray-500">
            Add your planned expenses for this month.
          </p>
        </div>
      </div>

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
                    <h4 className="text-xs font-medium text-red-600 uppercase tracking-wide mb-2">
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
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
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
            <p className="text-sm text-gray-500 text-center">
              All recurring expenses have been added.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Expenses table */}
      <div className="border rounded-lg">
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
                  className="text-center text-gray-500 py-8"
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
                    item.recurringExpenseId && 'bg-blue-50/50'
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
                        <Repeat className="w-3 h-3 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.bankAccountId}
                      onValueChange={(value) =>
                        handleUpdateItem(item.id, 'bankAccountId', value)
                      }
                    >
                      <SelectTrigger className="border-0 shadow-none focus:ring-0 px-0">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
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
                <TableCell className="text-right font-semibold text-red-600">
                  {formatCurrency(totalExpenses)}
                </TableCell>
                <TableCell colSpan={2}></TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      <Button variant="outline" onClick={handleAddItem}>
        <Plus className="w-4 h-4 mr-2" />
        Add Expense
      </Button>
    </div>
  )
}
