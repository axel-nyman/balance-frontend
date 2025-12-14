# Balance — Frontend Stories: Epic 1 Testing Addendum

This document adds TDD guidance to Epic 1. Tests should be written **before** implementation code.

---

## Story 1.1 Addition: Test Setup

Add the following to Story 1.1 after the initial project setup.

### Additional Dependencies

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D jsdom
npm install -D msw --save-dev
```

### Configure Vitest

**Update `vite.config.ts`:**
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },
})
```

**Create `src/test/setup.ts`:**
```typescript
import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})
```

**Create `src/test/test-utils.tsx`:**
```typescript
import { ReactElement, ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

interface WrapperProps {
  children: ReactNode
}

function AllProviders({ children }: WrapperProps) {
  const queryClient = createTestQueryClient()
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
export { createTestQueryClient }
```

**Update `package.json` scripts:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

**Update `tsconfig.json` compilerOptions:**
```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

### MSW Setup for API Mocking

**Create `src/test/mocks/handlers.ts`:**
```typescript
import { http, HttpResponse } from 'msw'

// Base handlers - extend as needed
export const handlers = [
  // Accounts
  http.get('/api/bank-accounts', () => {
    return HttpResponse.json({
      totalBalance: 10000,
      accountCount: 2,
      accounts: [
        { id: '1', name: 'Checking', description: 'Main account', currentBalance: 5000, createdAt: '2025-01-01T00:00:00Z' },
        { id: '2', name: 'Savings', description: 'Emergency fund', currentBalance: 5000, createdAt: '2025-01-01T00:00:00Z' },
      ],
    })
  }),

  // Recurring expenses
  http.get('/api/recurring-expenses', () => {
    return HttpResponse.json({
      expenses: [
        { id: '1', name: 'Rent', amount: 8000, recurrenceInterval: 'MONTHLY', isManual: true, lastUsedDate: null, nextDueDate: '2025-02-01', isDue: true, createdAt: '2025-01-01T00:00:00Z' },
      ],
    })
  }),

  // Budgets
  http.get('/api/budgets', () => {
    return HttpResponse.json({
      budgets: [],
    })
  }),
]
```

**Create `src/test/mocks/server.ts`:**
```typescript
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

**Update `src/test/setup.ts`:**
```typescript
import '@testing-library/jest-dom'
import { afterEach, afterAll, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers after each test
afterEach(() => {
  cleanup()
  server.resetHandlers()
})

// Close server after all tests
afterAll(() => server.close())
```

### File Structure After Test Setup

```
src/
├── test/
│   ├── mocks/
│   │   ├── handlers.ts
│   │   └── server.ts
│   ├── setup.ts
│   └── test-utils.tsx
```

### Definition of Done (Updated)

- [ ] `npm test` runs without errors
- [ ] Tests can import from `@/test/test-utils`
- [ ] MSW intercepts API calls in tests

---

## Story 1.3 Tests: Utilities & API Client

Write these tests **before** implementing the utilities and API client.

### Test File: `src/lib/utils.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, formatMonthYear, getMonthName } from './utils'

describe('formatCurrency', () => {
  it('formats positive amounts with Swedish locale', () => {
    expect(formatCurrency(1234.56)).toBe('1 234,56 kr')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('0,00 kr')
  })

  it('formats negative amounts', () => {
    expect(formatCurrency(-500)).toBe('−500,00 kr')
  })

  it('formats large amounts with thousand separators', () => {
    expect(formatCurrency(1000000)).toBe('1 000 000,00 kr')
  })

  it('rounds to two decimal places', () => {
    expect(formatCurrency(123.456)).toBe('123,46 kr')
  })
})

describe('formatDate', () => {
  it('formats ISO date string to Swedish locale', () => {
    const result = formatDate('2025-03-15')
    expect(result).toMatch(/15.*mar.*2025/i)
  })

  it('formats datetime string', () => {
    const result = formatDate('2025-12-25T10:30:00Z')
    expect(result).toMatch(/25.*dec.*2025/i)
  })
})

describe('formatMonthYear', () => {
  it('formats month and year in Swedish', () => {
    const result = formatMonthYear(3, 2025)
    expect(result.toLowerCase()).toContain('mars')
    expect(result).toContain('2025')
  })

  it('handles January (month 1)', () => {
    const result = formatMonthYear(1, 2025)
    expect(result.toLowerCase()).toContain('januari')
  })

  it('handles December (month 12)', () => {
    const result = formatMonthYear(12, 2025)
    expect(result.toLowerCase()).toContain('december')
  })
})

describe('getMonthName', () => {
  it('returns Swedish month names', () => {
    expect(getMonthName(1).toLowerCase()).toBe('januari')
    expect(getMonthName(6).toLowerCase()).toBe('juni')
    expect(getMonthName(12).toLowerCase()).toBe('december')
  })
})
```

### Test File: `src/api/client.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiClientError, apiGet, apiPost, apiPut, apiDelete } from './client'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

