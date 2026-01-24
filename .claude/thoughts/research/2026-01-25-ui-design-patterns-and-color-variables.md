---
date: 2026-01-25T14:30:00+01:00
researcher: Claude
git_commit: 1343e334f3dd95d94d1a2d2e69f7839e7e404cab
branch: feat/visual-redesign
repository: balance-frontend
topic: "UI Design Patterns and Color Variables Documentation"
tags: [research, design-system, ui-patterns, color-tokens, tailwind, shadcn-ui, components]
status: complete
last_updated: 2026-01-25
last_updated_by: Claude
---

# Research: UI Design Patterns and Color Variables

**Date**: 2026-01-25T14:30:00+01:00
**Researcher**: Claude
**Git Commit**: 1343e334f3dd95d94d1a2d2e69f7839e7e404cab
**Branch**: feat/visual-redesign
**Repository**: balance-frontend

## Research Question

What UI design patterns are present in this codebase, what color variables exist, and how are they being used across the app?

## Summary

The Balance frontend uses a comprehensive design system built on **Tailwind CSS v4** with **shadcn/ui** components (Radix UI primitives). The color system uses **OKLCH color space** with a **unified cream color palette** (hue 85) and semantic budget tokens for income/expense/savings. The codebase has **16 base UI components**, **60+ feature components**, and follows consistent patterns for layouts, responsive design, forms, and states. Recent work has introduced semantic color tokens (`text-income`, `text-expense`, `text-savings`), though some legacy hardcoded Tailwind colors remain in feature components.

---

## Detailed Findings

### 1. Color System Architecture

#### 1.1 CSS Variables (src/index.css)

The design system uses OKLCH color space for perceptual uniformity. All colors share **hue 85** (warm beige) with whisper-quiet lightness shifts.

**Surface Elevation Scale:**

| Token | OKLCH Value | Usage |
|-------|-------------|-------|
| `--background` | `oklch(0.965 0.015 85)` | Cream canvas - page background |
| `--card` | `oklch(0.980 0.012 85)` | Lifted cream - card surfaces |
| `--popover` | `oklch(0.985 0.010 85)` | Floating cream - dropdown menus |
| `--muted` | `oklch(0.950 0.018 85)` | Recessed cream - inset areas |
| `--accent` | `oklch(0.955 0.016 85)` | Hover states |
| `--secondary` | `oklch(0.960 0.015 85)` | Secondary surfaces |

**Foreground Colors:**

| Token | OKLCH Value | Usage |
|-------|-------------|-------|
| `--foreground` | `oklch(0.25 0.015 60)` | Warm near-black - primary text |
| `--muted-foreground` | `oklch(0.45 0.015 60)` | Warm medium gray - secondary text |
| `--secondary-foreground` | `oklch(0.30 0.015 60)` | Slightly lighter dark |

**Interactive Colors:**

| Token | OKLCH Value | Usage |
|-------|-------------|-------|
| `--primary` | `oklch(0.25 0.015 60)` | Warm dark primary |
| `--primary-foreground` | `oklch(0.98 0.010 85)` | Light text on primary |
| `--destructive` | `oklch(0.55 0.18 25)` | Warmed red |

**Border Colors:**

| Token | OKLCH Value | Usage |
|-------|-------------|-------|
| `--border` | `oklch(0.92 0.012 85)` | Default borders |
| `--input` | `oklch(0.94 0.010 85)` | Input borders (lighter) |
| `--ring` | `oklch(0.60 0.015 60)` | Focus ring |

#### 1.2 Semantic Budget Colors

Domain-specific tokens for financial data visualization:

| Token | OKLCH Value | Meaning |
|-------|-------------|---------|
| `--income` | `oklch(0.50 0.14 145)` | Green - money in |
| `--income-muted` | `oklch(0.94 0.04 145)` | Light green background |
| `--expense` | `oklch(0.50 0.16 25)` | Red - money out |
| `--expense-muted` | `oklch(0.94 0.04 25)` | Light red background |
| `--savings` | `oklch(0.50 0.14 250)` | Blue - money aside |
| `--savings-muted` | `oklch(0.94 0.04 250)` | Light blue background |
| `--balanced` | `oklch(0.50 0.14 145)` | Green - balanced state |
| `--balanced-muted` | `oklch(0.94 0.04 145)` | Light green background |

**Tailwind Usage:** `text-income`, `bg-income`, `bg-income-muted`, `text-expense`, `bg-expense`, `bg-expense-muted`, `text-savings`, `bg-savings`, `bg-savings-muted`, `text-balanced`, `bg-balanced-muted`

