import { describe, it, expect } from 'vitest'
import { render } from '@/test/test-utils'
import { LoadingState } from './LoadingState'

describe('LoadingState', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<LoadingState />)

    // Should have skeleton elements
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders specified number of rows', () => {
    const { container } = render(<LoadingState rows={5} variant="table" />)

    // Count the row containers
    const rows = container.querySelectorAll('.border-b')
    expect(rows.length).toBeGreaterThanOrEqual(5)
  })

  it('renders card variant', () => {
    const { container } = render(<LoadingState variant="cards" rows={3} />)

    // Should have a grid layout
    const grid = container.querySelector('.grid')
    expect(grid).toBeInTheDocument()
  })
})
