import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGoals } from '@/hooks'

// Radix Select disallows an empty-string item value, so use a sentinel for
// "no goal" and translate it to undefined for callers.
const NO_GOAL_VALUE = '__no_goal__'

interface GoalSelectProps {
  value: string | undefined
  onValueChange: (goalId: string | undefined, goalName: string | undefined) => void
  placeholder?: string
  triggerClassName?: string
  label?: string
}

/**
 * Active-goal picker with a "No goal" option. Used wherever a budget savings
 * line can be earmarked toward a goal (budget-detail modal and the budget
 * wizard). Reads the active goals via `useGoals()`.
 */
export function GoalSelect({
  value,
  onValueChange,
  placeholder = 'No goal',
  triggerClassName,
  label = 'Goal',
}: GoalSelectProps) {
  const { data: goalsData } = useGoals()
  const goals = goalsData?.goals ?? []

  return (
    <Select
      value={value ?? NO_GOAL_VALUE}
      onValueChange={(newValue) => {
        if (newValue === NO_GOAL_VALUE) {
          onValueChange(undefined, undefined)
          return
        }
        onValueChange(newValue, goals.find((g) => g.id === newValue)?.name)
      }}
    >
      <SelectTrigger className={triggerClassName} aria-label={label}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_GOAL_VALUE}>No goal</SelectItem>
        {goals.map((goal) => (
          <SelectItem key={goal.id} value={goal.id}>
            {goal.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
