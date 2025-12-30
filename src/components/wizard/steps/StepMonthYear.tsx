import { useWizard } from '../WizardContext'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

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

export function StepMonthYear() {
  const { state, dispatch } = useWizard()

  const currentYear = new Date().getFullYear()
  const years = [currentYear, currentYear + 1]

  const handleMonthChange = (value: string) => {
    const month = parseInt(value, 10)
    const year = state.year ?? currentYear
    dispatch({ type: 'SET_MONTH_YEAR', month, year })
  }

  const handleYearChange = (value: string) => {
    const year = parseInt(value, 10)
    const month = state.month ?? new Date().getMonth() + 1
    dispatch({ type: 'SET_MONTH_YEAR', month, year })
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
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
