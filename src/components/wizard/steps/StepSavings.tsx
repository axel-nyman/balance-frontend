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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AccountSelect } from '@/components/accounts'
import { useWizard } from '../WizardContext'
import { useAccounts, useIsMobile } from '@/hooks'
import { useLastBudget } from '@/hooks/use-last-budget'
import { cn, formatCurrency, generateId } from '@/lib/utils'
import { WizardItemCard } from '../WizardItemCard'
import { WizardItemEditModal } from '../WizardItemEditModal'
import { useCopyAnimation } from '../hooks'
import { CollapseWrapper } from '../CollapseWrapper'
import type { BudgetSavings } from '@/api/types'
import type { WizardSavingsItem } from '../types'

export function StepSavings() {
  const { state, dispatch } = useWizard()
  const { data: accountsData } = useAccounts()
  const { lastBudget } = useLastBudget()
  const isMobile = useIsMobile()
  const {
    copyingIds,
    newlyAddedIds,
    startCopyAnimation,
    isLastItemsCopying: checkLastItemsCopying,
  } = useCopyAnimation()
  const [editingItem, setEditingItem] = useState<WizardSavingsItem | null>(null)

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

  const handleAddItem = () => {
    const newItem = {
      id: generateId(),
      name: '',
      amount: 0,
      bankAccountId: '',
      bankAccountName: '',
    }

    dispatch({ type: 'ADD_SAVINGS_ITEM', item: newItem })

    // Auto-open modal on mobile
    if (isMobile) {
      setEditingItem(newItem)
    }
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

  const handleSaveItem = (id: string, updates: Partial<WizardSavingsItem>) => {
    dispatch({ type: 'UPDATE_SAVINGS_ITEM', id, updates })
  }

  const handleCopyItem = (item: BudgetSavings) => {
    // Check if account still exists
    const accountExists = accounts.some((a) => a.id === item.bankAccount.id)
    if (!accountExists) return

    startCopyAnimation(item.id, (newId) => {
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
    })
  }

  // Filter out items whose accounts no longer exist
  const validAvailableItems = availableItems.filter((item) => {
    return accounts.some((a) => a.id === item.bankAccount.id)
  })

  // Check if all remaining available items are being copied (header should collapse)
  const isLastItemsCopying = checkLastItemsCopying(validAvailableItems)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Savings</h2>
          <p className="text-sm text-muted-foreground">
            Allocate money to your savings accounts.
          </p>
        </div>
      </div>

      {/* Running balance display */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-xl">
        <div>
          <p className="text-xs text-muted-foreground uppercase">Income</p>
          <p className="text-lg font-semibold text-income">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase">Expenses</p>
          <p className="text-lg font-semibold text-expense">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase">Savings</p>
          <p className="text-lg font-semibold text-savings">
            {formatCurrency(totalSavings)}
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
          {/* Desktop Savings table */}
          <div className="hidden md:block bg-popover rounded-2xl shadow-card">
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
                      className="text-center text-muted-foreground py-8"
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
                          <AccountSelect
                            value={item.bankAccountId}
                            onValueChange={(accountId, accountName) => {
                              dispatch({
                                type: 'UPDATE_SAVINGS_ITEM',
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
                    ))}

                    {/* Separator row - only show if there are available items */}
                    {validAvailableItems.length > 0 && (
                      <TableRow className="bg-muted hover:bg-muted">
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
                              <div className="py-2 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
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
                                    'flex items-center px-4 py-3 border-b border-border transition-colors duration-150',
                                    isCopying && 'bg-income-muted'
                                  )}
                                >
                                  <div className="flex-1 min-w-0 grid grid-cols-[35%_35%_1fr_50px] items-center gap-0">
                                    <span className="text-muted-foreground/70">
                                      {item.name}
                                    </span>
                                    <span className="text-muted-foreground/70">
                                      {item.bankAccount.name}
                                    </span>
                                    <span className="text-right text-muted-foreground/70">
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
                                              'w-4 h-4 text-muted-foreground absolute inset-0 transition-all duration-100',
                                              isCopying &&
                                                'opacity-0 rotate-90 scale-0'
                                            )}
                                          />
                                          <Check
                                            className={cn(
                                              'w-4 h-4 text-income absolute inset-0',
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
                    <TableCell className="text-right font-semibold text-savings">
                      {formatCurrency(totalSavings)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>

          {/* Mobile Savings Cards */}
          <div className="md:hidden space-y-3">
            {state.savingsItems.length === 0 &&
            validAvailableItems.length === 0 ? (
              <div className="bg-popover rounded-2xl shadow-card p-6 text-center text-muted-foreground">
                No savings planned yet. Savings are optional.
              </div>
            ) : (
              <>
                {/* Editable savings items */}
                {state.savingsItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(newlyAddedIds.has(item.id) && 'animate-fade-in-subtle')}
                  >
                    <WizardItemCard
                      name={item.name}
                      amount={item.amount}
                      bankAccountName={item.bankAccountName}
                      amountColorClass="text-savings"
                      onClick={() => setEditingItem(item)}
                    />
                  </div>
                ))}

                {/* From last budget section */}
                {validAvailableItems.length > 0 && (
                  <div
                    className={cn(
                      'grid overflow-hidden',
                      isLastItemsCopying
                        ? 'animate-collapse-row'
                        : 'grid-rows-[1fr]'
                    )}
                  >
                    <div className="overflow-hidden min-h-0 space-y-3 pb-1">
                      <div className="py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        From last budget
                      </div>
                      {validAvailableItems.map((item) => {
                        const isCopying = copyingIds.has(item.id)
                        return (
                          <CollapseWrapper
                            key={`available-mobile-${item.id}`}
                            isCollapsing={isCopying}
                            className="rounded-xl shadow-card"
                          >
                            <WizardItemCard
                              variant="quick-add"
                              name={item.name}
                              amount={item.amount}
                              bankAccountName={item.bankAccount.name}
                              amountColorClass="text-savings"
                              onQuickAdd={() => handleCopyItem(item)}
                              isCopying={isCopying}
                            />
                          </CollapseWrapper>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Total summary */}
                {state.savingsItems.length > 0 && (
                  <div className="border-t border-border pt-4 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="text-lg font-semibold text-savings">
                      {formatCurrency(totalSavings)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          <Button variant="outline" onClick={handleAddItem}>
            <Plus className="w-4 h-4 mr-2" />
            Add Savings
          </Button>

          {/* Edit Modal */}
          <WizardItemEditModal
            itemType="savings"
            item={editingItem}
            open={editingItem !== null}
            onOpenChange={(open) => !open && setEditingItem(null)}
            onSave={handleSaveItem}
            onDelete={handleRemoveItem}
          />
        </>
      )}
    </div>
  )
}
