# Story 1.6: Shared UI Components

**As a** developer
**I want to** have reusable UI components
**So that** I can build consistent interfaces quickly

## Acceptance Criteria

- [x] shadcn/ui initialized and configured
- [x] Core shadcn components installed (Button, Dialog, Sheet, Input, Select, etc.)
- [x] Custom app components created: PageHeader, LoadingState, ErrorState, EmptyState, ConfirmDialog
- [x] Sonner toast library configured

## Implementation Steps

1. **Initialize shadcn/ui**
   ```bash
   npx shadcn@latest init
   ```

   When prompted, select:
   - Style: Default
   - Base color: Slate
   - CSS variables: Yes

2. **Install required shadcn components**
   ```bash
   npx shadcn@latest add button
   npx shadcn@latest add dialog
   npx shadcn@latest add sheet
   npx shadcn@latest add input
   npx shadcn@latest add label
   npx shadcn@latest add select
   npx shadcn@latest add checkbox
   npx shadcn@latest add card
   npx shadcn@latest add accordion
   npx shadcn@latest add skeleton
   npx shadcn@latest add table
   npx shadcn@latest add badge
   npx shadcn@latest add sonner
   ```

3. **Create PageHeader component `src/components/shared/PageHeader.tsx`**
   ```typescript
   import { ReactNode } from 'react'

   interface PageHeaderProps {
     title: string
     description?: string
     action?: ReactNode
   }

   export function PageHeader({ title, description, action }: PageHeaderProps) {
     return (
       <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-6">
         <div>
           <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
           {description && (
             <p className="text-sm text-gray-500 mt-1">{description}</p>
           )}
         </div>
         {action && <div className="mt-4 sm:mt-0">{action}</div>}
       </div>
     )
   }
   ```

4. **Create LoadingState component `src/components/shared/LoadingState.tsx`**
   ```typescript
   import { Skeleton } from '@/components/ui/skeleton'

   interface LoadingStateProps {
     /** Number of skeleton rows to show */
     rows?: number
     /** Type of loading state */
     variant?: 'table' | 'cards' | 'detail'
   }

   export function LoadingState({ rows = 3, variant = 'table' }: LoadingStateProps) {
     if (variant === 'cards') {
       return (
         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
           {Array.from({ length: rows }).map((_, i) => (
             <div key={i} className="p-4 bg-white rounded-lg border border-gray-200">
               <Skeleton className="h-5 w-24 mb-2" />
               <Skeleton className="h-4 w-16 mb-4" />
               <Skeleton className="h-4 w-32" />
               <Skeleton className="h-4 w-28 mt-1" />
               <Skeleton className="h-4 w-24 mt-1" />
             </div>
           ))}
         </div>
       )
     }

     if (variant === 'detail') {
       return (
         <div className="space-y-6">
           <Skeleton className="h-8 w-48" />
           <div className="space-y-4">
             {Array.from({ length: rows }).map((_, i) => (
               <div key={i} className="p-4 bg-white rounded-lg border border-gray-200">
                 <Skeleton className="h-5 w-32 mb-3" />
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-3/4 mt-2" />
               </div>
             ))}
           </div>
         </div>
       )
     }

     // Default: table variant
     return (
       <div className="bg-white rounded-lg border border-gray-200">
         <div className="p-4 border-b border-gray-200">
           <Skeleton className="h-5 w-32" />
         </div>
         {Array.from({ length: rows }).map((_, i) => (
           <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-b-0">
             <Skeleton className="h-4 w-24" />
             <Skeleton className="h-4 w-32" />
             <Skeleton className="h-4 w-20 ml-auto" />
           </div>
         ))}
       </div>
     )
   }
   ```