#### 1.3 Shadow Scale

Warm-tinted shadows using OKLCH for cohesion:

| Token | Value |
|-------|-------|
| `--shadow-xs` | `0 1px 2px oklch(0.25 0.02 60 / 0.05)` |
| `--shadow-sm` | `0 1px 3px oklch(0.25 0.02 60 / 0.07), 0 1px 2px oklch(0.25 0.02 60 / 0.04)` |
| `--shadow-md` | `0 4px 6px oklch(0.25 0.02 60 / 0.06), 0 2px 4px oklch(0.25 0.02 60 / 0.04)` |
| `--shadow-lg` | `0 10px 15px oklch(0.25 0.02 60 / 0.08), 0 4px 6px oklch(0.25 0.02 60 / 0.04)` |

---

### 2. Base UI Components (src/components/ui/)

16 shadcn/ui components following consistent patterns:

| Component | Description | Key Classes |
|-----------|-------------|-------------|
| `accordion.tsx` | Collapsible content sections | `animate-accordion-up/down` |
| `alert.tsx` | Non-interactive notification boxes | `default`, `destructive` variants |
| `alert-dialog.tsx` | Modal dialog for confirmations | `rounded-lg`, overlay 50% opacity |
| `badge.tsx` | Small pill-shaped labels | `rounded-full`, 4 variants |
| `button.tsx` | Primary interactive button | `rounded-xl`, 6 variants, 6 sizes |
| `card.tsx` | Container for content groups | `rounded-2xl shadow-sm` |
| `checkbox.tsx` | Checkbox input | `size-4 rounded` |
| `collapsible.tsx` | Simple collapsible section | `animate-collapsible-down/up` |
| `dialog.tsx` | Modal dialog for forms | `rounded-2xl shadow-lg` |
| `input.tsx` | Text input field | `rounded-xl h-9 shadow-xs` |
| `label.tsx` | Form label | `text-sm font-medium` |
| `progress.tsx` | Progress bar indicator | `bg-primary/20`, indicator `bg-primary` |
| `select.tsx` | Dropdown select menu | Supports `sm` and `default` sizes |
| `sheet.tsx` | Slide-in drawer panel | 4 sides (right default), 3/4 width mobile |
| `skeleton.tsx` | Loading placeholder | `bg-accent animate-pulse rounded-md` |
| `sonner.tsx` | Toast notifications | Custom icons per toast type |
| `table.tsx` | Table components | `hover:bg-muted/50` on rows |

**Common Patterns:**
- All use `data-slot="component-name"` attribute
- All use `cn()` utility for class merging
- Forward refs where needed
- Support `asChild` prop via Radix Slot

---

### 3. Feature Component Patterns

#### 3.1 Layout Components (src/components/layout/)

**AppLayout.tsx** - Root wrapper with responsive sidebar:
- Desktop (`lg:`): Sidebar fixed at 264px (`lg:pl-64`)
- Mobile: Collapsible drawer with backdrop
- Main content: `p-4 md:p-6 lg:p-8`

**Sidebar.tsx** - Navigation sidebar:
- Fixed position (`fixed top-0 left-0 h-full w-64`)
- Transform-based slide animation
- Nav items: `rounded-xl`, active uses `bg-sidebar-accent`

**Header.tsx** - Mobile-only sticky header:
- `sticky top-0 h-16 lg:hidden`
- Hamburger menu button

#### 3.2 Shared Components (src/components/shared/)

**PageHeader.tsx** - Reusable page header:
- Responsive flex: column on mobile, row on desktop
- Supports title, description (string or ReactNode), action button, back link

**LoadingState.tsx** - Three skeleton variants:
- `cards`: Grid of card skeletons
- `detail`: Stacked detail skeletons
- `table`: Table-like skeleton rows

**EmptyState.tsx** - Centered empty display:
- Icon (defaults to Inbox), title, description, optional action

**ErrorState.tsx** - Centered error display:
- AlertCircle icon, title, message, optional retry button

**ConfirmDialog.tsx** - Confirmation dialog wrapper:
- `default` and `destructive` variants
- Wraps AlertDialog with consistent styling

#### 3.3 Responsive Display Pattern

**Dual-View Pattern (Table + Cards):**
```tsx
{/* Desktop Table */}
<div className="hidden md:block bg-card rounded-2xl shadow-sm">
  <Table>...</Table>
</div>

{/* Mobile Cards */}
<div className="md:hidden space-y-3">
  {items.map(item => <Card key={item.id} ... />)}
</div>
```

Used in:
- `AccountsList.tsx`
- `RecurringExpensesList.tsx`

