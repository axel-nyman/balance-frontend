import { z } from 'zod'

// Empty number inputs come through as '' — map those to undefined so optional
// numeric fields validate cleanly (and reject genuine non-numbers as NaN).
export const optionalAmountSetValueAs = (value: unknown): number | undefined => {
  if (value === '' || value === null || value === undefined) return undefined
  return Number(value)
}

const optionalPositiveAmount = z
  .number({ message: 'Must be a number' })
  .refine((v) => Number.isFinite(v), 'Must be a number')
  .refine((v) => v > 0, 'Must be greater than 0')
  .optional()

export const goalFormSchema = z.object({
  name: z.string({ message: 'Name is required' }).min(1, 'Name is required'),
  targetAmount: optionalPositiveAmount,
  endDate: z.string().optional(),
})

export type GoalFormData = z.infer<typeof goalFormSchema>

export const createGoalFormSchema = goalFormSchema.extend({
  seedAccountId: z.string().optional(),
  seedAmount: optionalPositiveAmount,
})

export type CreateGoalFormData = z.infer<typeof createGoalFormSchema>

export const allocateFormSchema = z.object({
  bankAccountId: z.string().min(1, 'Account is required'),
  amount: z
    .number({ message: 'Amount is required' })
    .refine((v) => Number.isFinite(v), 'Amount is required')
    .refine((v) => v >= 0, 'Amount cannot be negative'),
})

export type AllocateFormData = z.infer<typeof allocateFormSchema>
