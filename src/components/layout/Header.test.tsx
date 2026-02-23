import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { Header } from './Header'

describe('Header', () => {
  it('renders menu button', () => {
    render(<Header onMenuClick={vi.fn()} />)

    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
  })

  it('calls onMenuClick when menu button is clicked', async () => {
    const onMenuClick = vi.fn()
    render(<Header onMenuClick={onMenuClick} />)

    await userEvent.click(screen.getByRole('button', { name: /open menu/i }))

    expect(onMenuClick).toHaveBeenCalledTimes(1)
  })
})
