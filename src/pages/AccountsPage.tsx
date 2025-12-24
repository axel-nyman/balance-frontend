import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared'

export function AccountsPage() {
  return (
    <div>
      <PageHeader
        title="Accounts"
        description="Manage your bank accounts"
        action={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Account
          </Button>
        }
      />

      {/* Summary Card - to be implemented in 2.2 */}
      <div className="mb-6">
        {/* AccountsSummary component will go here */}
      </div>

      {/* Accounts List - to be implemented in 2.2 */}
      <div>
        {/* AccountsList component will go here */}
      </div>
    </div>
  )
}
