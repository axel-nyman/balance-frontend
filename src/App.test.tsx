import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import App from './App'

describe('App', () => {
  it('renders the app title', () => {
    render(<App />)
    expect(screen.getByText('Balance')).toBeInTheDocument()
  })

  it('renders the tagline', () => {
    render(<App />)
    expect(screen.getByText('Personal budgeting for couples')).toBeInTheDocument()
  })
})