describe('ApiClientError', () => {
  it('stores original and user-friendly messages', () => {
    const error = new ApiClientError(
      'Bank account name already exists',
      'An account with this name already exists. Please choose a different name.',
      400
    )
    
    expect(error.originalMessage).toBe('Bank account name already exists')
    expect(error.userMessage).toBe('An account with this name already exists. Please choose a different name.')
    expect(error.status).toBe(400)
    expect(error.message).toBe(error.userMessage)
  })
})

describe('apiGet', () => {
  it('returns parsed JSON on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    })

    const result = await apiGet('/test')
    
    expect(mockFetch).toHaveBeenCalledWith('/api/test')
    expect(result).toEqual({ data: 'test' })
  })

  it('throws ApiClientError on error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Bank account name already exists' }),
    })

    await expect(apiGet('/test')).rejects.toThrow(ApiClientError)
    
    try {
      await apiGet('/test')
    } catch (e) {
      const error = e as ApiClientError
      expect(error.userMessage).toContain('already exists')
    }
  })
})

describe('apiPost', () => {
  it('sends JSON body and returns response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: '123' }),
    })

    const result = await apiPost('/test', { name: 'Test' })
    
    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    })
    expect(result).toEqual({ id: '123' })
  })
})

describe('apiPut', () => {
  it('sends PUT request with body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ updated: true }),
    })

    await apiPut('/test/1', { name: 'Updated' })
    
    expect(mockFetch).toHaveBeenCalledWith('/api/test/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated' }),
    })
  })
})

describe('apiDelete', () => {
  it('handles 204 No Content response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    })

    const result = await apiDelete('/test/1')
    
    expect(mockFetch).toHaveBeenCalledWith('/api/test/1', {
      method: 'DELETE',
    })
    expect(result).toBeUndefined()
  })
})

