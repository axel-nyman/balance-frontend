import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as Swedish Kronor (SEK)
 * Examples: 1234.56 -> "1 234,56 kr", -500 -> "-500,00 kr"
 */
export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('sv-SE', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

  return `${formatted} kr`
}

/**
 * Format a date string for display
 * Examples: "2025-03-15" -> "15 mar 2025"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/**
 * Format month and year for budget display
 * Examples: (3, 2025) -> "Mars 2025"
 */
export function formatMonthYear(month: number, year: number): string {
  const date = new Date(year, month - 1) // month is 0-indexed in Date
  return new Intl.DateTimeFormat('sv-SE', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/**
 * Get month name
 * Examples: 3 -> "Mars"
 */
export function getMonthName(month: number): string {
  const date = new Date(2000, month - 1)
  return new Intl.DateTimeFormat('sv-SE', { month: 'long' }).format(date)
}

// =============================================================================
// BUDGET BALANCE UTILITIES
// =============================================================================

/**
 * Calculate budget totals and balance
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

  return { incomeTotal, expensesTotal, savingsTotal, balance }
}

/**
 * Check if a budget is balanced (balance equals zero)
 * Uses a small epsilon for floating point comparison
 */
export function isBudgetBalanced(balance: number): boolean {
  return Math.abs(balance) < 0.01 // Within 1 öre
}

/**
 * Format balance with color indicator
 */
export function formatBalance(balance: number): {
  text: string
  colorClass: string
  isBalanced: boolean
} {
  const isBalanced = isBudgetBalanced(balance)

  if (isBalanced) {
    return { text: '0,00 kr', colorClass: 'text-income', isBalanced: true }
  }

  if (balance > 0) {
    return { text: `+${formatCurrency(balance)}`, colorClass: 'text-income', isBalanced: false }
  }

  return { text: formatCurrency(balance), colorClass: 'text-expense', isBalanced: false }
}

// =============================================================================
// MONTH/YEAR UTILITIES
// =============================================================================

/**
 * Convert month and year to a comparable integer (YYYYMM format)
 */
export function monthYearToNumber(month: number, year: number): number {
  return year * 100 + month
}

/**
 * Compare two month/year pairs
 * Returns negative if a < b, zero if equal, positive if a > b
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
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

// =============================================================================
// UUID GENERATION
// =============================================================================

/**
 * Generate a UUID for client-side item tracking
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// =============================================================================
// FORM HELPERS
// =============================================================================

/**
 * Parse a string to a number, returning 0 for invalid input
 * Handles Swedish decimal format (comma as separator)
 */
export function parseAmount(value: string): number {
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
