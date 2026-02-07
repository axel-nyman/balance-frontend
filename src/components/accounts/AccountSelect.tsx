import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAccounts } from '@/hooks'
import { CreateAccountModal } from './CreateAccountModal'

const NEW_ACCOUNT_VALUE = '__new_account__'

interface AccountSelectProps {
  value: string
  onValueChange: (accountId: string, accountName: string) => void
  placeholder?: string
  triggerClassName?: string
  label?: string
}

export function AccountSelect({
  value,
  onValueChange,
  placeholder = 'Select account',
  triggerClassName,
  label,
}: AccountSelectProps) {
  const { data: accountsData } = useAccounts()
  const accounts = accountsData?.accounts ?? []

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleValueChange = (newValue: string) => {
    if (newValue === NEW_ACCOUNT_VALUE) {
      setIsCreateModalOpen(true)
      return
    }

    const account = accounts.find((a) => a.id === newValue)
    if (account) {
      onValueChange(account.id, account.name)
    }
  }

  const handleAccountCreated = (account: { id: string; name: string }) => {
    onValueChange(account.id, account.name)
  }

  return (
    <>
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger className={triggerClassName} aria-label={label}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NEW_ACCOUNT_VALUE}>
            <span className="flex items-center gap-2 text-primary">
              <Plus className="w-4 h-4" />
              New Account
            </span>
          </SelectItem>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              {account.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <CreateAccountModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreated={handleAccountCreated}
      />
    </>
  )
}