5. **Create ErrorState component `src/components/shared/ErrorState.tsx`**
   ```typescript
   import { AlertCircle } from 'lucide-react'
   import { Button } from '@/components/ui/button'

   interface ErrorStateProps {
     title?: string
     message?: string
     onRetry?: () => void
   }

   export function ErrorState({
     title = 'Something went wrong',
     message = 'An error occurred while loading. Please try again.',
     onRetry,
   }: ErrorStateProps) {
     return (
       <div className="flex flex-col items-center justify-center py-12 text-center">
         <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
         <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
         <p className="text-sm text-gray-500 mb-4 max-w-sm">{message}</p>
         {onRetry && (
           <Button onClick={onRetry} variant="outline">
             Try again
           </Button>
         )}
       </div>
     )
   }
   ```

6. **Create EmptyState component `src/components/shared/EmptyState.tsx`**
   ```typescript
   import { ReactNode } from 'react'
   import { Inbox } from 'lucide-react'

   interface EmptyStateProps {
     icon?: ReactNode
     title: string
     description: string
     action?: ReactNode
   }

   export function EmptyState({
     icon,
     title,
     description,
     action,
   }: EmptyStateProps) {
     return (
       <div className="flex flex-col items-center justify-center py-12 text-center">
         <div className="mb-4 text-gray-400">
           {icon || <Inbox className="w-12 h-12" />}
         </div>
         <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
         <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>
         {action}
       </div>
     )
   }
   ```

7. **Create ConfirmDialog component `src/components/shared/ConfirmDialog.tsx`**
   ```typescript
   import {
     AlertDialog,
     AlertDialogAction,
     AlertDialogCancel,
     AlertDialogContent,
     AlertDialogDescription,
     AlertDialogFooter,
     AlertDialogHeader,
     AlertDialogTitle,
   } from '@/components/ui/alert-dialog'

   interface ConfirmDialogProps {
     open: boolean
     onOpenChange: (open: boolean) => void
     title: string
     description: string
     confirmLabel?: string
     cancelLabel?: string
     variant?: 'default' | 'destructive'
     onConfirm: () => void
     loading?: boolean
   }

   export function ConfirmDialog({
     open,
     onOpenChange,
     title,
     description,
     confirmLabel = 'Confirm',
     cancelLabel = 'Cancel',
     variant = 'default',
     onConfirm,
     loading = false,
   }: ConfirmDialogProps) {
     return (
       <AlertDialog open={open} onOpenChange={onOpenChange}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>{title}</AlertDialogTitle>
             <AlertDialogDescription>{description}</AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
             <AlertDialogAction
               onClick={onConfirm}
               disabled={loading}
               className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
             >
               {loading ? 'Loading...' : confirmLabel}
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     )
   }
   ```

   Note: Also need to install alert-dialog:
   ```bash
   npx shadcn@latest add alert-dialog
   ```

8. **Create shared components barrel export `src/components/shared/index.ts`**
   ```typescript
   export { PageHeader } from './PageHeader'
   export { LoadingState } from './LoadingState'
   export { ErrorState } from './ErrorState'
   export { EmptyState } from './EmptyState'
   export { ConfirmDialog } from './ConfirmDialog'
   ```

9. **Add Toaster to App.tsx**
   ```typescript
   import { Toaster } from '@/components/ui/sonner'

   // Inside App component, after Routes:
   <Toaster position="top-right" />
   ```

## File Structure After Completion

```
src/
├── components/
│   ├── layout/
│   │   └── ...
│   ├── shared/
│   │   ├── ConfirmDialog.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorState.tsx
│   │   ├── index.ts
│   │   ├── LoadingState.tsx
│   │   └── PageHeader.tsx
│   └── ui/
│       ├── accordion.tsx
│       ├── alert-dialog.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── sheet.tsx
│       ├── skeleton.tsx
│       ├── sonner.tsx
│       └── table.tsx
└── App.tsx (updated with Toaster)
```

## Definition of Done

- [x] All shadcn components installed without errors
- [x] PageHeader renders title and optional action button
- [x] LoadingState shows skeleton UI
- [x] ErrorState shows error message with retry button
- [x] EmptyState shows message with CTA
- [x] ConfirmDialog opens and closes properly
- [x] Toast notifications work (`toast.success('Test')` shows toast)

## Testing

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
