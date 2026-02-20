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
      className="hover:bg-accent cursor-pointer"
      onClick={() => onClick(account)}
    >
      <td className="pl-6 pr-4 py-3 font-medium text-foreground">{account.name}</td>
      <td className="px-4 py-3 text-muted-foreground">{account.description || '—'}</td>
      <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground">
        {formatCurrency(account.currentBalance)}
      </td>
      <td className="pl-4 pr-6 py-3 text-right">
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
