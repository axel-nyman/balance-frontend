import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { PageHeader } from './PageHeader'

describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader title="Test Title" />)

    expect(screen.getByRole('heading', { name: 'Test Title' })).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<PageHeader title="Title" description="Test description" />)

    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    render(<PageHeader title="Title" />)

    expect(screen.queryByText('description')).not.toBeInTheDocument()
  })

  it('renders action when provided', () => {
    render(<PageHeader title="Title" action={<button>Click me</button>} />)

    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('renders backLink when provided', () => {
    render(<PageHeader title="Title" backLink={<a href="/back">Go back</a>} />)

    expect(screen.getByRole('link', { name: 'Go back' })).toBeInTheDocument()
  })
})
