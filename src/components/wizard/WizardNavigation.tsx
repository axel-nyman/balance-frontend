import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TOTAL_STEPS } from './types'

interface WizardNavigationProps {
  currentStep: number
  canProceed: boolean
  isSubmitting?: boolean
  onBack: () => void
  onNext: () => void
  onSave?: () => void
}

export function WizardNavigation({
  currentStep,
  canProceed,
  isSubmitting = false,
  onBack,
  onNext,
  onSave,
}: WizardNavigationProps) {
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === TOTAL_STEPS

  return (
    <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100">
      <div>
        {!isFirstStep && (
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            disabled={isSubmitting}
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        )}
      </div>

      <div>
        {isLastStep ? (
          <Button
            type="button"
            onClick={onSave}
            disabled={!canProceed || isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Budget'}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNext}
            disabled={!canProceed}
          >
            Continue
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  )
}
