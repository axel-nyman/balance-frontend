import { z } from 'zod'

export const createRecurringExpenseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z
    .number({ message: 'Must be a number' })
    .positive('Amount must be greater than 0'),
  recurrenceInterval: z.enum(['MONTHLY', 'QUARTERLY', 'BIANNUALLY', 'YEARLY'], {
    message: 'Please select an interval',
  }),
  isManual: z.boolean(),
  bankAccountId: z.string().optional(),
})

export const updateRecurringExpenseSchema = createRecurringExpenseSchema

export type CreateRecurringExpenseFormData = z.infer<typeof createRecurringExpenseSchema>
export type UpdateRecurringExpenseFormData = z.infer<typeof updateRecurringExpenseSchema>
