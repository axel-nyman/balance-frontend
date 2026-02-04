# Consolidate Wizard Edit Modals Implementation Plan

## Overview

Consolidate the three nearly-identical wizard edit modal components (`WizardIncomeEditModal`, `WizardSavingsEditModal`, `WizardExpenseEditModal`) into a single generic `WizardItemEditModal` component. This reduces ~485 lines of duplicated code to ~210 lines while improving maintainability.

## Current State Analysis

Three separate modal components exist with 95-98% identical code:

| Component | Lines | Unique Features |
|-----------|-------|-----------------|
| WizardIncomeEditModal | 153 | Title, placeholder text |
| WizardSavingsEditModal | 153 | Title, placeholder text |
| WizardExpenseEditModal | 179 | +isManual checkbox, +recurring badge |

### Key Discoveries:
- All modals share identical: imports, props interface structure, `useForm` setup, `useEffect` reset logic, submit/delete/close handlers, and JSX structure
- Only WizardExpenseEditModal has: `isManual` checkbox field, recurring expense detection, conditional `SheetDescription`
- Schemas in `schemas.ts` are already type-specific but share 100% identical validation rules for common fields
- The expense modal is 26 lines longer due to the checkbox and recurring indicator

## Desired End State

A single `WizardItemEditModal.tsx` component that:
- Accepts an `itemType` prop to determine behavior
- Handles all three item types with conditional rendering for expense-specific features
- Uses a unified schema with optional `isManual` field
- Reduces total code by ~275 lines (485 → 210)

### Verification:
- All three wizard steps continue to work identically
- Modal opens, edits, saves, and deletes items correctly for each type
- Expense-specific features (isManual checkbox, recurring badge) still appear correctly
- Form validation works for all fields
- `npm run build` and `npm run typecheck` pass

## What We're NOT Doing

- Changing the wizard reducer or action types
- Modifying the item type definitions
- Changing the visual design or UX of the modals
- Consolidating the step components (separate plan)

## Implementation Approach

Create a unified modal component with type-aware configuration, using discriminated union props to maintain type safety while sharing common logic.

---

## Phase 1: Create Unified Schema and Types

### Overview
Add a unified schema that works for all item types, with the `isManual` field being optional.

### Changes Required:

#### 1. Update Schemas
**File**: `src/components/wizard/schemas.ts`

Add a unified schema after the existing schemas:

```typescript
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
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run typecheck`
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [x] N/A - schema only, no UI changes yet

---

## Phase 2: Create Unified Modal Component

### Overview
Create the new `WizardItemEditModal.tsx` component that replaces all three modals.

### Changes Required:

#### 1. Create New Modal Component
**File**: `src/components/wizard/WizardItemEditModal.tsx`

