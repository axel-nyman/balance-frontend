import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { BankAccount } from '@/api/types'

interface AccountCardProps {
  account: BankAccount
  onEdit: (account: BankAccount) => void
  onDelete: (account: BankAccount) => void
  onClick: (account: BankAccount) => void
}

export function AccountCard({ account, onEdit, onDelete, onClick }: AccountCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(account)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(account)
  }

  return (
    <Card
      className="cursor-pointer hover:border-gray-300 transition-colors"
      onClick={() => onClick(account)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{account.name}</h3>
            <p className="text-sm text-gray-500 truncate">
              {account.description || 'No description'}
            </p>
            <p className="text-lg font-semibold text-gray-900 mt-2">
              {formatCurrency(account.currentBalance)}
            </p>
          </div>
          <div className="flex gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              aria-label={`Edit ${account.name}`}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              aria-label={`Delete ${account.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
