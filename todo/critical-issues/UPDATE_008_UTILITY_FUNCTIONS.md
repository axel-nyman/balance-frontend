# Update #008: Add Utility Functions

**Purpose:** Add commonly needed utility functions  
**Files Affected:** `FRONTEND_STORIES_EPIC1.md` (Story 1.3 or new story)  
**Priority:** Low (convenience, reduces duplication)

---

## Utilities to Add

### 1. Budget Balance Calculation

**Add to `src/lib/utils.ts`:**

```typescript
/**
 * Calculate budget totals and balance
 * 
 * @returns Object with income total, expense total, savings total, and balance
 * Balance = income - expenses - savings
 * Balance of 0 means budget is balanced (ready to lock)
 */
export function calculateBudgetTotals(
  income: Array<{ amount: number }>,
  expenses: Array<{ amount: number }>,
  savings: Array<{ amount: number }>
): {
  incomeTotal: number
  expensesTotal: number
  savingsTotal: number
  balance: number
} {
  const incomeTotal = income.reduce((sum, item) => sum + item.amount, 0)
  const expensesTotal = expenses.reduce((sum, item) => sum + item.amount, 0)
  const savingsTotal = savings.reduce((sum, item) => sum + item.amount, 0)
  const balance = incomeTotal - expensesTotal - savingsTotal

  return {
    incomeTotal,
    expensesTotal,
    savingsTotal,
    balance,
  }
}

/**
 * Check if a budget is balanced (balance equals zero)
 * Uses a small epsilon for floating point comparison
 */
export function isBudgetBalanced(balance: number): boolean {
  return Math.abs(balance) < 0.01 // Within 1 cent / öre
}

/**
 * Format balance with color indicator
 * @returns Object with formatted string and color class
 */
export function formatBalance(balance: number): {
  text: string
  colorClass: string
  isBalanced: boolean
} {
  const isBalanced = isBudgetBalanced(balance)

  if (isBalanced) {
    return {
      text: '0,00 kr',
      colorClass: 'text-green-600',
      isBalanced: true,
    }
  }

  if (balance > 0) {
    // Surplus: income exceeds allocated
    return {
      text: `+${formatCurrency(balance)}`,
      colorClass: 'text-yellow-600',
      isBalanced: false,
    }
  }

  // Deficit: over-allocated
  return {
    text: formatCurrency(balance), // Already negative
    colorClass: 'text-red-600',
    isBalanced: false,
  }
}
```

---

### 2. Month/Year Comparison Helpers

**Add to `src/lib/utils.ts`:**

```typescript
/**
 * Convert month and year to a comparable integer (YYYYMM format)
 * Useful for sorting and comparing months
 */
export function monthYearToNumber(month: number, year: number): number {
  return year * 100 + month
}

/**
 * Compare two month/year pairs
 * @returns negative if a < b, zero if equal, positive if a > b
 */
export function compareMonthYear(
  a: { month: number; year: number },
  b: { month: number; year: number }
): number {
  return monthYearToNumber(a.month, a.year) - monthYearToNumber(b.month, b.year)
}

/**
 * Get the previous month
 */
export function getPreviousMonth(month: number, year: number): { month: number; year: number } {
  if (month === 1) {
    return { month: 12, year: year - 1 }
  }
  return { month: month - 1, year }
}

/**
 * Get the next month
 */
export function getNextMonth(month: number, year: number): { month: number; year: number } {
  if (month === 12) {
    return { month: 1, year: year + 1 }
  }
  return { month: month + 1, year }
}

/**
 * Get current month and year
 */
export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date()
  return {
    month: now.getMonth() + 1, // 1-indexed
    year: now.getFullYear(),
  }
}
```

---

### 3. Recurring Expense Due Calculation

**Add to `src/lib/utils.ts`:**

```typescript
/**
 * Calculate next due date for a recurring expense
 * Based on last used date and recurrence interval
 */
export function calculateNextDueDate(
  lastUsedDate: string | null,
  interval: 'MONTHLY' | 'QUARTERLY' | 'BIANNUALLY' | 'YEARLY'
): Date | null {
  if (!lastUsedDate) return null

  const lastUsed = new Date(lastUsedDate)
  const monthsToAdd = {
    MONTHLY: 1,
    QUARTERLY: 3,
    BIANNUALLY: 6,
    YEARLY: 12,
  }[interval]

  const nextDue = new Date(lastUsed)
  nextDue.setMonth(nextDue.getMonth() + monthsToAdd)

  return nextDue
}

/**
 * Check if a recurring expense is currently due
 * Due = next due date is today or in the past
 */
export function isRecurringExpenseDue(
  lastUsedDate: string | null,
  interval: 'MONTHLY' | 'QUARTERLY' | 'BIANNUALLY' | 'YEARLY'
): boolean {
  // Never used = always due
  if (!lastUsedDate) return true

  const nextDue = calculateNextDueDate(lastUsedDate, interval)
  if (!nextDue) return true

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  nextDue.setHours(0, 0, 0, 0)

  return nextDue <= today
}
```

