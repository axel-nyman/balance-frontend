# Balance — Frontend Technical Stack

This document captures the technical decisions for the Balance frontend application. Each decision includes rationale to help future contributors understand *why* choices were made.

---

## Core Framework

| Choice | Details |
|--------|---------|
| **React 18+** | Component-based UI library |
| **TypeScript** | Type safety, better DX, catch errors at compile time |
| **Vite** | Fast dev server and build tool (recommended over CRA) |

---

## State Management

### Server State: React Query (TanStack Query)

**Decision:** Use React Query for all server-side data fetching and caching.

**Rationale:**
- Balance is fundamentally a CRUD application — almost all state lives on the server
- React Query handles caching, background refetching, loading states, and error states out of the box
- Eliminates boilerplate for data fetching patterns
- Provides optimistic updates for snappy UX when needed
- Much simpler than Redux for this use case

**Usage pattern:**
```typescript
// Fetching
const { data, isLoading, error } = useQuery({
  queryKey: ['accounts'],
  queryFn: fetchAccounts
});

// Mutations
const mutation = useMutation({
  mutationFn: createAccount,
  onSuccess: () => queryClient.invalidateQueries(['accounts'])
});
```

### Client State: useState / useReducer

**Decision:** Use React's built-in hooks for local UI state.

**Rationale:**
- Local state (modal open/closed, form inputs, wizard step) doesn't need global management
- Keeps components self-contained
- No additional dependencies

**Examples of local state:**
- Modal visibility
- Current wizard step
- Form field values (managed by React Hook Form)
- Expandable section states

---

## Styling

### Tailwind CSS

**Decision:** Use Tailwind CSS for all styling.

**Rationale:**
- Utility-first approach enables rapid development
- No context-switching between files (styles live in JSX)
- Eliminates naming decisions (no BEM, no CSS modules naming)
- Built-in responsive utilities (`sm:`, `md:`, `lg:`)
- Pairs perfectly with shadcn/ui components
- Easy to maintain consistent spacing, colors, typography

**Configuration:**
- Use default Tailwind config as baseline
- Extend with custom colors for brand consistency if needed
- Use `@apply` sparingly (prefer inline utilities)

---

## Component Library

### shadcn/ui

**Decision:** Use shadcn/ui as the component foundation.

**Rationale:**
- Not a dependency — components are copied into your codebase
- Built on Radix UI primitives (accessible, unstyled, composable)
- Styled with Tailwind (matches our styling choice)
- Looks polished out of the box with minimal customization
- Easy to modify since you own the code
- Provides exactly what we need: modals (Dialog), forms, buttons, tables, drawers (Sheet), dropdowns, etc.

**Components we'll use:**
- `Button` — Actions
- `Dialog` — Modal forms for create/edit
- `Sheet` — Slide-out drawer for balance history
- `Table` — Account and recurring expense lists
- `Card` — Budget cards in list view
- `Form` — Form wrapper with validation integration
- `Input`, `Select`, `Checkbox` — Form controls
- `Toast` / `Sonner` — Notifications
- `Skeleton` — Loading placeholders
- `Accordion` — Expandable sections in budget detail

---

## Form Handling

### React Hook Form + Zod

**Decision:** Use React Hook Form for form state, Zod for validation schemas.

**Rationale:**
- React Hook Form is lightweight and performant (minimal re-renders)
- Zod provides type-safe schema validation that integrates with TypeScript
- Together they provide: field registration, validation, error messages, submit handling
- Essential for the multi-step budget wizard
- shadcn/ui forms are built around this combination

**Usage pattern:**
```typescript
const schema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().positive("Amount must be positive"),
});

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
});
```

---

## HTTP Client

### Fetch API (via React Query)

**Decision:** Use native `fetch` wrapped in React Query.

**Rationale:**
- No additional dependencies (Axios not needed)
- React Query handles retries, caching, error handling
- Simple wrapper functions for API calls

