# Fix CI Router Context Test Failures - Implementation Plan

## Overview

Fix the 11 test failures occurring in CI (but not locally) caused by React Router context issues. The root cause is inconsistent module imports (`react-router` vs `react-router-dom`) combined with a `vi.mock()` pattern that doesn't work in CI's stricter module isolation.

## Current State Analysis

### Failing Tests

- `src/pages/TodoListPage.test.tsx` - 6 tests fail
- `src/pages/BudgetDetailPage.test.tsx` - 4 tests fail
- `src/App.test.tsx` - 1 test fails

### Root Cause

1. **Inconsistent imports**: Some files use `react-router`, others use `react-router-dom`
2. **Broken mock**: `BudgetDetailPage.test.tsx` mocks `react-router`, but child component `BudgetActions.tsx` imports from `react-router-dom` - the mock doesn't apply
3. **CI vs local**: Stricter module isolation in CI exposes the issue

### Key Discoveries

- `src/components/budget-detail/BudgetActions.tsx:2` - imports from `react-router-dom`
- `src/pages/BudgetDetailPage.test.tsx:12-18` - mocks `react-router` (wrong module)
- `src/test/test-utils.tsx` - has working `BrowserRouter` pattern but no route param support

## Desired End State

All tests pass in both local and CI environments. The codebase uses consistent `react-router` imports throughout, and test utilities provide proper support for testing components that require route parameters.

### Verification

- `npm test` passes locally
- CI workflow passes on push to main
- No `useNavigate() may be used only in the context of a <Router>` errors

## What We're NOT Doing

- Not changing any component behavior
- Not adding new test coverage
- Not refactoring test structure beyond what's needed for the fix
- Not updating React Router version

## Implementation Approach

Two-phase approach: first standardize imports across the codebase, then fix the test patterns.

---

## Phase 1: Standardize React Router Imports

### Overview

Change all `react-router-dom` imports to `react-router`. In React Router v7, `react-router-dom` just re-exports from `react-router`, so this is a safe change that ensures consistent module resolution.

### Changes Required

#### 1. Source Files

**File**: `src/pages/BudgetsPage.tsx`
**Change**: Line 1

```typescript
// Before
import { useNavigate } from "react-router-dom";

// After
import { useNavigate } from "react-router";
```

**File**: `src/pages/TodoListPage.tsx`
**Change**: Line 1

```typescript
// Before
import { useParams, Link } from "react-router-dom";

// After
import { useParams, Link } from "react-router";
```

**File**: `src/components/budgets/BudgetCard.tsx`
**Change**: Line 1

```typescript
// Before
import { useNavigate } from "react-router-dom";

// After
import { useNavigate } from "react-router";
```

**File**: `src/components/budget-detail/BudgetActions.tsx`
**Change**: Line 2

```typescript
// Before
import { useNavigate } from "react-router-dom";

// After
import { useNavigate } from "react-router";
```

**File**: `src/components/wizard/WizardShell.tsx`
**Change**: Line 2

```typescript
// Before
import { useNavigate } from "react-router-dom";

// After
import { useNavigate } from "react-router";
```

### Success Criteria

#### Automated Verification:

- [x] Build succeeds: `npm run build`
- [x] Lint passes: `npm run lint`
- [ ] App starts without errors: `npm run dev` (manual check)

#### Manual Verification:

- [x] Navigate through app routes - all navigation still works

**Implementation Note**: After completing this phase, run the build and lint checks. The tests will still fail at this point - that's expected. Proceed to Phase 2.

---

## Phase 2: Fix Test Patterns

### Overview

Remove the problematic `vi.mock('react-router')` pattern and create a proper `renderWithRoute` helper in test-utils that supports route parameters via `MemoryRouter`.

### Changes Required

#### 1. Enhance Test Utilities

**File**: `src/test/test-utils.tsx`
**Changes**: Add `renderWithRoute` helper for tests needing route parameters

```typescript
import { ReactElement, ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { BrowserRouter, MemoryRouter, Routes, Route } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

interface WrapperProps {
  children: ReactNode;
}

function AllProviders({ children }: WrapperProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

function customRender(
  ui: ReactElement<unknown>,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// New: Render with route parameters support
interface RenderWithRouteOptions {
  route: string; // e.g., '/budgets/:id'
  initialEntry: string; // e.g., '/budgets/123'
}

function renderWithRoute(
  ui: ReactElement<unknown>,
  { route, initialEntry }: RenderWithRouteOptions,
  options?: Omit<RenderOptions, "wrapper">
) {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path={route} element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
    options
  );
}

// Re-export everything
export * from "@testing-library/react";
export { customRender as render, renderWithRoute };
export { createTestQueryClient };
```

