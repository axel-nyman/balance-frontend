import { useState, useMemo } from 'react'
import { Plus, Trash2, Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWizard } from '../WizardContext'
import { useAccounts } from '@/hooks'
import { useLastBudget } from '@/hooks/use-last-budget'
import { cn, formatCurrency, generateId } from '@/lib/utils'
import type { BudgetSavings } from '@/api/types'
import type { WizardSavingsItem } from '../types'

export function StepSavings() {
  const { state, dispatch } = useWizard()
  const { data: accountsData } = useAccounts()
  const { lastBudget } = useLastBudget()
  const [copyingIds, setCopyingIds] = useState<Set<string>>(new Set())
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set())

  const accounts = accountsData?.accounts ?? []

  // Calculate totals
  const totalIncome = state.incomeItems.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  )
  const totalExpenses = state.expenseItems.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  )
  const totalSavings = state.savingsItems.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  )
  const remainingBalance = totalIncome - totalExpenses - totalSavings

  // Compute items available for copying from last budget
  // Keep items in the list while they're animating (copyingIds) even if already added to state
  const availableItems = useMemo(() => {
    if (!lastBudget) return []
    const existingNames = new Set(
      state.savingsItems.map((i) => i.name.toLowerCase())
    )
    return lastBudget.savings.filter(
      (item) =>
        !existingNames.has(item.name.toLowerCase()) || copyingIds.has(item.id)
    )
  }, [lastBudget, state.savingsItems, copyingIds])

  // Check if all remaining available items are being copied (header should collapse)
  const isLastItemsCopying =
    availableItems.length > 0 &&
    availableItems.every((item) => copyingIds.has(item.id))

  const handleAddItem = () => {
    dispatch({
      type: 'ADD_SAVINGS_ITEM',
      item: {
        id: generateId(),
        name: '',
        amount: 0,
        bankAccountId: '',
        bankAccountName: '',
      },
    })
  }

  const handleUpdateItem = (
    id: string,
    field: keyof WizardSavingsItem,
    value: string | number
  ) => {
    if (field === 'bankAccountId') {
      const account = accounts.find((a) => a.id === value)
      dispatch({
        type: 'UPDATE_SAVINGS_ITEM',
        id,
        updates: {
          bankAccountId: value as string,
          bankAccountName: account?.name ?? '',
        },
      })
    } else {
      dispatch({
        type: 'UPDATE_SAVINGS_ITEM',
        id,
        updates: { [field]: value },
      })
    }
  }

  const handleRemoveItem = (id: string) => {
    dispatch({ type: 'REMOVE_SAVINGS_ITEM', id })
  }

  const handleCopyItem = (item: BudgetSavings) => {
    // Prevent double-clicks
    if (copyingIds.has(item.id)) return

    // Check if account still exists
    const accountExists = accounts.some((a) => a.id === item.bankAccount.id)
    if (!accountExists) return

    // Start animation phase (icon pop + green highlight)
    setCopyingIds((prev) => new Set(prev).add(item.id))

    // Generate new ID for the item
    const newId = generateId()

    // Delay adding the item until collapse starts (250ms)
    setTimeout(() => {
      setNewlyAddedIds((prev) => new Set(prev).add(newId))

      dispatch({
        type: 'ADD_SAVINGS_ITEM',
        item: {
          id: newId,
          name: item.name,
          amount: item.amount,
          bankAccountId: item.bankAccount.id,
          bankAccountName: item.bankAccount.name,
        },
      })

      // Clear newly added state after entrance animation (250ms)
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
        next.delete(item.id)
        return next
      })
    }, 700)
  }

  // Filter out items whose accounts no longer exist
  const validAvailableItems = availableItems.filter((item) => {
    return accounts.some((a) => a.id === item.bankAccount.id)
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Savings</h2>
          <p className="text-sm text-gray-500">
            Allocate money to your savings accounts.
          </p>
        </div>
      </div>

      {/* Running balance display */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs text-gray-500 uppercase">Income</p>
          <p className="text-lg font-semibold text-green-600">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Expenses</p>
          <p className="text-lg font-semibold text-red-600">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Savings</p>
          <p className="text-lg font-semibold text-blue-600">
            {formatCurrency(totalSavings)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Remaining</p>
          <p
            className={cn(
              'text-lg font-semibold',
              remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'
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
            Your planned savings exceed your remaining balance by{' '}
            {formatCurrency(Math.abs(remainingBalance))}. Consider reducing your
            savings or expenses.
          </AlertDescription>
        </Alert>
      )}

      {accounts.length === 0 ? (
        <Alert>
          <AlertDescription>
            No bank accounts found. Create accounts in the Accounts page to add
            savings.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Savings table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[35%]">Name</TableHead>
                  <TableHead className="w-[35%]">Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.savingsItems.length === 0 &&
                validAvailableItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-gray-500 py-8"
                    >
                      No savings planned yet. Savings are optional.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {state.savingsItems.map((item) => (
                      <TableRow
                        key={item.id}
                        className={cn(
                          newlyAddedIds.has(item.id) && 'animate-fade-in-subtle'
                        )}
                      >
                        <TableCell>
                          <Input
                            value={item.name}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'name', e.target.value)
                            }
                            placeholder="e.g., Emergency Fund"
                            className="border-0 shadow-none focus-visible:ring-0 px-0"
                          />
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
                    ))}

                    {/* Separator row - only show if there are available items */}
                    {validAvailableItems.length > 0 && (
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableCell colSpan={4} className="p-0">
                          <div
                            className={cn(
                              'grid overflow-hidden',
                              isLastItemsCopying
                                ? 'animate-collapse-row'
                                : 'grid-rows-[1fr]'
                            )}
                          >
                            <div className="overflow-hidden min-h-0">
                              <div className="py-2 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                From last budget
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Available items from last budget */}
                    {validAvailableItems.map((item) => {
                      const isCopying = copyingIds.has(item.id)
                      return (
                        <TableRow key={`available-${item.id}`}>
                          <td colSpan={4} className="p-0">
                            <div
                              className={cn(
                                'grid overflow-hidden',
                                isCopying
                                  ? 'animate-collapse-row'
                                  : 'grid-rows-[1fr]'
                              )}
                            >
                              <div className="overflow-hidden min-h-0">
                                <div
                                  className={cn(
                                    'flex items-center px-4 py-3 border-b border-gray-100 transition-colors duration-150',
                                    isCopying && 'bg-green-50'
                                  )}
                                >
                                  <div className="flex-1 min-w-0 grid grid-cols-[35%_35%_1fr_50px] items-center gap-0">
                                    <span className="text-gray-400">
                                      {item.name}
                                    </span>
                                    <span className="text-gray-400">
                                      {item.bankAccount.name}
                                    </span>
                                    <span className="text-right text-gray-400">
                                      {formatCurrency(item.amount)}
                                    </span>
                                    <div className="flex justify-center">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCopyItem(item)}
                                        disabled={isCopying}
                                        aria-label="Add item"
                                        className="h-8 w-8 p-0"
                                      >
                                        <div className="relative w-4 h-4">
                                          <Plus
                                            className={cn(
                                              'w-4 h-4 text-gray-400 absolute inset-0 transition-all duration-100',
                                              isCopying &&
                                                'opacity-0 rotate-90 scale-0'
                                            )}
                                          />
                                          <Check
                                            className={cn(
                                              'w-4 h-4 text-green-600 absolute inset-0',
                                              isCopying
                                                ? 'animate-pop-check'
                                                : 'opacity-0 scale-0'
                                            )}
                                          />
                                        </div>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </TableRow>
                      )
                    })}
                  </>
                )}
              </TableBody>
              {state.savingsItems.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="font-medium">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-semibold text-blue-600">
                      {formatCurrency(totalSavings)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>

          <Button variant="outline" onClick={handleAddItem}>
            <Plus className="w-4 h-4 mr-2" />
            Add Savings
          </Button>
        </>
      )}
    </div>
  )
}
