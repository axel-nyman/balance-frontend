import { PageHeader } from '@/components/shared'
import { WizardProvider, WizardShell } from '@/components/wizard'

export function BudgetWizardPage() {
  return (
    <div>
      <PageHeader
        title="Create Budget"
        description="Set up your monthly budget step by step"
      />

      <WizardProvider>
        <WizardShell />
      </WizardProvider>
    </div>
  )
}
