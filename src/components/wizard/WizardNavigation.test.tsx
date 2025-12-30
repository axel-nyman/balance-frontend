import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { WizardNavigation } from './WizardNavigation'

describe('WizardNavigation', () => {
  const defaultProps = {
    currentStep: 2,
    canProceed: true,
    onBack: vi.fn(),
    onNext: vi.fn(),
  }

  it('shows Back button when not on first step', () => {
    render(<WizardNavigation {...defaultProps} currentStep={2} />)

    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
  })

  it('hides Back button on first step', () => {
    render(<WizardNavigation {...defaultProps} currentStep={1} />)

    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument()
  })

  it('shows Continue button when not on last step', () => {
    render(<WizardNavigation {...defaultProps} currentStep={2} />)

    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
  })

  it('shows Create Budget button on last step', () => {
    render(<WizardNavigation {...defaultProps} currentStep={5} onSave={vi.fn()} />)

    expect(screen.getByRole('button', { name: /create budget/i })).toBeInTheDocument()
  })

  it('disables Continue when canProceed is false', () => {
    render(<WizardNavigation {...defaultProps} canProceed={false} />)

    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
  })

  it('calls onBack when Back clicked', async () => {
    const onBack = vi.fn()
    render(<WizardNavigation {...defaultProps} onBack={onBack} />)

    await userEvent.click(screen.getByRole('button', { name: /back/i }))

    expect(onBack).toHaveBeenCalled()
  })

  it('calls onNext when Continue clicked', async () => {
    const onNext = vi.fn()
    render(<WizardNavigation {...defaultProps} onNext={onNext} />)

    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    expect(onNext).toHaveBeenCalled()
  })

  it('shows loading state when submitting', () => {
    render(
      <WizardNavigation
        {...defaultProps}
        currentStep={5}
        isSubmitting={true}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
  })

  it('disables Back button when submitting', () => {
    render(
      <WizardNavigation
        {...defaultProps}
        currentStep={3}
        isSubmitting={true}
      />
    )

    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled()
  })
})
