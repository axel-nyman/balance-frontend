import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Confirm Action',
    description: 'Are you sure?',
    onConfirm: vi.fn(),
  }

  it('renders title and description when open', () => {
    render(<ConfirmDialog {...defaultProps} />)

    expect(screen.getByText('Confirm Action')).toBeInTheDocument()
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />)

    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument()
  })

  it('renders default button labels', () => {
    render(<ConfirmDialog {...defaultProps} />)

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
  })

  it('renders custom button labels', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Delete"
        cancelLabel="Keep"
      />
    )

    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('calls onConfirm when confirm button clicked', async () => {
    const onConfirm = vi.fn()
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />)

    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onOpenChange when cancel button clicked', async () => {
    const onOpenChange = vi.fn()
    render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />)

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('disables buttons when loading', () => {
    render(<ConfirmDialog {...defaultProps} loading={true} />)

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled()
  })

  it('applies destructive styling when variant is destructive', () => {
    render(<ConfirmDialog {...defaultProps} variant="destructive" />)

    const confirmButton = screen.getByRole('button', { name: 'Confirm' })
    expect(confirmButton).toHaveClass('bg-destructive')
  })
})