**Grid Pattern:**
- BudgetGrid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- BudgetSummary: `grid grid-cols-2 md:grid-cols-4 gap-4`

---

### 4. Color Usage Patterns

#### 4.1 Semantic Budget Colors in Action

**Budget Summaries (BudgetSummary.tsx, BudgetCard.tsx):**
```tsx
<p className="text-lg font-semibold text-income">{formatCurrency(totalIncome)}</p>
<p className="text-lg font-semibold text-expense">{formatCurrency(totalExpenses)}</p>
<p className="text-lg font-semibold text-savings">{formatCurrency(totalSavings)}</p>
```

**Conditional Balance Colors:**
```tsx
<p className={cn(
  'text-lg font-semibold',
  balance >= 0 ? 'text-income' : 'text-expense'
)}>
```

**Color Mapping Object (BudgetSection.tsx):**
```tsx
const colorClasses = {
  green: 'text-income',
  red: 'text-expense',
  blue: 'text-savings',
}
```

**Balance Utility Function (lib/utils.ts):**
```typescript
export function formatBalanceWithColor(balance: number): {
  text: string
  colorClass: string
  isBalanced: boolean
}
```

#### 4.2 Status Indicator Colors

**DueStatusIndicator.tsx:**
- Never used: `bg-yellow-500` (only hardcoded Tailwind color in app)
- Due now: `bg-expense text-expense`
- Not due: `bg-income text-income`

**SectionHeader.tsx (Wizard):**
- Complete: `bg-income-muted text-income`
- Current: `bg-savings-muted text-savings`
- Upcoming: `bg-muted text-muted-foreground`

#### 4.3 Base Token Usage

**Text Colors:**
- Primary text: `text-foreground`
- Secondary text: `text-muted-foreground`
- On primary backgrounds: `text-primary-foreground`

**Background Colors:**
- Page: `bg-background`
- Cards: `bg-card`
- Hover: `bg-accent`
- Inset areas: `bg-muted`

**Interactive States:**
- Hover on rows: `hover:bg-accent` or `hover:bg-muted/50`
- Button hover: `hover:bg-primary/90`
- Ghost hover: `hover:bg-accent hover:text-accent-foreground`
- Destructive hover: `hover:bg-destructive/90`

---

### 5. Animation Patterns

#### 5.1 Custom Animations (src/index.css)

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| `animate-pop-check` | 200ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Checkbox check mark |
| `animate-fade-in-subtle` | 250ms | `ease-out` | New items appearing |
| `animate-collapse-row` | 250ms + 250ms delay | `ease-out` | Copied item removal |
| `animate-collapsible-down` | 300ms | `cubic-bezier(0.32, 0.72, 0, 1)` | Collapsible expand |
| `animate-collapsible-up` | 300ms | `cubic-bezier(0.32, 0.72, 0, 1)` | Collapsible collapse |

#### 5.2 Animation Usage

**Copy Animation (StepIncome, StepExpenses, StepSavings):**
1. Item gets `bg-income-muted` background
2. Plus icon transforms to Check icon (`animate-pop-check`)
3. Row collapses after delay (`animate-collapse-row`)

**Hover Transitions:**
- `transition-colors` for color changes
- `transition-shadow` for card hover
- `transition-all duration-300` for progress bar

---

### 6. Spacing Conventions

| Spacing | Value | Usage |
|---------|-------|-------|
| `gap-1` / `space-y-1` | 4px | Tight - navigation items |
| `gap-2` / `space-y-2` | 8px | Small - within cards |
| `gap-3` / `space-y-3` | 12px | Medium - mobile card lists |
| `gap-4` / `space-y-4` | 16px | Default - grids, general spacing |
| `space-y-6` | 24px | Large - page sections |
| `p-4` | 16px | Card content padding |
| `mb-6` | 24px | PageHeader bottom margin |

---

### 7. Border Radius Scale

| Class | Pixels | Usage |
|-------|--------|-------|
| `rounded-2xl` | 16px | Cards, dialogs, major containers |
| `rounded-xl` | 12px | Buttons, inputs, small interactive elements |
| `rounded-lg` | 8px | Small buttons, some legacy tables |
| `rounded-full` | 50% | Circular indicators, badges |

---

### 8. Form Patterns

**Form Libraries:**
- React Hook Form for form state
- Zod for validation schemas
- Custom schemas in `./schemas.ts` files

**Modal-Based Editing:**
- All create/edit operations use modals
- No inline editing except wizard table inputs
- Explicit save (no autosave except todo checkboxes)