**API client structure:**
```typescript
// src/api/accounts.ts
const API_BASE = '/api';

export async function fetchAccounts(): Promise<AccountListResponse> {
  const res = await fetch(`${API_BASE}/bank-accounts`);
  if (!res.ok) throw new Error('Failed to fetch accounts');
  return res.json();
}

export async function createAccount(data: CreateAccountRequest): Promise<AccountResponse> {
  const res = await fetch(`${API_BASE}/bank-accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create account');
  return res.json();
}
```

---

## Routing

### React Router v6

**Decision:** Use React Router for client-side routing.

**Rationale:**
- Industry standard for React SPAs
- Supports nested routes (useful for budget detail views)
- Provides navigation guards (for wizard abandonment warning)

**Route structure:**
```
/accounts                    — Account list
/recurring-expenses          — Recurring expense list
/budgets                     — Budget list
/budgets/new                 — Budget creation wizard
/budgets/:id                 — Budget detail view
/budgets/:id/todo            — Todo list for budget
```

---

## UI/UX Patterns

### Navigation

| Viewport | Pattern |
|----------|---------|
| Desktop | Persistent left sidebar with nav items |
| Mobile | Hamburger menu (top) or collapsible sidebar |

**Nav items:**
1. Accounts
2. Recurring Expenses
3. Budgets

### Modals (Dialog)

Used for:
- Creating new accounts, recurring expenses
- Editing existing accounts, recurring expenses
- Editing budget line items (income, expenses, savings)

Pattern: "Glass pane" overlay with form, Cancel and Save buttons.

### Drawers (Sheet)

Used for:
- Balance history (slides in from right, but direction is flexible)

Pattern: Slide-out panel that doesn't fully obscure the page.

### Loading States

| Context | Pattern |
|---------|---------|
| Page/list loading | Skeleton loaders matching content shape |
| Button actions | Spinner inside button, button disabled |
| Mutations | Optimistic updates where appropriate |

### Error Handling

| Context | Pattern |
|---------|---------|
| Form validation | Inline errors below fields |
| API errors | Toast notification |
| Network failures | Toast with retry option |

### Confirmations

| Action | Pattern |
|--------|---------|
| Delete operations | Confirmation modal ("Are you sure?") |
| Unsaved changes (wizard) | Browser prompt on navigation |
| Lock budget | No confirmation (action is reversible) |

### Empty States

All list views should have helpful empty states:
- "No accounts yet. Create your first account to get started."
- "No budgets yet. Create a budget to start planning."
- etc.

---

## Design Tokens

### Color Palette

Light mode only. Use Tailwind's default palette as foundation, with these semantic mappings:

| Token | Usage | Tailwind Class (example) |
|-------|-------|--------------------------|
| Primary | Buttons, links, focus rings | `blue-600` |
| Destructive | Delete buttons, error states | `red-600` |
| Muted | Secondary text, borders | `gray-500` |
| Background | Page background | `gray-50` or `white` |
| Card | Card backgrounds | `white` |
| Border | Borders, dividers | `gray-200` |

*Note: These can be customized in `tailwind.config.js` if desired.*

### Typography

Use Tailwind's default type scale:
- `text-sm` — Secondary text, labels
- `text-base` — Body text
- `text-lg` — Section headers
- `text-xl` — Page titles
- `text-2xl` — Major headings

Font: System font stack (Tailwind default) — clean, native feel on all platforms.

### Spacing

Use Tailwind's spacing scale consistently:
- `p-4` / `m-4` — Standard padding/margin
- `gap-4` — Standard gap in flex/grid
- `space-y-4` — Standard vertical spacing in stacked layouts

### Border Radius

- `rounded-md` — Buttons, inputs
- `rounded-lg` — Cards, modals
- `rounded-full` — Avatars, badges (if used)

---

## Animations

Keep animations subtle and purposeful:

| Element | Animation |
|---------|-----------|
| Modals | Fade in + slight scale up |
| Drawers | Slide in from edge |
| Toasts | Slide in from top/bottom |
| Skeleton | Pulse animation (built into shadcn) |
| Hover states | Subtle color transitions (`transition-colors`) |

Duration: 150-200ms for micro-interactions, 300ms for modals/drawers.

Easing: Use Tailwind defaults (`ease-in-out`).

---

## Project Structure

```
src/
├── api/                    # API client functions
│   ├── accounts.ts
│   ├── budgets.ts
│   ├── recurring-expenses.ts
│   └── types.ts            # API request/response types
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Sidebar, PageHeader, etc.
│   ├── accounts/           # Account-specific components
│   ├── budgets/            # Budget-specific components
│   ├── recurring-expenses/ # Recurring expense components
│   └── shared/             # Reusable app components
├── hooks/                  # Custom hooks
│   ├── useAccounts.ts      # React Query hooks for accounts
│   ├── useBudgets.ts
│   └── ...
├── pages/                  # Page components (route targets)
│   ├── AccountsPage.tsx
│   ├── BudgetsPage.tsx
│   ├── BudgetDetailPage.tsx
│   ├── BudgetWizardPage.tsx
│   └── ...
├── lib/                    # Utilities
│   └── utils.ts            # cn() helper, formatters, etc.
├── App.tsx                 # Root component with router
├── main.tsx                # Entry point
└── index.css               # Tailwind imports
```

---

## Dependencies Summary

### Production
- `react`, `react-dom`
- `react-router-dom`
- `@tanstack/react-query`
- `react-hook-form`
- `@hookform/resolvers`
- `zod`
- `tailwindcss`
- Radix UI primitives (via shadcn/ui)
- `sonner` or `react-hot-toast` (for toasts)

### Development
- `typescript`
- `vite`
- `@types/react`, `@types/react-dom`
- `eslint`, `prettier` (recommended)

---

## Testing Strategy

*(To be defined in detail later)*

- **Unit tests:** Vitest for utility functions, hooks
- **Component tests:** React Testing Library
- **E2E tests:** Playwright (optional, for critical flows)

---

*Last updated: December 2024*
