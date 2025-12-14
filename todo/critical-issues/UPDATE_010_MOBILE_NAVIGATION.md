# Update #010: Add Mobile Navigation Details

**Purpose:** Document mobile navigation patterns for implementation clarity  
**Files Affected:** `FRONTEND_STORIES_EPIC1.md` (Story 1.5 - Layout)  
**Priority:** Low (refinement for junior engineers)

---

## Current State

Epic 1 Story 1.5 mentions:
> - Desktop: Persistent sidebar
> - Mobile: Header with hamburger menu

But doesn't detail the mobile interaction patterns.

---

## Mobile Navigation Specification

### 1. Breakpoint Definition

```typescript
// Use Tailwind's default breakpoints
// Mobile: < 768px (md)
// Tablet: 768px - 1023px
// Desktop: ≥ 1024px (lg)

const MOBILE_BREAKPOINT = 768 // md
```

---

### 2. Header Component (Mobile)

**When viewport < 768px, show mobile header:**

```
┌─────────────────────────────────────┐
│  ☰   Balance                  [?]   │
└─────────────────────────────────────┘
```

**Elements:**
| Element | Position | Action |
|---------|----------|--------|
| Hamburger (☰) | Left | Opens sidebar drawer |
| Logo/Title | Center | Links to /budgets |
| Help (optional) | Right | Future: help/settings |

**Implementation:**

```typescript
// src/components/layout/MobileHeader.tsx

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

interface MobileHeaderProps {
  onMenuClick: () => void
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-40">
      <div className="flex items-center justify-between h-full px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </Button>

        <Link to="/budgets" className="font-semibold text-lg">
          Balance
        </Link>

        {/* Placeholder for right side - keeps title centered */}
        <div className="w-10" />
      </div>
    </header>
  )
}
```

---

### 3. Mobile Sidebar Drawer

**When hamburger is clicked, open sidebar as drawer:**

```
┌─────────────────────────────────────┐
│  Balance                       [X]  │  ← Drawer header with close
│  ───────────────────────────────    │
│                                     │
│  📊 Budgets                         │
│  💳 Accounts                        │
│  🔄 Recurring Expenses              │
│                                     │
│                                     │
│                                     │
│                                     │
│  ───────────────────────────────    │
│  v1.0.0                             │  ← Optional: version
└─────────────────────────────────────┘
```

**Implementation:**

```typescript
// src/components/layout/MobileSidebar.tsx

import { X, BarChart3, CreditCard, Repeat } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MobileSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const navItems = [
  { path: '/budgets', label: 'Budgets', icon: BarChart3 },
  { path: '/accounts', label: 'Accounts', icon: CreditCard },
  { path: '/recurring-expenses', label: 'Recurring Expenses', icon: Repeat },
]

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-left">Balance</SheetTitle>
        </SheetHeader>

        <nav className="p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onOpenChange(false)} // Close on navigation
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
```

---

### 4. Updated AppLayout

**Combine desktop and mobile layouts:**

```typescript
// src/components/layout/AppLayout.tsx

import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileHeader } from './MobileHeader'
import { MobileSidebar } from './MobileSidebar'

export function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Header - hidden on desktop */}
      <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

      {/* Mobile Sidebar Drawer */}
      <MobileSidebar
        open={isMobileMenuOpen}
        onOpenChange={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <main className="lg:ml-64 pt-14 lg:pt-0">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
```

---

### 5. Touch Interactions

**Swipe to open sidebar (optional enhancement):**

```typescript
// Using a touch event hook or library like @use-gesture/react

import { useSwipeable } from 'react-swipeable'

function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const swipeHandlers = useSwipeable({
    onSwipedRight: () => setIsMobileMenuOpen(true),
    onSwipedLeft: () => setIsMobileMenuOpen(false),
    trackMouse: false,
    delta: 50, // Minimum swipe distance
  })

  return (
    <div {...swipeHandlers} className="min-h-screen bg-gray-50">
      {/* ... */}
    </div>
  )
}
```

**Note:** This is optional. Basic hamburger menu is sufficient for MVP.

---

### 6. Mobile Modal Behavior

**Modals on mobile should be full-screen:**

```typescript
// Update Dialog/Sheet components or use responsive classes

// In dialog content:
<DialogContent className="w-full max-w-lg sm:max-w-lg max-h-screen sm:max-h-[90vh] sm:rounded-lg">
```

**Or use dedicated mobile modal pattern:**

```typescript
function ResponsiveModal({ children, ...props }) {
  const isMobile = useMediaQuery('(max-width: 640px)')

  if (isMobile) {
    return (
      <Sheet {...props}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-xl">
          {children}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog {...props}>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  )
}
```

---

### 7. Safe Areas (iOS)

**Handle iPhone notch and home indicator:**

```css
/* Add to index.css */
@supports (padding-top: env(safe-area-inset-top)) {
  .mobile-header {
    padding-top: env(safe-area-inset-top);
    height: calc(3.5rem + env(safe-area-inset-top));
  }

  .mobile-sidebar {
    padding-bottom: env(safe-area-inset-bottom);
  }

  .mobile-content {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

---

### 8. Navigation Active State

**Clear indication of current page:**

```typescript
// Active nav item styling
const activeClass = 'bg-blue-50 text-blue-700 font-semibold'
const inactiveClass = 'text-gray-600 hover:bg-gray-50'
```

**Mobile:**
```
┌─────────────────────────────────────┐
│  Balance                       [X]  │
│  ───────────────────────────────    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 📊 Budgets            ←     │    │  ← Active indicator
│  └─────────────────────────────┘    │
│  💳 Accounts                        │
│  🔄 Recurring Expenses              │
│                                     │
└─────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/layout/MobileHeader.tsx` | Create |
| `src/components/layout/MobileSidebar.tsx` | Create |
| `src/components/layout/AppLayout.tsx` | Update with mobile support |
| `src/index.css` | Add safe area styles |
| Tests | Add responsive tests |

---

## Testing Considerations

```typescript
describe('Mobile Navigation', () => {
  beforeEach(() => {
    // Set viewport to mobile
    window.innerWidth = 375
    window.innerHeight = 667
  })

  it('shows hamburger menu on mobile', () => {
    render(<AppLayout />)
    expect(screen.getByLabelText(/open menu/i)).toBeInTheDocument()
  })

  it('opens sidebar when hamburger clicked', async () => {
    render(<AppLayout />)
    await userEvent.click(screen.getByLabelText(/open menu/i))
    expect(screen.getByRole('navigation')).toBeVisible()
  })

  it('closes sidebar on navigation', async () => {
    render(<AppLayout />)
    await userEvent.click(screen.getByLabelText(/open menu/i))
    await userEvent.click(screen.getByText(/accounts/i))
    // Sidebar should close
  })
})
```

---

*Created: [Current Date]*