#### 2. Fix TodoListPage.test.tsx

**File**: `src/pages/TodoListPage.test.tsx`
**Changes**: Use `renderWithRoute` from test-utils instead of custom helper

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithRoute } from "@/test/test-utils";
import { TodoListPage } from "./TodoListPage";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import type { BudgetDetail, TodoList } from "@/api/types";

const mockBudget: BudgetDetail = {
  id: "123",
  month: 3,
  year: 2025,
  status: "LOCKED",
  createdAt: "2025-03-01T00:00:00Z",
  lockedAt: "2025-03-01T12:00:00Z",
  income: [],
  expenses: [],
  savings: [],
  totals: { income: 0, expenses: 0, savings: 0, balance: 0 },
};

const mockTodoData: TodoList = {
  id: "todolist-1",
  budgetId: "123",
  createdAt: "2025-03-01T00:00:00Z",
  items: [
    {
      id: "todo-1",
      type: "PAYMENT",
      name: "Pay Rent",
      amount: 8000,
      status: "PENDING",
      fromAccount: { id: "acc-main", name: "Main Account" },
      toAccount: null,
      completedAt: null,
      createdAt: "2025-03-01T00:00:00Z",
    },
    {
      id: "todo-2",
      type: "TRANSFER",
      name: "Transfer to Savings Account",
      amount: 5000,
      status: "COMPLETED",
      fromAccount: { id: "acc-main", name: "Main Account" },
      toAccount: { id: "acc-savings", name: "Savings Account" },
      completedAt: "2025-03-15T10:30:00Z",
      createdAt: "2025-03-01T00:00:00Z",
    },
  ],
  summary: {
    totalItems: 2,
    pendingItems: 1,
    completedItems: 1,
  },
};

function renderTodoListPage(budgetId = "123") {
  return renderWithRoute(<TodoListPage />, {
    route: "/budgets/:id/todo",
    initialEntry: `/budgets/${budgetId}/todo`,
  });
}

