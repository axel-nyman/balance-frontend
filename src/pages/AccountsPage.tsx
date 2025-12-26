import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared'
import { AccountsSummary, AccountsList, CreateAccountModal, EditAccountModal, DeleteAccountDialog } from '@/components/accounts'
import { useAccounts } from '@/hooks'
import type { BankAccount } from '@/api/types'

export function AccountsPage() {
  const { data, isLoading, isError, refetch } = useAccounts()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<BankAccount | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAccountClick = (_account: BankAccount) => {
    // TODO: Open balance history drawer (story 2.5)
  }

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account)
  }

  const handleDelete = (account: BankAccount) => {
    setDeletingAccount(account)
  }

  const handleCreateNew = () => {
    setIsCreateModalOpen(true)
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

      <CreateAccountModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />

      <EditAccountModal
        account={editingAccount}
        onClose={() => setEditingAccount(null)}
      />

      <DeleteAccountDialog
        account={deletingAccount}
        onClose={() => setDeletingAccount(null)}
      />
    </div>
  )
}
