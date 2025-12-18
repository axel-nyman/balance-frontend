# Story 1.1: Project Setup

**As a** developer
**I want to** have a properly configured React project
**So that** I can start building features with the right tooling in place

## Acceptance Criteria

- [ ] Vite project initialized with React + TypeScript template
- [ ] Tailwind CSS installed and configured
- [ ] Project runs with `npm run dev`
- [ ] Production build works with `npm run build`
- [ ] ESLint configured for TypeScript + React
- [ ] Path aliases configured (`@/` maps to `src/`)
- [ ] Base `index.css` includes Tailwind directives

## Implementation Steps

1. **Initialize project**
   ```bash
   npm create vite@latest balance-frontend -- --template react-ts
   cd balance-frontend
   npm install
   ```

2. **Install core dependencies**
   ```bash
   npm install react-router-dom @tanstack/react-query
   npm install react-hook-form @hookform/resolvers zod
   npm install tailwindcss postcss autoprefixer
   npm install clsx tailwind-merge
   npm install -D @types/node
   ```

3. **Initialize Tailwind**
   ```bash
   npx tailwindcss init -p
   ```

4. **Configure `tailwind.config.js`**
   ```javascript
   /** @type {import('tailwindcss').Config} */
   export default {
     content: [
       "./index.html",
       "./src/**/*.{js,ts,jsx,tsx}",
     ],
     theme: {
       extend: {},
     },
     plugins: [],
   }
   ```

5. **Update `src/index.css`**
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

6. **Configure path aliases in `vite.config.ts`**
   ```typescript
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
   })
   ```

7. **Update `tsconfig.json`** (add to compilerOptions)
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

8. **Create utility function `src/lib/utils.ts`**
   ```typescript
   import { clsx, type ClassValue } from 'clsx'
   import { twMerge } from 'tailwind-merge'

   export function cn(...inputs: ClassValue[]) {
     return twMerge(clsx(inputs))
   }
   ```

## File Structure After Completion

```
balance-frontend/
├── src/
│   ├── lib/
│   │   └── utils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Definition of Done

- [ ] `npm run dev` starts dev server without errors
- [ ] `npm run build` completes without errors
- [ ] Tailwind classes work (test with a colored div)
- [ ] Path alias works (`import { cn } from '@/lib/utils'`)

---

## Test Setup

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