describe('error message mapping', () => {
  const errorCases = [
    {
      apiError: 'Bank account name already exists',
      expectedContains: 'already exists',
    },
    {
      apiError: 'Cannot delete account used in unlocked budget',
      expectedContains: 'used in a budget',
    },
    {
      apiError: 'Budget already exists for this month',
      expectedContains: 'already exists for this month',
    },
    {
      apiError: 'Cannot modify locked budget',
      expectedContains: 'locked',
    },
    {
      apiError: 'Unknown error from API',
      expectedContains: 'Unknown error from API', // Falls through unchanged
    },
  ]

  it.each(errorCases)('maps "$apiError" to user-friendly message', async ({ apiError, expectedContains }) => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: apiError }),
    })

    try {
      await apiGet('/test')
    } catch (e) {
      const error = e as ApiClientError
      expect(error.userMessage.toLowerCase()).toContain(expectedContains.toLowerCase())
    }
  })
})
```

### TDD Flow for Story 1.3

1. **Write tests first** — Copy the test files above
2. **Run tests** — `npm test` (all should fail)
3. **Implement `src/lib/utils.ts`** — Make utility tests pass
4. **Implement `src/api/client.ts`** — Make API client tests pass
5. **Run tests** — All should pass
6. **Implement remaining API files** — `accounts.ts`, `budgets.ts`, etc. (these are thin wrappers, covered by integration tests later)

---

## Story 1.5 Tests: Layout Components

### Test File: `src/components/layout/Sidebar.test.tsx`

```typescript
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
    expect(screen.getByRole('link', { name: /recurring/i })).toBeInTheDocument()
  })

  it('navigation links have correct hrefs', () => {
    render(<Sidebar {...defaultProps} />)
    
    expect(screen.getByRole('link', { name: /budgets/i })).toHaveAttribute('href', '/budgets')
    expect(screen.getByRole('link', { name: /accounts/i })).toHaveAttribute('href', '/accounts')
    expect(screen.getByRole('link', { name: /recurring/i })).toHaveAttribute('href', '/recurring-expenses')
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    render(<Sidebar open={true} onClose={onClose} />)
    
    const closeButton = screen.getByRole('button')
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
```

### Test File: `src/components/layout/Header.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { Header } from './Header'

describe('Header', () => {
  it('renders app title', () => {
    render(<Header onMenuClick={vi.fn()} />)
    
    expect(screen.getByText('Balance')).toBeInTheDocument()
  })

  it('renders menu button', () => {
    render(<Header onMenuClick={vi.fn()} />)
    
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('calls onMenuClick when menu button is clicked', async () => {
    const onMenuClick = vi.fn()
    render(<Header onMenuClick={onMenuClick} />)
    
    await userEvent.click(screen.getByRole('button'))
    
    expect(onMenuClick).toHaveBeenCalledTimes(1)
  })
})
```

### Test File: `src/components/layout/AppLayout.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { AppLayout } from './AppLayout'

describe('AppLayout', () => {
  it('renders sidebar', () => {
    render(<AppLayout />)
    
    expect(screen.getByText('Balance')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<AppLayout />)
    
    expect(screen.getByRole('link', { name: /budgets/i })).toBeInTheDocument()
  })

  it('toggles sidebar on mobile menu click', async () => {
    render(<AppLayout />)
    
    // Find the mobile menu button (in Header)
    const menuButtons = screen.getAllByRole('button')
    const mobileMenuButton = menuButtons.find(btn => 
      btn.closest('header')
    )
    
    if (mobileMenuButton) {
      await userEvent.click(mobileMenuButton)
      // Sidebar should be visible (has translate-x-0 class)
      const sidebar = document.querySelector('aside')
      expect(sidebar).toHaveClass('translate-x-0')
    }
  })
})
```

### TDD Flow for Story 1.5

1. **Write tests first** — Create test files above
2. **Run tests** — All should fail
3. **Implement `Sidebar.tsx`** — Make Sidebar tests pass
4. **Implement `Header.tsx`** — Make Header tests pass
5. **Implement `AppLayout.tsx`** — Make AppLayout tests pass
6. **Run tests** — All should pass

---

## Story 1.6 Tests: Shared Components

### Test File: `src/components/shared/PageHeader.test.tsx`

```typescript
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
})
```

### Test File: `src/components/shared/LoadingState.test.tsx`

```typescript
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
```

### Test File: `src/components/shared/ErrorState.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { ErrorState } from './ErrorState'

describe('ErrorState', () => {
  it('renders default title and message', () => {
    render(<ErrorState />)
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/error occurred/i)).toBeInTheDocument()
  })

  it('renders custom title and message', () => {
    render(<ErrorState title="Custom Error" message="Custom message" />)
    
    expect(screen.getByText('Custom Error')).toBeInTheDocument()
    expect(screen.getByText('Custom message')).toBeInTheDocument()
  })

  it('renders retry button when onRetry provided', () => {
    render(<ErrorState onRetry={() => {}} />)
    
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('does not render retry button when onRetry not provided', () => {
    render(<ErrorState />)
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls onRetry when retry button clicked', async () => {
    const onRetry = vi.fn()
    render(<ErrorState onRetry={onRetry} />)
    
    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
```

### Test File: `src/components/shared/EmptyState.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No items" description="Create your first item" />)
    
    expect(screen.getByText('No items')).toBeInTheDocument()
    expect(screen.getByText('Create your first item')).toBeInTheDocument()
  })

  it('renders action when provided', () => {
    render(
      <EmptyState
        title="No items"
        description="Create your first item"
        action={<button>Create</button>}
      />
    )
    
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
  })

  it('renders custom icon when provided', () => {
    render(
      <EmptyState
        title="No items"
        description="Description"
        icon={<span data-testid="custom-icon">Icon</span>}
      />
    )
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })
})
```

### Test File: `src/components/shared/ConfirmDialog.test.tsx`

```typescript
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
    expect(confirmButton).toHaveClass('bg-red-600')
  })
})
```

### TDD Flow for Story 1.6

1. **Install shadcn components first** — These are dependencies
2. **Write tests** — Create test files above
3. **Run tests** — All should fail
4. **Implement components one by one:**
   - PageHeader → tests pass
   - LoadingState → tests pass
   - ErrorState → tests pass
   - EmptyState → tests pass
   - ConfirmDialog → tests pass
5. **Run all tests** — Everything green

---

## Updated Definition of Done for Epic 1

Each story is complete when:

- [ ] All tests pass (`npm test`)
- [ ] Implementation matches test expectations
- [ ] No TypeScript errors
- [ ] Component renders correctly in browser

---

## Test Coverage Summary

| Story | Test Files | Test Count (approx) |
|-------|------------|---------------------|
| 1.1 | (setup only) | 0 |
| 1.2 | (skip) | 0 |
| 1.3 | `utils.test.ts`, `client.test.ts` | ~20 |
| 1.4 | (skip - tested via integration) | 0 |
| 1.5 | `Sidebar.test.tsx`, `Header.test.tsx`, `AppLayout.test.tsx` | ~12 |
| 1.6 | `PageHeader.test.tsx`, `LoadingState.test.tsx`, `ErrorState.test.tsx`, `EmptyState.test.tsx`, `ConfirmDialog.test.tsx` | ~18 |

**Total: ~50 tests for Epic 1**

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended during TDD)
npm test -- --watch

# Run tests for a specific file
npm test -- src/lib/utils.test.ts

# Run with coverage
npm test -- --coverage
```

---

*Last updated: December 2024*
