import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { Sidebar } from './Sidebar'

describe('Sidebar', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
  }

  it('renders app title', () => {
    render(<Sidebar {...defaultProps} />)

    expect(screen.getByText('Balance')).toBeInTheDocument()
  })

  it('renders all navigation items', () => {
    render(<Sidebar {...defaultProps} />)

    expect(screen.getByRole('link', { name: /budgets/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /accounts/i })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /recurring/i })
    ).toBeInTheDocument()
  })

  it('navigation links have correct hrefs', () => {
    render(<Sidebar {...defaultProps} />)

    expect(screen.getByRole('link', { name: /budgets/i })).toHaveAttribute(
      'href',
      '/budgets'
    )
    expect(screen.getByRole('link', { name: /accounts/i })).toHaveAttribute(
      'href',
      '/accounts'
    )
    expect(screen.getByRole('link', { name: /recurring/i })).toHaveAttribute(
      'href',
      '/recurring-expenses'
    )
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    render(<Sidebar open={true} onClose={onClose} />)

    const closeButton = screen.getByRole('button', { name: /close menu/i })
    await userEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when nav link is clicked', async () => {
    const onClose = vi.fn()
    render(<Sidebar open={true} onClose={onClose} />)

    await userEvent.click(screen.getByRole('link', { name: /accounts/i }))

    expect(onClose).toHaveBeenCalled()
  })

  it('has correct visibility classes when open', () => {
    const { container } = render(<Sidebar open={true} onClose={vi.fn()} />)

    const sidebar = container.querySelector('aside')
    expect(sidebar).toHaveClass('translate-x-0')
  })

  it('has correct visibility classes when closed', () => {
    const { container } = render(<Sidebar open={false} onClose={vi.fn()} />)

    const sidebar = container.querySelector('aside')
    expect(sidebar).toHaveClass('-translate-x-full')
  })
})