**Form Layout:**
```tsx
<form className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="field">Field Name</Label>
    <Input id="field" {...register('field')} />
    {errors.field && <p className="text-sm text-destructive">{errors.field.message}</p>}
  </div>
</form>
```

---

### 9. State Management Patterns

**Server State (TanStack Query):**
- `useAccounts`, `useBudgets`, `useRecurringExpenses`
- Mutations with optimistic updates for todo items
- Infinite scroll with `useInfiniteQuery` for balance history

**UI State (React):**
- `useState` for local component state
- Modal open/close states
- Sidebar open state

**Wizard State (Context + Reducer):**
- `WizardContext` provides state and validation
- `wizardReducer` for complex state updates
- Step validation functions

---

## Architecture Documentation

### File Structure

```
src/
├── index.css                   # CSS variables, animations, base styles
├── lib/
│   └── utils.ts                # cn() utility, formatters, color helpers
├── components/
│   ├── ui/                     # 16 shadcn/ui components
│   ├── layout/                 # AppLayout, Sidebar, Header
│   ├── shared/                 # PageHeader, LoadingState, etc.
│   ├── accounts/               # Account CRUD components
│   ├── recurring-expenses/     # Recurring expense components
│   ├── budgets/                # Budget list components
│   ├── budget-detail/          # Budget detail view
│   ├── todo/                   # Todo list components
│   └── wizard/                 # Budget creation wizard
│       ├── steps/              # 5 wizard step components
│       └── WizardContext.tsx   # Wizard state management
└── pages/                      # Route page components
```

### Token Inheritance Pattern

1. CSS variables in `:root` define raw OKLCH colors
2. `@theme inline` block maps CSS variables to `--color-*` namespace
3. Base UI components (Card, Button, Dialog) apply tokens
4. Feature components inherit from base or apply tokens directly

---

## Historical Context (from thoughts/)

Recent design system work documented in:

- **2026-01-23-design-system-adoption-audit.md**: Identified 78+ hardcoded gray text colors, 89+ hardcoded semantic colors, and 3 tables with legacy border patterns still needing migration.

- **2026-01-23 plans/design-system-full-adoption.md**: Comprehensive plan for adopting semantic color tokens across all feature components.

- **2026-01-20-visual-redesign-audit.md**: Broader visual redesign covering wizard, budget details, and todo list improvements.

The semantic budget tokens (`--income`, `--expense`, `--savings`, `--balanced`) with Tailwind classes (`text-income`, `bg-income-muted`, etc.) were added as part of the `feat/visual-redesign` branch. Adoption is in progress.

---

## Related Research

- `.claude/thoughts/research/2026-01-23-design-system-adoption-audit.md` - Detailed audit of design token adoption
- `.claude/thoughts/research/2026-01-20-visual-redesign-audit.md` - Visual redesign scope and findings
- `.claude/thoughts/plans/2026-01-23-design-system-full-adoption.md` - Implementation plan for full token adoption

---

## Code References

### Color System
- `src/index.css:78-143` - All CSS custom properties
- `src/index.css:61-69` - Semantic budget color tokens
- `src/index.css:138-142` - Shadow scale definitions

### UI Components
- `src/components/ui/card.tsx:10` - Card with `rounded-2xl shadow-sm`
- `src/components/ui/button.tsx:7-37` - Button variants with CVA
- `src/components/ui/dialog.tsx:47-80` - Dialog content styling

### Layout
- `src/components/layout/AppLayout.tsx:6-22` - Root layout structure
- `src/components/layout/Sidebar.tsx:17-74` - Sidebar navigation

### Color Usage
- `src/components/budget-detail/BudgetSummary.tsx:19-43` - Semantic color usage
- `src/components/budget-detail/BudgetSection.tsx:44-48` - Color mapping object
- `src/lib/utils.ts:96-110` - Balance color utility function

### Animations
- `src/index.css:188-263` - Custom animation keyframes
- `src/components/wizard/steps/StepIncome.tsx:277` - Copy animation usage

---

## Open Questions

1. **Legacy Hardcoded Colors**: ~78 instances of `text-gray-*` and ~89 instances of hardcoded semantic colors (green/red/blue/yellow) remain in feature components. Full adoption plan exists but is not complete.

2. **Yellow Status Color**: `DueStatusIndicator.tsx` uses `bg-yellow-500` for "never used" state - only place using direct Tailwind color. Should a `--warning` semantic token be added?

3. **Table Border Pattern**: Three wizard step tables use `border rounded-lg` instead of the design system's `bg-card rounded-2xl shadow-sm`. Noted in adoption audit.
