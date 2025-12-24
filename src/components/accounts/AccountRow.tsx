import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { BankAccount } from '@/api/types'

interface AccountRowProps {
  account: BankAccount
  onEdit: (account: BankAccount) => void
  onDelete: (account: BankAccount) => void
  onClick: (account: BankAccount) => void
}

export function AccountRow({ account, onEdit, onDelete, onClick }: AccountRowProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(account)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(account)
  }

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer"
      onClick={() => onClick(account)}
    >
      <td className="px-4 py-3 font-medium text-gray-900">{account.name}</td>
      <td className="px-4 py-3 text-gray-500">{account.description || '—'}</td>
      <td className="px-4 py-3 text-right font-medium text-gray-900">
        {formatCurrency(account.currentBalance)}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-1">
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
      </td>
    </tr>
  )
}
