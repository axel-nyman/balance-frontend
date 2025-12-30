import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWizard } from '../WizardContext'
import { useBudgets } from '@/hooks'

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear()
  return [currentYear - 1, currentYear, currentYear + 1]
}

function getMonthLabel(month: number): string {
  return MONTHS.find(m => m.value === month)?.label ?? ''
}

function getDefaultMonthYear(existingBudgets: Array<{ month: number; year: number }>) {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Default to next month
  let defaultMonth = currentMonth === 12 ? 1 : currentMonth + 1
  let defaultYear = currentMonth === 12 ? currentYear + 1 : currentYear

  // If next month already has a budget, find the next available month
  const nextMonthExists = existingBudgets.some(
    (b) => b.month === defaultMonth && b.year === defaultYear
  )

  if (nextMonthExists) {
    // Find the next available month
    for (let i = 0; i < 24; i++) {
      defaultMonth++
      if (defaultMonth > 12) {
        defaultMonth = 1
        defaultYear++
      }
      const exists = existingBudgets.some(
        (b) => b.month === defaultMonth && b.year === defaultYear
      )
      if (!exists) break
    }
  }

  return { month: defaultMonth, year: defaultYear }
}

export function StepMonthYear() {
  const { state, dispatch } = useWizard()
  const { data: budgetsData } = useBudgets()
  const [budgetExists, setBudgetExists] = useState(false)

  const existingBudgets = budgetsData?.budgets ?? []
  const yearOptions = getYearOptions()

  // Set defaults on mount
  useEffect(() => {
    if (state.month === null || state.year === null) {
      const defaults = getDefaultMonthYear(existingBudgets)
      dispatch({
        type: 'SET_MONTH_YEAR',
        month: defaults.month,
        year: defaults.year,
      })
    }
  }, [existingBudgets, state.month, state.year, dispatch])

  // Check if budget exists for selected month/year
  useEffect(() => {
    if (state.month && state.year) {
      const exists = existingBudgets.some(
        (b) => b.month === state.month && b.year === state.year
      )
      setBudgetExists(exists)
    }
  }, [state.month, state.year, existingBudgets])

  const handleMonthChange = (value: string) => {
    dispatch({
      type: 'SET_MONTH_YEAR',
      month: parseInt(value, 10),
      year: state.year ?? new Date().getFullYear(),
    })
  }

  const handleYearChange = (value: string) => {
    dispatch({
      type: 'SET_MONTH_YEAR',
      month: state.month ?? new Date().getMonth() + 1,
      year: parseInt(value, 10),
    })
  }

  return (
    <div className="space-y-4 pt-2">
      <p className="text-sm text-gray-500">
        Select the month and year for your new budget.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="month">Month</Label>
          <Select
            value={state.month?.toString() ?? ''}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger id="month">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Select
            value={state.year?.toString() ?? ''}
            onValueChange={handleYearChange}
          >
            <SelectTrigger id="year">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {budgetExists && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            A budget already exists for {state.month && getMonthLabel(state.month)} {state.year}.
            Please select a different month or year.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
