interface ExistingBudget {
  month: number
  year: number
}

/**
 * Check if a budget already exists for the given month/year
 */
export function budgetExistsForMonth(
  month: number,
  year: number,
  existingBudgets: ExistingBudget[]
): boolean {
  return existingBudgets.some(b => b.month === month && b.year === year)
}

/**
 * Check if the selected month/year is older than the most recent budget
 * (but allow gap-filling)
 *
 * Rule: Cannot create Jan 2025 if March 2025 exists
 * Exception: CAN create Feb 2025 if March 2025 exists (fills a gap)
 */
export function isMonthTooOld(
  month: number,
  year: number,
  mostRecent: ExistingBudget | null,
  existingBudgets: ExistingBudget[]
): boolean {
  if (!mostRecent) return false // No budgets exist, any month is valid

  // Convert to comparable number (YYYYMM format)
  const selectedValue = year * 100 + month
  const mostRecentValue = mostRecent.year * 100 + mostRecent.month

  // If selected is after or equal to most recent, it's valid
  if (selectedValue >= mostRecentValue) return false

  // If selected is before most recent, check if it's filling a gap
  const wouldFillGap = !budgetExistsForMonth(month, year, existingBudgets)

  // Allow gap-filling
  return !wouldFillGap
}

/**
 * Get the default month/year to pre-select in the wizard
 * Defaults to next month (not current month)
 */
export function getDefaultMonthYear(
  existingBudgets: ExistingBudget[]
): { month: number; year: number } {
  const now = new Date()
  const currentMonth = now.getMonth() + 1 // 1-indexed
  const currentYear = now.getFullYear()

  // Default to next month
  let defaultMonth = currentMonth === 12 ? 1 : currentMonth + 1
  let defaultYear = currentMonth === 12 ? currentYear + 1 : currentYear

  // If next month already has a budget, find the next available month
  if (budgetExistsForMonth(defaultMonth, defaultYear, existingBudgets)) {
    for (let i = 0; i < 24; i++) { // Look up to 2 years ahead
      defaultMonth++
      if (defaultMonth > 12) {
        defaultMonth = 1
        defaultYear++
      }

      if (!budgetExistsForMonth(defaultMonth, defaultYear, existingBudgets)) {
        return { month: defaultMonth, year: defaultYear }
      }
    }
  }

  return { month: defaultMonth, year: defaultYear }
}

/**
 * Validate a month/year selection
 */
export function validateMonthYear(
  month: number,
  year: number,
  existingBudgets: ExistingBudget[],
  mostRecent: ExistingBudget | null,
  hasUnlockedBudget: boolean
): { valid: boolean; error: string | null } {
  // Check for existing unlocked budget
  if (hasUnlockedBudget) {
    return {
      valid: false,
      error: 'You already have an unlocked budget. Lock or delete it before creating a new one.',
    }
  }

  // Check if budget already exists for this month
  if (budgetExistsForMonth(month, year, existingBudgets)) {
    return {
      valid: false,
      error: 'A budget already exists for this month.',
    }
  }

  // Check if month is too old (not filling a gap)
  if (isMonthTooOld(month, year, mostRecent, existingBudgets)) {
    return {
      valid: false,
      error: 'Cannot create a budget older than the most recent budget.',
    }
  }

  // Valid month range
  if (month < 1 || month > 12) {
    return {
      valid: false,
      error: 'Month must be between 1 and 12.',
    }
  }

  // Valid year range
  if (year < 2020 || year > 2100) {
    return {
      valid: false,
      error: 'Year must be between 2020 and 2100.',
    }
  }

  return { valid: true, error: null }
}
