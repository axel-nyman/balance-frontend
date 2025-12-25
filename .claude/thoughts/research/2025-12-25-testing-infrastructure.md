---
date: 2025-12-25T12:00:00+01:00
researcher: Claude
git_commit: 0ebfee2371f7b6fd715c02f231466ca7f8cc4342
branch: main
repository: balance-frontend
topic: "Testing Infrastructure and Patterns"
tags: [research, testing, vitest, react-testing-library, msw]
status: complete
last_updated: 2025-12-25
last_updated_by: Claude
---

# Research: Testing Infrastructure and Patterns

**Date**: 2025-12-25
**Researcher**: Claude
**Git Commit**: 0ebfee2371f7b6fd715c02f231466ca7f8cc4342
**Branch**: main
**Repository**: balance-frontend

## Research Question

Document everything regarding testing in this repository, including configuration, patterns, utilities, and conventions.

## Summary

The codebase uses **Vitest** as the test runner with **React Testing Library** for component testing and **MSW (Mock Service Worker)** for API mocking. Tests are co-located with source files using the `*.test.tsx` or `*.test.ts` naming convention. There are currently 15 test files covering components, pages, utilities, and API client functions.

## Detailed Findings

### Test Framework and Dependencies

**Test Runner:**
- `vitest: ^4.0.16` - Modern Vite-native test framework

**Testing Libraries:**
- `@testing-library/react: ^16.3.1` - React component testing utilities
- `@testing-library/user-event: ^14.6.1` - User interaction simulation
- `@testing-library/jest-dom: ^6.9.1` - Custom DOM matchers (toBeInTheDocument, etc.)

**Test Environment:**
- `jsdom: ^24.1.3` - Browser-like DOM environment for Node.js

**API Mocking:**
- `msw: ^2.12.4` - Mock Service Worker for intercepting network requests

### Configuration Files

#### Vitest Configuration (`vitest.config.ts`)

```typescript
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

Key settings:
- `globals: true` - Test APIs (describe, it, expect) available without imports
- `environment: 'jsdom'` - Browser-like DOM for React testing
- `setupFiles` - Runs setup before tests
- Path alias `@` maps to `./src`

#### Test Setup (`src/test/setup.ts`)

```typescript
import '@testing-library/jest-dom'
import { afterEach, afterAll, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())
```

Functions:
- Imports jest-dom matchers for extended assertions
- Starts MSW server before all tests with strict mode (errors on unhandled requests)
- Cleans up React components after each test
- Resets MSW handlers to defaults after each test
- Closes MSW server when all tests complete

### Test Utilities

#### Custom Render Function (`src/test/test-utils.tsx`)

Provides a wrapped render function with all required providers:

```typescript
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
}

