# CLAUDE.md

## Project Overview

Balance is a personal budgeting app for couples managing shared monthly finances. Self-hosted, no auth required.

**Key Concepts:** Bank Accounts (balance tracking), Recurring Expenses (templates), Budgets (monthly plans, locked/unlocked states), Todo Lists (auto-generated when budget locks).

## Development

```bash
docker compose up              # Start all services (recommended)
docker compose down -v         # Stop and clean up

npm install && npm run dev     # Local dev (requires backend separately)
npm run build                  # Production build
npm test                       # Run tests
```

**Access Points (Docker):**

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api
- **Swagger UI: http://localhost:8080/swagger-ui.html** (explore all API endpoints)
- Adminer (DB): http://localhost:8081 (postgres/user/password/mydatabase)

## Tech Stack

- React 18 + TypeScript + Vite
- TanStack Query (server state), React Hook Form + Zod (forms)
- Tailwind CSS + shadcn/ui (Radix primitives) + Sonner (toasts)
- Backend: Spring Boot REST API at `/api`

## Project Structure

```
src/
├── api/           # API client functions + types
├── components/
│   ├── ui/        # shadcn/ui components
│   ├── layout/    # Sidebar, PageHeader
│   └── [feature]/ # Feature-specific components
├── hooks/         # React Query hooks (useAccounts, useBudgets, etc.)
├── pages/         # Route components
└── lib/           # Utilities (cn(), formatters)
```

## Routes

```
/accounts              /recurring-expenses      /budgets
/budgets/new           /budgets/:id             /budgets/:id/todo
```

## API Patterns

**State management:** React Query for server state, useState for UI state. No Redux needed.

**Fetch pattern:**

```typescript
const API_BASE = "/api";
export async function fetchBudgets(): Promise<Budget[]> {
  const res = await fetch(`${API_BASE}/budgets`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}
```

## UI/UX Guidelines

- **Apple-inspired**: Clean, spacious, light mode only
- **Mobile-first**, desktop-friendly
- **Modal-based editing** only (no inline editing)
- **Explicit save** (except todo checkboxes use optimistic updates)

**Components:** Modals for create/edit, Drawers for history, Skeleton loaders, Toast for errors.

**Colors:** Primary `blue-600`, Destructive `red-600`, Muted `gray-500`, Background `gray-50`/`white`

## Currency

Swedish Krona (SEK), locale `sv-SE`. Format: `8 500 kr`

## Documentation

See `.claude/thoughts/` for plans and research. Key files:

- `TECH_STACK.md` - Technical decisions
- `.claude/thoughts/plans/` - Implementation plans by story

## Non-Goals

No auth, bank integrations, investments, debt tracking, reports/charts, data export, dark mode.
