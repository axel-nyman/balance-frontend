import { z } from 'zod'

export const createAccountSchema = z.object({
  name: z
    .string({ message: 'Name is required' })
    .min(1, 'Name is required'),
  description: z.string().optional(),
  initialBalance: z
    .number({ message: 'Must be a number' })
    .min(0, 'Initial balance cannot be negative'),
})

export const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
})

export const updateBalanceSchema = z.object({
  newBalance: z.number({ error: 'Must be a number' }),
  date: z.string().min(1, 'Date is required'),
  comment: z.string().optional(),
})

export type CreateAccountFormData = z.infer<typeof createAccountSchema>
export type UpdateAccountFormData = z.infer<typeof updateAccountSchema>
export type UpdateBalanceFormData = z.infer<typeof updateBalanceSchema>