function AllProviders({ children }: WrapperProps) {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export * from '@testing-library/react'
export { customRender as render }
export { createTestQueryClient }
```

Key features:
- Wraps components with `QueryClientProvider` and `BrowserRouter`
- Creates fresh QueryClient per test with retry disabled
- Re-exports all Testing Library utilities
- Exports custom render as default render

### MSW Configuration

#### Server Instance (`src/test/mocks/server.ts`)

```typescript
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

#### API Handlers (`src/test/mocks/handlers.ts`)

```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
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
  http.get('/api/recurring-expenses', () => {
    return HttpResponse.json({
      expenses: [
        { id: '1', name: 'Rent', amount: 8000, recurrenceInterval: 'MONTHLY', isManual: true, lastUsedDate: null, nextDueDate: '2025-02-01', isDue: true, createdAt: '2025-01-01T00:00:00Z' },
      ],
    })
  }),
  http.get('/api/budgets', () => {
    return HttpResponse.json({ budgets: [] })
  }),
]
```

### Test File Structure

```
src/
├── test/
│   ├── setup.ts              # Global test setup
│   ├── test-utils.tsx        # Custom render with providers
│   └── mocks/
│       ├── handlers.ts       # MSW API mock handlers
│       └── server.ts         # MSW server instance
├── App.test.tsx              # Main App component tests
├── api/
│   └── client.test.ts        # API client tests
├── lib/
│   └── utils.test.ts         # Utility function tests
├── components/
│   ├── layout/
│   │   ├── Sidebar.test.tsx
│   │   ├── Header.test.tsx
│   │   └── AppLayout.test.tsx
│   ├── shared/
│   │   ├── PageHeader.test.tsx
│   │   ├── LoadingState.test.tsx
│   │   ├── ErrorState.test.tsx
│   │   ├── EmptyState.test.tsx
│   │   └── ConfirmDialog.test.tsx
│   └── accounts/
│       ├── AccountsSummary.test.tsx
│       ├── AccountsList.test.tsx
│       └── EditAccountModal.test.tsx
└── pages/
    └── AccountsPage.test.tsx
```

**Total test files:** 15

### NPM Scripts

```json
{
  "test": "vitest",              // Watch mode
  "test:ui": "vitest --ui",      // UI interface
  "test:coverage": "vitest --coverage"  // Coverage report
}
```

### Testing Patterns

#### 1. Test Organization

```typescript
describe('ComponentName', () => {
  it('renders correctly', () => { ... })
  it('handles loading state', () => { ... })
  it('handles error state', () => { ... })
})
```

#### 2. Import Pattern

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
```

#### 3. Default Props Pattern

```typescript
const defaultProps = {
  accounts: mockAccounts,
  isLoading: false,
  isError: false,
  onRetry: vi.fn(),
  onEdit: vi.fn(),
}

// Usage:
render(<Component {...defaultProps} isLoading={true} />)
```

#### 4. Mock Data

```typescript
const mockAccount: BankAccount = {
  id: '123',
  name: 'Checking',
  description: 'Main account',
  currentBalance: 5000,
  createdAt: '2025-01-01',
}
```

#### 5. User Interactions

```typescript
it('handles click', async () => {
  const onClick = vi.fn()
  render(<Button onClick={onClick}>Click me</Button>)

  await userEvent.click(screen.getByRole('button'))
  expect(onClick).toHaveBeenCalled()
})
```

#### 6. Async Testing

```typescript
// Finding elements after async updates
expect(await screen.findByText(/error message/i)).toBeInTheDocument()

// Using waitFor
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument()
})
```

#### 7. Accessible Queries

```typescript
screen.getByRole('button', { name: /save/i })
screen.getByRole('heading', { name: /accounts/i })
screen.getByLabelText(/name/i)
screen.getByText(/no accounts yet/i)
screen.getByDisplayValue('Checking')
```

#### 8. Negative Assertions

```typescript
expect(screen.queryByText('Error')).not.toBeInTheDocument()
```

#### 9. Module Mocking

```typescript
vi.mock('@/hooks', () => ({
  useUpdateAccount: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    error: null,
  }),
}))
```

#### 10. Per-Test Handler Override

```typescript
it('handles API error', async () => {
  server.use(
    http.get('/api/test', () => {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    })
  )

  // Test error handling...
})
```

#### 11. Parameterized Tests

```typescript
const errorCases = [
  { apiError: 'Name already exists', expected: 'already exists' },
  { apiError: 'Invalid format', expected: 'invalid format' },
]

it.each(errorCases)('maps "$apiError"', async ({ apiError, expected }) => {
  // Test implementation
})
```

#### 12. DOM Inspection (when accessible queries not available)

```typescript
const { container } = render(<LoadingState />)
const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
expect(skeletons.length).toBeGreaterThan(0)
```

#### 13. Route Testing

```typescript
import { MemoryRouter, Routes, Route } from 'react-router'

it('redirects home to budgets', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Navigate to="/budgets" replace />} />
        <Route path="/budgets" element={<BudgetsPage />} />
      </Routes>
    </MemoryRouter>
  )
  expect(screen.getByText('Budgets')).toBeInTheDocument()
})
```

### Test Naming Convention

- Component tests: `ComponentName.test.tsx` (co-located with source)
- Utility tests: `filename.test.ts` (co-located with source)
- No `__tests__` directories used
- No snapshot tests (no `__snapshots__` directories)

## Code References

- `vitest.config.ts` - Main test configuration
- `src/test/setup.ts` - Global test setup with MSW lifecycle
- `src/test/test-utils.tsx` - Custom render with providers
- `src/test/mocks/handlers.ts` - Default API mock handlers
- `src/test/mocks/server.ts` - MSW server instance
- `src/api/client.test.ts:107-146` - Parameterized tests example
- `src/components/accounts/AccountsList.test.tsx` - Comprehensive component test example
- `src/components/accounts/EditAccountModal.test.tsx` - Form and modal testing example

## Historical Context (from thoughts/)

- `.claude/thoughts/research/2025-12-21-project-setup-analysis.md` - Initial project setup analysis including test infrastructure
- `.claude/thoughts/notes/TECH_STACK.md` - High-level testing strategy documentation
- All 38 story plans in `.claude/thoughts/plans/` contain testing sections with specific test examples for each feature

## Related Research

None currently in `.claude/thoughts/research/` specifically about testing (this is the first dedicated testing research document).

## Open Questions

None - the testing infrastructure is well-documented and follows consistent patterns.
