import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { ProgressHeader } from './ProgressHeader'

describe('ProgressHeader', () => {
  it('displays current step title', () => {
    render(<ProgressHeader percentage={40} currentStepTitle="Income" />)

    expect(screen.getByText('Income')).toBeInTheDocument()
  })

  it('displays completion percentage', () => {
    render(<ProgressHeader percentage={40} currentStepTitle="Income" />)

    expect(screen.getByText('40% complete')).toBeInTheDocument()
  })

  it('renders progress bar with correct width', () => {
    const { container } = render(<ProgressHeader percentage={60} currentStepTitle="Expenses" />)

    const progressBar = container.querySelector('[style*="width: 60%"]')
    expect(progressBar).toBeInTheDocument()
  })

  it('handles 0% completion', () => {
    render(<ProgressHeader percentage={0} currentStepTitle="Month" />)

    expect(screen.getByText('0% complete')).toBeInTheDocument()
  })

  it('handles 100% completion', () => {
    render(<ProgressHeader percentage={100} currentStepTitle="Review" />)

    expect(screen.getByText('100% complete')).toBeInTheDocument()
  })
})
