import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared'
import { AccountsSummary, AccountsList } from '@/components/accounts'
import { useAccounts } from '@/hooks'
import type { BankAccount } from '@/api/types'

export function AccountsPage() {
  const { data, isLoading, isError, refetch } = useAccounts()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAccountClick = (_account: BankAccount) => {
    // TODO: Open balance history drawer (story 2.5)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEdit = (_account: BankAccount) => {
    // TODO: Open edit modal (story 2.4)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDelete = (_account: BankAccount) => {
    // TODO: Open delete confirmation (story 2.4)
  }

  const handleCreateNew = () => {
    // TODO: Open create modal (story 2.3)
  }

  return (
    <div>
      <PageHeader
        title="Accounts"
        description="Manage your bank accounts"
        action={
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            New Account
          </Button>
        }
      />

      <div className="mb-6">
        <AccountsSummary
          totalBalance={data?.totalBalance ?? 0}
          accountCount={data?.accountCount ?? 0}
          isLoading={isLoading}
        />
      </div>

      <AccountsList
        accounts={data?.accounts ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onClick={handleAccountClick}
        onCreateNew={handleCreateNew}
      />
    </div>
  )
}
