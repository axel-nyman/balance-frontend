import { describe, it, expect } from 'vitest'
import { toSavingsRequest } from './types'
import type { WizardSavingsItem } from './types'

describe('toSavingsRequest', () => {
  const base: WizardSavingsItem = {
    id: 'tmp-1',
    name: 'Emergency Fund',
    amount: 2000,
    bankAccountId: 'acc-1',
    bankAccountName: 'Savings',
  }

  it('includes savingsGoalId when the item is linked to a goal', () => {
    expect(toSavingsRequest({ ...base, savingsGoalId: 'goal-1' })).toEqual({
      name: 'Emergency Fund',
      amount: 2000,
      bankAccountId: 'acc-1',
      savingsGoalId: 'goal-1',
    })
  })

  it('leaves savingsGoalId undefined when the item has no goal', () => {
    expect(toSavingsRequest(base).savingsGoalId).toBeUndefined()
  })
})