```typescript
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Repeat } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { AccountSelect } from '@/components/accounts/AccountSelect'

import { wizardItemSchema, type WizardItemFormData } from './schemas'
import type { WizardIncomeItem, WizardExpenseItem, WizardSavingsItem } from './types'

type ItemType = 'income' | 'expense' | 'savings'
type WizardItem = WizardIncomeItem | WizardExpenseItem | WizardSavingsItem

interface ItemTypeConfig {
  title: string
  namePlaceholder: string
  nameId: string
  accountId: string
  amountId: string
}

const CONFIG: Record<ItemType, ItemTypeConfig> = {
  income: {
    title: 'Edit Income',
    namePlaceholder: 'e.g., Salary, Freelance',
    nameId: 'income-name',
    accountId: 'income-account',
    amountId: 'income-amount',
  },
  expense: {
    title: 'Edit Expense',
    namePlaceholder: 'e.g., Rent, Groceries',
    nameId: 'expense-name',
    accountId: 'expense-account',
    amountId: 'expense-amount',
  },
  savings: {
    title: 'Edit Savings',
    namePlaceholder: 'e.g., Emergency Fund',
    nameId: 'savings-name',
    accountId: 'savings-account',
    amountId: 'savings-amount',
  },
}

interface WizardItemEditModalProps {
  itemType: ItemType
  item: WizardItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, updates: Partial<WizardItem>) => void
  onDelete: (id: string) => void
}

export function WizardItemEditModal({
  itemType,
  item,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: WizardItemEditModalProps) {
  const config = CONFIG[itemType]
  const accountNameRef = useRef<string>('')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WizardItemFormData>({
    resolver: zodResolver(wizardItemSchema),
    defaultValues: {
      name: '',
      amount: undefined,
      bankAccountId: '',
      isManual: false,
    },
  })

  const selectedAccountId = watch('bankAccountId')
  const isManual = watch('isManual')

  useEffect(() => {
    if (item && open) {
      reset({
        name: item.name,
        amount: item.amount,
        bankAccountId: item.bankAccountId,
        isManual: itemType === 'expense' ? (item as WizardExpenseItem).isManual : undefined,
      })
      accountNameRef.current = item.bankAccountName
    }
  }, [item, open, reset, itemType])

  const isRecurring = itemType === 'expense' && item && (item as WizardExpenseItem).recurringExpenseId != null

  const onSubmit = (data: WizardItemFormData) => {
    if (!item) return

    const updates: Partial<WizardItem> = {
      name: data.name,
      amount: data.amount,
      bankAccountId: data.bankAccountId,
      bankAccountName: data.bankAccountId !== item.bankAccountId ? accountNameRef.current : item.bankAccountName,
    }

    if (itemType === 'expense' && data.isManual !== undefined) {
      ;(updates as Partial<WizardExpenseItem>).isManual = data.isManual
    }

    onSave(item.id, updates)
    handleClose()
  }

  const handleDelete = () => {
    if (!item) return
    onDelete(item.id)
    handleClose()
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2">
              {config.title}
              {isRecurring && <Repeat className="w-4 h-4 text-savings" />}
            </SheetTitle>
            {isRecurring && (
              <SheetDescription>Linked to recurring expense</SheetDescription>
            )}
          </SheetHeader>

          <div className="space-y-4 py-2">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor={config.nameId}>Name</Label>
              <Input
                id={config.nameId}
                placeholder={config.namePlaceholder}
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Account Field */}
            <div className="space-y-2">
              <Label htmlFor={config.accountId}>Account</Label>
              <AccountSelect
                value={selectedAccountId}
                onValueChange={(value, name) => {
                  setValue('bankAccountId', value)
                  accountNameRef.current = name
                }}
              />
              {errors.bankAccountId && (
                <p className="text-sm text-destructive">{errors.bankAccountId.message}</p>
              )}
            </div>

            {/* Amount Field */}
            <div className="space-y-2">
              <Label htmlFor={config.amountId}>Amount</Label>
              <Input
                id={config.amountId}
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('amount', { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>

            {/* Manual Checkbox (Expense Only) */}
            {itemType === 'expense' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="expense-isManual"
                  checked={isManual ?? false}
                  onCheckedChange={(checked) => setValue('isManual', checked === true)}
                />
                <Label htmlFor="expense-isManual" className="font-normal">
                  Manual payment (requires todo reminder)
                </Label>
              </div>
            )}
          </div>

          <SheetFooter className="flex-row gap-2">
            <Button type="submit" className="flex-1">
              Done
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="flex-1"
            >
              Delete
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run typecheck`
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [x] New component file exists at `src/components/wizard/WizardItemEditModal.tsx`

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to the next phase.

---

## Phase 3: Update Step Components to Use Unified Modal

### Overview
Replace imports and usage of the three separate modals with the unified `WizardItemEditModal`.

### Changes Required:

#### 1. Update StepIncome
**File**: `src/components/wizard/steps/StepIncome.tsx`

Replace the import:
```typescript
// Before
import { WizardIncomeEditModal } from '../WizardIncomeEditModal'

// After
import { WizardItemEditModal } from '../WizardItemEditModal'
```

Replace the modal usage (near bottom of file):
```typescript
// Before
<WizardIncomeEditModal
  item={editingItem}
  open={editingItem !== null}
  onOpenChange={(open) => {
    if (!open) setEditingItem(null)
  }}
  onSave={handleSaveItem}
  onDelete={handleRemoveItem}
/>

// After
<WizardItemEditModal
  itemType="income"
  item={editingItem}
  open={editingItem !== null}
  onOpenChange={(open) => {
    if (!open) setEditingItem(null)
  }}
  onSave={handleSaveItem}
  onDelete={handleRemoveItem}
/>
```

#### 2. Update StepSavings
**File**: `src/components/wizard/steps/StepSavings.tsx`

Replace the import:
```typescript
// Before
import { WizardSavingsEditModal } from '../WizardSavingsEditModal'

// After
import { WizardItemEditModal } from '../WizardItemEditModal'
```

