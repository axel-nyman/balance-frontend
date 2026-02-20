import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TodoItemRow } from './TodoItemRow'
import { UpdateBalanceModal } from '@/components/accounts/UpdateBalanceModal'
import type { TodoItem, BankAccount } from '@/api/types'

interface TodoItemListProps {
  budgetId: string
  items: TodoItem[]
}

export function TodoItemList({ budgetId, items }: TodoItemListProps) {
  const [balanceModalItem, setBalanceModalItem] = useState<TodoItem | null>(null)

  // Separate items by type, sorted by createdAt for stable order across refetches
  const sorted = (arr: TodoItem[]) =>
    [...arr].sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  const paymentItems = sorted(items.filter((item) => item.type === 'PAYMENT'))
  const transferItems = sorted(items.filter((item) => item.type === 'TRANSFER'))

  const handleUpdateBalance = (item: TodoItem) => {
    setBalanceModalItem(item)
  }

  // Create a BankAccount-compatible object from TodoItem for the modal
  const modalAccount: BankAccount | null = balanceModalItem?.toAccount
    ? {
        id: balanceModalItem.toAccount.id,
        name: balanceModalItem.toAccount.name,
        description: null,
        currentBalance: balanceModalItem.amount,
        createdAt: '',
      }
    : null

  return (
    <div className="space-y-6">
      {/* Transfer Items */}
      {transferItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Transfers</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="divide-y">
              {transferItems.map((item) => (
                <TodoItemRow
                  key={item.id}
                  budgetId={budgetId}
                  item={item}
                  onUpdateBalance={() => handleUpdateBalance(item)}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Payment Items */}
      {paymentItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Payments</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="divide-y">
              {paymentItems.map((item) => (
                <TodoItemRow
                  key={item.id}
                  budgetId={budgetId}
                  item={item}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Update Balance Modal */}
      {balanceModalItem && modalAccount && (
        <UpdateBalanceModal
          account={modalAccount}
          open={!!balanceModalItem}
          onOpenChange={(open) => !open && setBalanceModalItem(null)}
        />
      )}
    </div>
  )
}