**Note:** The backend already calculates `isDue` and `nextDueDate` in the API response. These client-side utilities are for edge cases or if you need to recalculate without an API call.

---

### 4. UUID Generation Helper

**Add to `src/lib/utils.ts`:**

```typescript
/**
 * Generate a UUID for client-side item tracking
 * Uses crypto.randomUUID() with fallback
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers (unlikely in 2025)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
```

---

### 5. Form Field Helpers

**Add to `src/lib/utils.ts`:**

```typescript
/**
 * Parse a string to a number, returning 0 for invalid input
 * Useful for form inputs
 */
export function parseAmount(value: string): number {
  // Handle Swedish decimal format (comma as separator)
  const normalized = value.replace(/\s/g, '').replace(',', '.')
  const parsed = parseFloat(normalized)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Format a number for display in an input field
 * Uses Swedish format with comma as decimal separator
 */
export function formatAmountForInput(amount: number): string {
  return amount.toFixed(2).replace('.', ',')
}
```

---

## Tests

**Add `src/lib/utils.test.ts` (extend existing file):**

```typescript
describe('calculateBudgetTotals', () => {
  it('calculates totals correctly', () => {
    const income = [{ amount: 5000 }, { amount: 500 }]
    const expenses = [{ amount: 3000 }, { amount: 200 }]
    const savings = [{ amount: 1000 }, { amount: 800 }]

    const result = calculateBudgetTotals(income, expenses, savings)

    expect(result.incomeTotal).toBe(5500)
    expect(result.expensesTotal).toBe(3200)
    expect(result.savingsTotal).toBe(1800)
    expect(result.balance).toBe(500) // 5500 - 3200 - 1800 = 500
  })

  it('handles empty arrays', () => {
    const result = calculateBudgetTotals([], [], [])
    expect(result.balance).toBe(0)
  })
})

describe('isBudgetBalanced', () => {
  it('returns true for zero', () => {
    expect(isBudgetBalanced(0)).toBe(true)
  })

  it('returns true for near-zero (floating point)', () => {
    expect(isBudgetBalanced(0.001)).toBe(true)
    expect(isBudgetBalanced(-0.005)).toBe(true)
  })

  it('returns false for non-zero', () => {
    expect(isBudgetBalanced(1)).toBe(false)
    expect(isBudgetBalanced(-50)).toBe(false)
  })
})

describe('compareMonthYear', () => {
  it('compares correctly', () => {
    expect(compareMonthYear({ month: 3, year: 2025 }, { month: 1, year: 2025 })).toBeGreaterThan(0)
    expect(compareMonthYear({ month: 1, year: 2025 }, { month: 3, year: 2025 })).toBeLessThan(0)
    expect(compareMonthYear({ month: 3, year: 2025 }, { month: 3, year: 2025 })).toBe(0)
    expect(compareMonthYear({ month: 12, year: 2024 }, { month: 1, year: 2025 })).toBeLessThan(0)
  })
})

describe('getNextMonth', () => {
  it('increments month normally', () => {
    expect(getNextMonth(5, 2025)).toEqual({ month: 6, year: 2025 })
  })

  it('wraps year on December', () => {
    expect(getNextMonth(12, 2025)).toEqual({ month: 1, year: 2026 })
  })
})

describe('parseAmount', () => {
  it('parses Swedish format', () => {
    expect(parseAmount('1 234,56')).toBe(1234.56)
  })

  it('parses standard format', () => {
    expect(parseAmount('1234.56')).toBe(1234.56)
  })

  it('returns 0 for invalid input', () => {
    expect(parseAmount('abc')).toBe(0)
    expect(parseAmount('')).toBe(0)
  })
})
```

---

## Summary of Functions to Add

| Function | Purpose |
|----------|---------|
| `calculateBudgetTotals` | Sum income/expenses/savings and calculate balance |
| `isBudgetBalanced` | Check if balance is effectively zero |
| `formatBalance` | Format balance with color indicator |
| `monthYearToNumber` | Convert month/year to comparable int |
| `compareMonthYear` | Compare two month/year pairs |
| `getPreviousMonth` | Get preceding month |
| `getNextMonth` | Get following month |
| `getCurrentMonthYear` | Get current month/year |
| `calculateNextDueDate` | Calculate recurring expense due date |
| `isRecurringExpenseDue` | Check if recurring expense is due |
| `generateId` | Generate client-side UUID |
| `parseAmount` | Parse user input to number |
| `formatAmountForInput` | Format number for input field |

---

*Created: [Current Date]*
