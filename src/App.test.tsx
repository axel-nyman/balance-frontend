import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route, Navigate } from 'react-router'
import { ROUTES } from './routes'
import { BudgetsPage, NotFoundPage } from './pages'

describe('App routing', () => {
  it('redirects home to budgets', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.BUDGETS} replace />} />
          <Route path={ROUTES.BUDGETS} element={<BudgetsPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Budgets')).toBeInTheDocument()
  })

  it('renders 404 for unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-route']}>
        <Routes>
          <Route path={ROUTES.BUDGETS} element={<BudgetsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Page not found')).toBeInTheDocument()
  })
})
