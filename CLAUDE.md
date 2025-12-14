# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Balance is a personal budgeting web application for couples managing shared monthly finances. Self-hosted on a Raspberry Pi, it provides structured monthly budgeting with tracking for income, expenses, savings, and money movements between accounts. No authentication required (trusted local network).

**Key Concepts:**
- **Bank Accounts** - Track current balances and balance history
- **Recurring Expenses** - Templates for regular expenses (monthly, quarterly, yearly)
- **Budgets** - Monthly financial plans with two states: unlocked (editable) and locked (finalized, generates todo list)
- **Todo Lists** - Auto-generated when budget locks, containing transfer and payment tasks

## Tech Stack

**Frontend (This Repo):**
- React 18+ with TypeScript
- Vite for build tooling
- React Router v6 for routing
- TanStack Query (React Query) for server state
- React Hook Form + Zod for forms/validation
- Tailwind CSS for styling
- shadcn/ui components (Radix UI primitives)
- Sonner for toast notifications

**Backend:**
- Spring Boot (Java) REST API
- Base URL: `/api`
- Deployed on Raspberry Pi

## Development Commands

Since this is currently a planning/documentation repository with no source code yet, typical commands will be:

```bash
# Once initialized:
npm install          # Install dependencies
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint (if configured)
```

## Project Structure (Planned)

```
src/
├── api/                    # API client functions
│   ├── accounts.ts        # Bank account endpoints
│   ├── budgets.ts         # Budget endpoints
│   ├── recurring-expenses.ts
│   ├── todo.ts            # Todo list endpoints
│   └── types.ts           # API request/response types
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Sidebar, PageHeader
│   ├── accounts/          # Account-specific components
│   ├── budgets/           # Budget-specific components
│   ├── recurring-expenses/
│   └── shared/            # Reusable components
├── hooks/                 # React Query hooks
│   ├── useAccounts.ts
│   ├── useBudgets.ts
│   └── useTodoList.ts
├── pages/                 # Route components
│   ├── AccountsPage.tsx
│   ├── BudgetsPage.tsx
│   ├── BudgetDetailPage.tsx
│   ├── BudgetWizardPage.tsx
│   ├── RecurringExpensesPage.tsx
│   └── TodoListPage.tsx
├── lib/                   # Utilities
│   └── utils.ts           # cn() helper, formatters
├── App.tsx                # Root with router
├── main.tsx               # Entry point
└── index.css              # Tailwind imports
```

## Routes

```
/accounts                  # Bank account management
/recurring-expenses        # Recurring expense templates
/budgets                   # Budget list (card view)
/budgets/new              # Multi-step budget wizard
/budgets/:id              # Budget detail view
/budgets/:id/todo         # Todo list for locked budget
```

## API Integration Patterns

### State Management Philosophy
- **Server state**: React Query (all CRUD operations, caching, background refetch)
- **Client state**: useState/useReducer (modals, wizard steps, form inputs)
- No Redux/Zustand needed - this is fundamentally a CRUD app

### API Client Pattern
Use native fetch wrapped in helper functions:

```typescript
// src/api/budgets.ts
const API_BASE = '/api'

export async function fetchBudgets(): Promise<BudgetListResponse> {
  const res = await fetch(`${API_BASE}/budgets`)
  if (!res.ok) throw new Error('Failed to fetch budgets')
  return res.json()
}

// React Query hook usage
const { data, isLoading, error } = useQuery({
  queryKey: ['budgets'],
  queryFn: fetchBudgets
})
```

### Critical API Endpoint Corrections

The backend uses these exact paths (use path parameters `{id}`, not `:id` in docs):

```
# Budget locking
PUT /api/budgets/{id}/lock      # NOT POST
PUT /api/budgets/{id}/unlock    # NOT POST

# Todo list
GET /api/budgets/{budgetId}/todo-list              # NOT /api/budgets/:id/todo
PUT /api/budgets/{budgetId}/todo-list/items/{id}  # NOT /api/budgets/:id/todo/:itemId
```

The `TodoList` response includes a `summary` object:
```typescript
interface TodoListSummary {
  totalItems: number
  pendingItems: number
  completedItems: number
}

interface TodoList {
  id: string
  budgetId: string
  createdAt: string
  items: TodoItem[]
  summary: TodoListSummary
}
```

