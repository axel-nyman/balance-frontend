import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { AppLayout } from './AppLayout'

describe('AppLayout', () => {
  it('renders sidebar with app title', () => {
    render(<AppLayout />)

    // Balance appears twice (sidebar and header), so we check for multiple
    expect(screen.getAllByText('Balance')).toHaveLength(2)
  })

  it('renders navigation links', () => {
    render(<AppLayout />)

    expect(screen.getByRole('link', { name: /budgets/i })).toBeInTheDocument()
  })

  it('toggles sidebar on mobile menu click', async () => {
    render(<AppLayout />)

    // Find the mobile menu button (in Header)
    const menuButton = screen.getByRole('button', { name: /open menu/i })

    await userEvent.click(menuButton)
    // Sidebar should be visible (has translate-x-0 class)
    const sidebar = document.querySelector('aside')
    expect(sidebar).toHaveClass('translate-x-0')
  })

  it('closes sidebar when close button is clicked', async () => {
    render(<AppLayout />)

    // Open sidebar first
    const menuButton = screen.getByRole('button', { name: /open menu/i })
    await userEvent.click(menuButton)

    // Now close it
    const closeButton = screen.getByRole('button', { name: /close menu/i })
    await userEvent.click(closeButton)

    const sidebar = document.querySelector('aside')
    expect(sidebar).toHaveClass('-translate-x-full')
  })
})
