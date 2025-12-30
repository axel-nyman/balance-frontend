import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { WizardProvider } from '../WizardContext'
import { StepMonthYear } from './StepMonthYear'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

function renderWithWizard() {
  return render(
    <WizardProvider>
      <StepMonthYear />
    </WizardProvider>
  )
}

describe('StepMonthYear', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({ budgets: [] })
      })
    )
  })

  it('renders month and year dropdowns', () => {
    renderWithWizard()

    expect(screen.getByLabelText(/month/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/year/i)).toBeInTheDocument()
  })

  it('shows all 12 months', async () => {
    renderWithWizard()

    await userEvent.click(screen.getByLabelText(/month/i))

    // Use getAllByText since selected value and dropdown option may both be visible
    expect(screen.getAllByText('January').length).toBeGreaterThan(0)
    expect(screen.getAllByText('December').length).toBeGreaterThan(0)
  })

  it('defaults to next month when no budgets exist', async () => {
    renderWithWizard()

    const currentMonth = new Date().getMonth() + 1
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December']
    const nextMonthName = monthNames[nextMonth - 1]

    await waitFor(() => {
      expect(screen.getByText(nextMonthName)).toBeInTheDocument()
    })
  })

  it('shows warning when budget exists for selected month', async () => {
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear

    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({
          budgets: [
            { id: '1', month: nextMonth, year: nextYear, status: 'DRAFT' }
          ]
        })
      })
    )

    renderWithWizard()

    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument()
    })
  })

  it('skips to month after next when next month has budget', async () => {
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear

    server.use(
      http.get('/api/budgets', () => {
        return HttpResponse.json({
          budgets: [
            { id: '1', month: nextMonth, year: nextYear, status: 'DRAFT' }
          ]
        })
      })
    )

    renderWithWizard()

    // Should not show warning for the default (month after next)
    await waitFor(() => {
      // Give it time to load and set defaults
      expect(screen.queryByText(/already exists/i)).not.toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('allows changing month', async () => {
    renderWithWizard()

    await userEvent.click(screen.getByLabelText(/month/i))
    await userEvent.click(screen.getByText('June'))

    expect(screen.getByText('June')).toBeInTheDocument()
  })

  it('allows changing year', async () => {
    renderWithWizard()

    const currentYear = new Date().getFullYear()

    await userEvent.click(screen.getByLabelText(/year/i))
    // Click on current year (which is not the default next year)
    await userEvent.click(screen.getByRole('option', { name: currentYear.toString() }))

    // Use getAllByText since it may appear in multiple places
    expect(screen.getAllByText(currentYear.toString()).length).toBeGreaterThan(0)
  })

  it('shows previous year option', async () => {
    renderWithWizard()

    const prevYear = new Date().getFullYear() - 1

    await userEvent.click(screen.getByLabelText(/year/i))

    expect(screen.getByText(prevYear.toString())).toBeInTheDocument()
  })
})
