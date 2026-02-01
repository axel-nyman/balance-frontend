import { z } from 'zod'

export const wizardExpenseItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z
    .number({ message: 'Must be a number' })
    .positive('Amount must be greater than 0'),
  bankAccountId: z.string().min(1, 'Account is required'),
  isManual: z.boolean(),
})

export const wizardIncomeItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z
    .number({ message: 'Must be a number' })
    .positive('Amount must be greater than 0'),
  bankAccountId: z.string().min(1, 'Account is required'),
})

export const wizardSavingsItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z
    .number({ message: 'Must be a number' })
    .positive('Amount must be greater than 0'),
  bankAccountId: z.string().min(1, 'Account is required'),
})

export type WizardExpenseItemFormData = z.infer<typeof wizardExpenseItemSchema>
export type WizardIncomeItemFormData = z.infer<typeof wizardIncomeItemSchema>
export type WizardSavingsItemFormData = z.infer<typeof wizardSavingsItemSchema>
