import { z } from 'zod'

export const incomeItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z
    .number({ message: 'Must be a number' })
    .positive('Amount must be greater than 0'),
  bankAccountId: z.string().min(1, 'Account is required'),
})

export const expenseItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z
    .number({ message: 'Must be a number' })
    .positive('Amount must be greater than 0'),
  bankAccountId: z.string().min(1, 'Account is required'),
  isManual: z.boolean(),
})

export const savingsItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z
    .number({ message: 'Must be a number' })
    .positive('Amount must be greater than 0'),
  bankAccountId: z.string().min(1, 'Account is required'),
})

export type IncomeItemFormData = z.infer<typeof incomeItemSchema>
export type ExpenseItemFormData = z.infer<typeof expenseItemSchema>
export type SavingsItemFormData = z.infer<typeof savingsItemSchema>
