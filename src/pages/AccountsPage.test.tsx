import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { AccountsPage } from './AccountsPage'

describe('AccountsPage', () => {
  it('renders page header with title', () => {
    render(<AccountsPage />)

    expect(screen.getByRole('heading', { name: /accounts/i })).toBeInTheDocument()
  })

  it('renders new account button', () => {
    render(<AccountsPage />)

    expect(screen.getByRole('button', { name: /new account/i })).toBeInTheDocument()
  })
})