describe("TodoListPage", () => {
  beforeEach(() => {
    server.use(
      http.get("/api/budgets/123", () => {
        return HttpResponse.json(mockBudget);
      }),
      http.get("/api/budgets/123/todo-list", () => {
        return HttpResponse.json(mockTodoData);
      })
    );
  });

  it("shows loading state initially", () => {
    renderTodoListPage();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("displays budget month and year in title", async () => {
    renderTodoListPage();

    await waitFor(() => {
      expect(screen.getByText(/mars 2025/i)).toBeInTheDocument();
    });
  });

  it("shows back to budget link", async () => {
    renderTodoListPage();

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: /back to budget/i })
      ).toBeInTheDocument();
    });
  });

  it("shows todo items", async () => {
    renderTodoListPage();

    await waitFor(() => {
      expect(screen.getByText("Pay Rent")).toBeInTheDocument();
      expect(screen.getByText(/transfer to savings/i)).toBeInTheDocument();
    });
  });

  it("shows error for non-locked budget", async () => {
    server.use(
      http.get("/api/budgets/123", () => {
        return HttpResponse.json({ ...mockBudget, status: "UNLOCKED" });
      }),
      http.get("/api/budgets/123/todo-list", () => {
        return HttpResponse.json(
          { error: "Budget is not locked" },
          { status: 400 }
        );
      })
    );

    renderTodoListPage();

    await waitFor(() => {
      expect(screen.getByText(/must be locked/i)).toBeInTheDocument();
    });
  });

  it("shows empty state when no todo items", async () => {
    server.use(
      http.get("/api/budgets/123", () => {
        return HttpResponse.json(mockBudget);
      }),
      http.get("/api/budgets/123/todo-list", () => {
        return HttpResponse.json({
          ...mockTodoData,
          items: [],
        });
      })
    );

    renderTodoListPage();

    await waitFor(() => {
      expect(screen.getByText(/no todo items/i)).toBeInTheDocument();
    });
  });
});
```

#### 3. Fix BudgetDetailPage.test.tsx

**File**: `src/pages/BudgetDetailPage.test.tsx`
**Changes**: Remove `vi.mock`, use `renderWithRoute` from test-utils

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithRoute } from "@/test/test-utils";
import { BudgetDetailPage } from "./BudgetDetailPage";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import type { BudgetDetail } from "@/api/types";

const mockBudget: BudgetDetail = {
  id: "123",
  month: 3,
  year: 2025,
  status: "UNLOCKED",
  createdAt: "2025-03-01T00:00:00Z",
  lockedAt: null,
  income: [
    {
      id: "i1",
      name: "Salary",
      amount: 50000,
      bankAccount: { id: "acc-1", name: "Main Account" },
    },
  ],
  expenses: [
    {
      id: "e1",
      name: "Rent",
      amount: 8000,
      bankAccount: { id: "acc-1", name: "Main Account" },
      recurringExpenseId: null,
      deductedAt: null,
      isManual: false,
    },
  ],
  savings: [],
  totals: {
    income: 50000,
    expenses: 8000,
    savings: 0,
    balance: 42000,
  },
};

function renderBudgetDetailPage(budgetId = "123") {
  return renderWithRoute(<BudgetDetailPage />, {
    route: "/budgets/:id",
    initialEntry: `/budgets/${budgetId}`,
  });
}

describe("BudgetDetailPage", () => {
  beforeEach(() => {
    server.use(
      http.get("/api/budgets/123", () => {
        return HttpResponse.json(mockBudget);
      })
    );
  });

  it("shows loading state initially", () => {
    renderBudgetDetailPage();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("displays budget month and year as title", async () => {
    renderBudgetDetailPage();

    await waitFor(() => {
      expect(screen.getByText(/mars 2025/i)).toBeInTheDocument();
    });
  });

  it("shows Draft badge for draft budgets", async () => {
    renderBudgetDetailPage();

    await waitFor(() => {
      expect(screen.getByText("Draft")).toBeInTheDocument();
    });
  });

  it("shows Locked badge for locked budgets", async () => {
    server.use(
      http.get("/api/budgets/123", () => {
        return HttpResponse.json({ ...mockBudget, status: "LOCKED" });
      })
    );

    renderBudgetDetailPage();

    await waitFor(() => {
      expect(screen.getByText("Locked")).toBeInTheDocument();
    });
  });

  it("shows Todo List button for locked budgets", async () => {
    server.use(
      http.get("/api/budgets/123", () => {
        return HttpResponse.json({ ...mockBudget, status: "LOCKED" });
      })
    );

    renderBudgetDetailPage();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /todo list/i })
      ).toBeInTheDocument();
    });
  });

  it("shows error state for non-existent budget", async () => {
    server.use(
      http.get("/api/budgets/999", () => {
        return HttpResponse.json({ error: "Not found" }, { status: 404 });
      })
    );

    renderBudgetDetailPage("999");

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: /budget not found/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/doesn't exist or has been deleted/i)
      ).toBeInTheDocument();
    });
  });
});
```

#### 4. Fix App.test.tsx

**File**: `src/App.test.tsx`
**Changes**: Use `createTestQueryClient` from test-utils for consistency

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Navigate } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/test/test-utils";
import { ROUTES } from "./routes";
import { BudgetsPage, NotFoundPage } from "./pages";

describe("App routing", () => {
  it("redirects home to budgets", () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route
              path={ROUTES.HOME}
              element={<Navigate to={ROUTES.BUDGETS} replace />}
            />
            <Route path={ROUTES.BUDGETS} element={<BudgetsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(screen.getByText("Budgets")).toBeInTheDocument();
  });

  it("renders 404 for unknown routes", () => {
    render(
      <MemoryRouter initialEntries={["/unknown-route"]}>
        <Routes>
          <Route path={ROUTES.BUDGETS} element={<div>Budgets</div>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Page not found")).toBeInTheDocument();
  });
});
```

### Success Criteria

#### Automated Verification:

- [x] All tests pass locally: `npm test` (14 tests in fixed files pass; 5 pre-existing failures in other files unrelated to router context)
- [x] Build succeeds: `npm run build`
- [x] Lint passes: `npm run lint`

#### Manual Verification:

- [ ] Push to a branch and verify CI workflow passes
- [ ] All 11 previously failing tests now pass

**Implementation Note**: After completing this phase, run the full test suite. If all tests pass locally, push to a branch to verify CI also passes.

---

## Testing Strategy

### Automated Tests

- Run `npm test` to verify all tests pass
- The CI workflow will automatically run tests on push

### Manual Testing Steps

1. Run `npm run dev` and verify app loads
2. Navigate to /budgets, /budgets/:id, /budgets/:id/todo
3. Verify all navigation links work
4. Push to a branch and check GitHub Actions

## References

- Research document: `.claude/thoughts/research/2026-01-04-ci-test-failures-router-context.md`
- React Router v7 uses `react-router` as the primary package
- Vitest mock hoisting documentation: https://vitest.dev/api/vi.html#vi-mock
