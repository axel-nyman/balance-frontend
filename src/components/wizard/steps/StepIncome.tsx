import { useState } from 'react'
import { Plus, Trash2, Copy } from 'lucide-react'
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
import { useWizard } from '../WizardContext'
import { useAccounts, useBudgets } from '@/hooks'
import { formatCurrency, generateId } from '@/lib/utils'
import { CopyFromLastBudgetModal } from '../CopyFromLastBudgetModal'
import type { BudgetIncome } from '@/api/types'
import type { WizardIncomeItem } from '../types'

export function StepIncome() {
  const { state, dispatch } = useWizard()
  const { data: accountsData } = useAccounts()
  const { data: budgetsData } = useBudgets()
  const [showCopyModal, setShowCopyModal] = useState(false)

  const accounts = accountsData?.accounts ?? []

  // Find the most recent budget to copy from (sort by year, then month, descending)
  const sortedBudgets = [...(budgetsData?.budgets ?? [])].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })
  const lastBudget = sortedBudgets[0]

  const totalIncome = state.incomeItems.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  )

  const handleAddItem = () => {
    dispatch({
      type: 'ADD_INCOME_ITEM',
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

  const handleCopyFromLast = (items: BudgetIncome[]) => {
    const existingNames = new Set(
      state.incomeItems.map((i) => i.name.toLowerCase())
    )

    const newItems: WizardIncomeItem[] = items
      .filter((item) => !existingNames.has(item.name.toLowerCase()))
      .map((item) => ({
        id: generateId(),
        name: item.name,
        amount: item.amount,
        bankAccountId: item.bankAccount.id,
        bankAccountName: item.bankAccount.name,
      }))

    for (const item of newItems) {
      dispatch({ type: 'ADD_INCOME_ITEM', item })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Income</h2>
          <p className="text-sm text-gray-500">
            Add your expected income sources for this month.
          </p>
        </div>
        {lastBudget && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCopyModal(true)}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy from Last Budget
          </Button>
        )}
      </div>

      <div className="border rounded-lg">
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
            {state.incomeItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-gray-500 py-8"
                >
                  No income items yet. Add your first income source.
                </TableCell>
              </TableRow>
            ) : (
              state.incomeItems.map((item) => (
                <TableRow key={item.id}>
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
              ))
            )}
          </TableBody>
          {state.incomeItems.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="font-medium">
                  Total
                </TableCell>
                <TableCell className="text-right font-semibold text-green-600">
                  {formatCurrency(totalIncome)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
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

      <CopyFromLastBudgetModal
        open={showCopyModal}
        onOpenChange={setShowCopyModal}
        itemType="income"
        onCopy={handleCopyFromLast}
      />
    </div>
  )
}
