# Story 2.1: Accounts Page Shell

**As a** user  
**I want to** see a dedicated page for managing accounts  
**So that** I have a clear place to view and manage my bank accounts

### Acceptance Criteria

- [ ] Page renders at `/accounts` route
- [ ] Page header shows "Accounts" title
- [ ] "New Account" button visible in header
- [ ] Summary card placeholder for total balance
- [ ] Main content area ready for account list

### Implementation

**Update `src/pages/AccountsPage.tsx`:**

```typescript
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
```

### Test File: `src/pages/AccountsPage.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { AccountsPage } from './AccountsPage'

describe('AccountsPage', () => {
  it('renders page header with title', () => {
    render(<AccountsPage />)
    
    expect(screen.getByRole('heading', { name: /accounts/i })).toBeInTheDocument()
  })

  it('renders new account button', () => {
    render(<AccountsPage />)
    
    expect(screen.getByRole('button', { name: /new account/i })).toBeInTheDocument()
  })
})
```

### Definition of Done

- [ ] Tests pass
- [ ] Page renders at `/accounts`
- [ ] Header and button visible

---