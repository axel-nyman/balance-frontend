import { z } from 'zod'

// Unified schema for WizardItemEditModal
export const wizardItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z
    .number({ message: 'Must be a number' })
    .positive('Amount must be greater than 0'),
  bankAccountId: z.string().min(1, 'Account is required'),
  isManual: z.boolean().optional(),
})

export type WizardItemFormData = z.infer<typeof wizardItemSchema>