## UI/UX Patterns

### Design Philosophy
- **Apple-inspired aesthetic**: Clean, spacious, generous whitespace, glass-effect overlays
- **Light mode only** (dark mode explicitly out of scope)
- **Mobile-first, desktop-friendly**: Must work on phones and desktops
- **Explicit over automatic**: Users explicitly save (except todo checkbox toggles)
- **Modal-based editing only**: No inline editing (removed for simplicity)

### Component Patterns

**Modals (Dialog)** - Used for:
- Creating/editing accounts, recurring expenses
- Creating/editing budget line items (income, expenses, savings)
- Pattern: Glass overlay, form, Cancel/Save buttons

**Drawers (Sheet)** - Used for:
- Balance history (slide-in from right)

**Loading States:**
- Page/list loading: Skeleton loaders
- Button actions: Spinner inside button, button disabled
- Use optimistic updates for mutations

**Error Handling:**
- Form validation: Inline errors below fields
- API errors: Toast notifications
- Network failures: Toast with retry option

### Styling Guidelines

Use Tailwind utilities exclusively. Semantic mappings:
- Primary: `blue-600` (buttons, links, focus)
- Destructive: `red-600` (delete, errors)
- Muted: `gray-500` (secondary text, borders)
- Background: `gray-50` or `white`
- Border: `gray-200`

Typography scale:
- `text-sm` - Secondary text, labels
- `text-base` - Body text
- `text-lg` - Section headers
- `text-xl` - Page titles
- `text-2xl` - Major headings

Spacing: Use `p-4`, `m-4`, `gap-4`, `space-y-4` consistently

Border radius: `rounded-md` (buttons/inputs), `rounded-lg` (cards/modals)

Animations: Keep subtle (150-200ms micro-interactions, 300ms modals/drawers)

## Budget Wizard Specifics

The budget creation wizard (`/budgets/new`) is a critical flow with 5 steps:
1. Select month/year
2. Add income (editable table)
3. Add expenses (editable table, with recurring expense recommendations)
4. Add savings (editable table)
5. Review and lock

**Key behaviors:**
- Running balance calculations visible throughout
- "Copy from last budget" feature for all step types
- Validation: Cannot create budget for existing month, or month older than most recent budget
- No partial save - budget only persists when user completes wizard
- Navigation guards for unsaved changes

## Currency Format

The app uses **Swedish Krona (SEK)** as the currency. Format amounts as:
- Locale: `sv-SE`
- Currency: `SEK`
- Example: `8 500 kr` or `8 500,00 kr`

## Important Implementation Notes

1. **No inline editing**: All editing is modal-based (UPDATE_004). Simplifies implementation and improves mobile UX.

2. **Explicit save**: No autosave except todo item checkboxes (which use optimistic updates).

3. **Wizard state**: Budget wizard holds all state in memory until final save. No intermediate API calls.

4. **Balance history**: Automatically updated when budgets lock/unlock. Manual updates also supported.

5. **Recurring expense tracking**: `lastUsedInBudgetMonth` field helps identify which recurring expenses are due.

6. **Todo generation logic**: Backend generates todos when budget locks. Frontend just displays and toggles completion.

7. **Account deletion restrictions**: Cannot delete accounts used in budgets (soft delete with `deletedAt` timestamp).

## Documentation Structure

This repository contains extensive planning documents:

- `TECH_STACK.md` - Detailed technical decisions with rationale
- `ux-flows/PROJECT_OVERVIEW.md` - High-level product overview
- `ux-flows/*.md` - Detailed UX specifications for each page/flow
- `TODO_LIST_FLOW.md` - Todo list page specification
- `backend-stories.md` - Backend API stories (reference for API contracts)
- `todo/backlog/FRONTEND_STORIES_EPIC*.md` - Implementation stories organized by epic
- `todo/critical-issues/UPDATE_*.md` - Important corrections and clarifications

Always reference these documents when implementing features to ensure alignment with design decisions.

## Non-Goals

Explicitly out of scope (don't implement):
- User authentication / multi-tenancy
- Bank integrations / automatic transaction import
- Investment tracking
- Debt payoff planning
- Reports / analytics / charts (may add later)
- Data export (may add later)
- Dark mode (may add later)
