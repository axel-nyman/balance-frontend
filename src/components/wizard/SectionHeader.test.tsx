import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { SectionHeader } from './SectionHeader'

describe('SectionHeader', () => {
  const defaultProps = {
    title: 'Income',
    description: 'Add income sources',
    status: 'current' as const,
    isExpanded: false,
    onClick: vi.fn(),
  }

  it('displays title and description', () => {
    render(<SectionHeader {...defaultProps} />)

    expect(screen.getByText('Income')).toBeInTheDocument()
    expect(screen.getByText('Add income sources')).toBeInTheDocument()
  })

  it('displays summary when provided and not expanded', () => {
    render(<SectionHeader {...defaultProps} summary="3 income sources" />)

    expect(screen.getByText('3 income sources')).toBeInTheDocument()
    expect(screen.queryByText('Add income sources')).not.toBeInTheDocument()
  })

  it('displays description when expanded even if summary provided', () => {
    render(<SectionHeader {...defaultProps} summary="3 income sources" isExpanded={true} />)

    expect(screen.getByText('Add income sources')).toBeInTheDocument()
    expect(screen.queryByText('3 income sources')).not.toBeInTheDocument()
  })

  it('is clickable when status is current', async () => {
    const onClick = vi.fn()
    render(<SectionHeader {...defaultProps} status="current" onClick={onClick} />)

    await userEvent.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalled()
  })

  it('is clickable when status is complete', async () => {
    const onClick = vi.fn()
    render(<SectionHeader {...defaultProps} status="complete" onClick={onClick} />)

    await userEvent.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalled()
  })

  it('is disabled when status is upcoming', () => {
    render(<SectionHeader {...defaultProps} status="upcoming" />)

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows checkmark for complete status', () => {
    const { container } = render(<SectionHeader {...defaultProps} status="complete" />)

    // Check for green background on status indicator
    const statusIndicator = container.querySelector('.bg-green-100')
    expect(statusIndicator).toBeInTheDocument()
  })

  it('shows blue indicator for current status', () => {
    const { container } = render(<SectionHeader {...defaultProps} status="current" />)

    // Check for blue background on status indicator
    const statusIndicator = container.querySelector('.bg-blue-100')
    expect(statusIndicator).toBeInTheDocument()
  })

  it('shows gray indicator for upcoming status', () => {
    const { container } = render(<SectionHeader {...defaultProps} status="upcoming" />)

    // Check for gray background on status indicator
    const statusIndicator = container.querySelector('.bg-gray-100')
    expect(statusIndicator).toBeInTheDocument()
  })
})
