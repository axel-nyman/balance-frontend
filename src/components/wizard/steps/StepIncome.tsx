import { useState, useMemo } from 'react'
import { Plus, Trash2, Check } from 'lucide-react'
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
import { AccountSelect } from '@/components/accounts'
import { useWizard } from '../WizardContext'
import { useAccounts, useIsMobile } from '@/hooks'
import { useLastBudget } from '@/hooks/use-last-budget'
import { cn, formatCurrency, generateId } from '@/lib/utils'
import { WizardItemCard } from '../WizardItemCard'
import { WizardItemEditModal } from '../WizardItemEditModal'
import type { BudgetIncome } from '@/api/types'
import type { WizardIncomeItem } from '../types'

export function StepIncome() {
  const { state, dispatch } = useWizard()
  const { data: accountsData } = useAccounts()
  const { lastBudget } = useLastBudget()
  const isMobile = useIsMobile()
  const [copyingIds, setCopyingIds] = useState<Set<string>>(new Set())
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set())
  const [editingItem, setEditingItem] = useState<WizardIncomeItem | null>(null)

  const accounts = accountsData?.accounts ?? []

  // Compute items available for copying from last budget
  // Keep items in the list while they're animating (copyingIds) even if already added to state
  const availableItems = useMemo(() => {
    if (!lastBudget) return []
    const existingNames = new Set(
      state.incomeItems.map((i) => i.name.toLowerCase())
    )
    return lastBudget.income.filter(
      (item) =>
        !existingNames.has(item.name.toLowerCase()) || copyingIds.has(item.id)
    )
  }, [lastBudget, state.incomeItems, copyingIds])

  const totalIncome = state.incomeItems.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  )

  // Check if all remaining available items are being copied (header should collapse)
  const isLastItemsCopying =
    availableItems.length > 0 &&
    availableItems.every((item) => copyingIds.has(item.id))

  const handleAddItem = () => {
    const newItem = {
      id: generateId(),
      name: '',
      amount: 0,
      bankAccountId: '',
      bankAccountName: '',
    }

    dispatch({ type: 'ADD_INCOME_ITEM', item: newItem })

    // Auto-open modal on mobile
    if (isMobile) {
      setEditingItem(newItem)
    }
  }

  const handleUpdateItem = (
    id: string,
    field: keyof WizardIncomeItem,
    value: string | number
  ) => {
    if (field === 'bankAccountId') {
      const account = accounts.find((a) => a.id === value)
      dispatch({
        type: 'UPDATE_INCOME_ITEM',
        id,
        updates: {
          bankAccountId: value as string,
          bankAccountName: account?.name ?? '',
        },
      })
    } else {
      dispatch({
        type: 'UPDATE_INCOME_ITEM',
        id,
        updates: { [field]: value },
      })
    }
  }

  const handleRemoveItem = (id: string) => {
    dispatch({ type: 'REMOVE_INCOME_ITEM', id })
  }

  const handleSaveItem = (id: string, updates: Partial<WizardIncomeItem>) => {
    dispatch({ type: 'UPDATE_INCOME_ITEM', id, updates })
  }

  const handleCopyItem = (item: BudgetIncome) => {
    // Prevent double-clicks
    if (copyingIds.has(item.id)) return

    // Start animation phase (icon pop + green highlight)
    setCopyingIds((prev) => new Set(prev).add(item.id))

    // Generate new ID for the item
    const newId = generateId()

    // Delay adding the item until collapse starts (250ms)
    // This syncs the new item appearance with the source row disappearing
    setTimeout(() => {
      setNewlyAddedIds((prev) => new Set(prev).add(newId))

      dispatch({
        type: 'ADD_INCOME_ITEM',
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
    // Icon pop: 200ms + pause: 250ms + collapse: 250ms = 700ms total
    setTimeout(() => {
      setCopyingIds((prev) => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
    }, 700)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Income</h2>
          <p className="text-sm text-muted-foreground">
            Add your expected income sources for this month.
          </p>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-popover rounded-2xl shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[35%]">Name</TableHead>
              <TableHead className="w-[30%]">Account</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.incomeItems.length === 0 && availableItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8"
                >
                  No income items yet. Add your first income source.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {state.incomeItems.map((item) => (
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
                        placeholder="e.g., Salary, Freelance"
                        className="border-0 shadow-none focus-visible:ring-0 px-0"
                      />
                    </TableCell>
                    <TableCell>
                      <AccountSelect
                        value={item.bankAccountId}
                        onValueChange={(accountId, accountName) => {
                          dispatch({
                            type: 'UPDATE_INCOME_ITEM',
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
                {availableItems.length > 0 && (
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
                {availableItems.map((item) => {
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
                              <div className="flex-1 min-w-0 grid grid-cols-[35%_30%_1fr_50px] items-center gap-0">
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
                                          isCopying && 'opacity-0 rotate-90 scale-0'
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
          {state.incomeItems.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="font-medium">
                  Total
                </TableCell>
                <TableCell className="text-right font-semibold text-income">
                  {formatCurrency(totalIncome)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {state.incomeItems.length === 0 && availableItems.length === 0 ? (
          <div className="bg-popover rounded-2xl shadow-card p-6 text-center text-muted-foreground">
            No income items yet. Add your first income source.
          </div>
        ) : (
          <>
            {/* Editable income items */}
            {state.incomeItems.map((item) => (
              <div
                key={item.id}
                className={cn(newlyAddedIds.has(item.id) && 'animate-fade-in-subtle')}
              >
                <WizardItemCard
                  name={item.name}
                  amount={item.amount}
                  bankAccountName={item.bankAccountName}
                  amountColorClass="text-income"
                  onClick={() => setEditingItem(item)}
                />
              </div>
            ))}

            {/* From last budget section */}
            {availableItems.length > 0 && (
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
                  {availableItems.map((item) => {
                    const isCopying = copyingIds.has(item.id)
                    return (
                      <div
                        key={`available-mobile-${item.id}`}
                        className={cn(
                          'grid overflow-hidden rounded-xl shadow-card',
                          isCopying
                            ? 'animate-collapse-row'
                            : 'grid-rows-[1fr]'
                        )}
                      >
                        <div className="overflow-hidden min-h-0">
                          <WizardItemCard
                            variant="quick-add"
                            name={item.name}
                            amount={item.amount}
                            bankAccountName={item.bankAccount.name}
                            amountColorClass="text-income"
                            onQuickAdd={() => handleCopyItem(item)}
                            isCopying={isCopying}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Total summary */}
            {state.incomeItems.length > 0 && (
              <div className="border-t border-border pt-4 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-semibold text-income">
                  {formatCurrency(totalIncome)}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <Button variant="outline" onClick={handleAddItem}>
        <Plus className="w-4 h-4 mr-2" />
        Add Income
      </Button>

      {state.incomeItems.length === 0 && (
        <p className="text-sm text-amber-600">
          Add at least one income source to continue.
        </p>
      )}

      {/* Edit Modal */}
      <WizardItemEditModal
        itemType="income"
        item={editingItem}
        open={editingItem !== null}
        onOpenChange={(open) => !open && setEditingItem(null)}
        onSave={handleSaveItem}
        onDelete={handleRemoveItem}
      />
    </div>
  )
}
