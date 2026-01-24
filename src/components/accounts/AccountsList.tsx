import { Wallet } from 'lucide-react'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LoadingState, EmptyState, ErrorState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { AccountRow } from './AccountRow'
import { AccountCard } from './AccountCard'
import type { BankAccount } from '@/api/types'

interface AccountsListProps {
  accounts: BankAccount[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onEdit: (account: BankAccount) => void
  onDelete: (account: BankAccount) => void
  onClick: (account: BankAccount) => void
  onCreateNew: () => void
}

export function AccountsList({
  accounts,
  isLoading,
  isError,
  onRetry,
  onEdit,
  onDelete,
  onClick,
  onCreateNew,
}: AccountsListProps) {
  if (isLoading) {
    return <LoadingState variant="table" rows={3} />
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load accounts"
        message="We couldn't load your accounts. Please try again."
        onRetry={onRetry}
      />
    )
  }

  if (accounts.length === 0) {
    return (
      <EmptyState
        icon={<Wallet className="w-12 h-12" />}
        title="No accounts yet"
        description="Create your first bank account to start tracking your finances."
        action={
          <Button onClick={onCreateNew}>Create Account</Button>
        }
      />
    )
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block bg-card rounded-2xl shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                onEdit={onEdit}
                onDelete={onDelete}
                onClick={onClick}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onEdit={onEdit}
            onDelete={onDelete}
            onClick={onClick}
          />
        ))}
      </div>

      {/* Helper text */}
      <p className="text-sm text-muted-foreground mt-4 text-center">
        Click any account to view balance history
      </p>
    </>
  )
}