Replace the modal usage:
```typescript
// Before
<WizardSavingsEditModal
  item={editingItem}
  open={editingItem !== null}
  onOpenChange={(open) => {
    if (!open) setEditingItem(null)
  }}
  onSave={handleSaveItem}
  onDelete={handleRemoveItem}
/>

// After
<WizardItemEditModal
  itemType="savings"
  item={editingItem}
  open={editingItem !== null}
  onOpenChange={(open) => {
    if (!open) setEditingItem(null)
  }}
  onSave={handleSaveItem}
  onDelete={handleRemoveItem}
/>
```

#### 3. Update StepExpenses
**File**: `src/components/wizard/steps/StepExpenses.tsx`

Replace the import:
```typescript
// Before
import { WizardExpenseEditModal } from '../WizardExpenseEditModal'

// After
import { WizardItemEditModal } from '../WizardItemEditModal'
```

Replace the modal usage:
```typescript
// Before
<WizardExpenseEditModal
  item={editingItem}
  open={editingItem !== null}
  onOpenChange={(open) => {
    if (!open) setEditingItem(null)
  }}
  onSave={handleSaveItem}
  onDelete={handleRemoveItem}
/>

// After
<WizardItemEditModal
  itemType="expense"
  item={editingItem}
  open={editingItem !== null}
  onOpenChange={(open) => {
    if (!open) setEditingItem(null)
  }}
  onSave={handleSaveItem}
  onDelete={handleRemoveItem}
/>
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run typecheck`
- [x] Build succeeds: `npm run build`
- [x] Lint passes: `npm run lint`

#### Manual Verification:
- [x] StepIncome: Click an income item, modal opens with correct title "Edit Income"
- [x] StepIncome: Edit name, account, and amount fields, save works
- [x] StepIncome: Delete button removes the item
- [x] StepSavings: Click a savings item, modal opens with correct title "Edit Savings"
- [x] StepSavings: Edit all fields, save works correctly
- [x] StepExpenses: Click an expense item, modal opens with correct title "Edit Expense"
- [x] StepExpenses: isManual checkbox is visible and functional
- [x] StepExpenses: Recurring expenses show the Repeat icon and description

**Implementation Note**: After completing this phase and all verification passes, pause here for manual testing confirmation before proceeding.

---

## Phase 4: Remove Old Modal Components

### Overview
Delete the three old modal files that are no longer needed.

### Changes Required:

#### 1. Delete Old Files
**Files to delete**:
- `src/components/wizard/WizardIncomeEditModal.tsx`
- `src/components/wizard/WizardSavingsEditModal.tsx`
- `src/components/wizard/WizardExpenseEditModal.tsx`

#### 2. Clean Up Unused Schema Exports (Optional)
**File**: `src/components/wizard/schemas.ts`

The old type-specific schemas (`wizardIncomeItemSchema`, `wizardExpenseItemSchema`, `wizardSavingsItemSchema`) can be removed if no other code uses them. Check for usage first:

```bash
# Check if schemas are used elsewhere
grep -r "wizardIncomeItemSchema\|wizardExpenseItemSchema\|wizardSavingsItemSchema" src/
```

If only the old modal files used them, remove the old schemas and their type exports.

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run typecheck`
- [x] Build succeeds: `npm run build`
- [x] Lint passes: `npm run lint`
- [x] Old files no longer exist: `ls src/components/wizard/Wizard*EditModal.tsx` returns no results

#### Manual Verification:
- [x] Full wizard flow works: create a budget from start to finish
- [x] All three item type modals still function correctly

---

## Testing Strategy

### Unit Tests:
- If existing tests reference the old modal components, update imports to use `WizardItemEditModal`

### Manual Testing Steps:
1. Start the dev server: `npm run dev`
2. Navigate to Budget Wizard
3. Add income items, click to edit, verify modal works
4. Add expense items, verify isManual checkbox and recurring badge
5. Add savings items, verify modal works
6. Complete full wizard flow and verify budget is created correctly

## Performance Considerations

None - this is a pure refactoring with no runtime behavior changes.

## Migration Notes

No data migration needed - this is a UI component refactoring only.

## References

- Original research: `.claude/thoughts/research/2026-02-02-visual-redesign-branch-review.md`
- Current modal components: `src/components/wizard/Wizard*EditModal.tsx`
- Schemas: `src/components/wizard/schemas.ts`
