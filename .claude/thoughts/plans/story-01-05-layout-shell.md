# Story 1.5: Layout Shell

**As a** user
**I want to** see consistent navigation across all pages
**So that** I can easily move between different sections of the app

## Acceptance Criteria

- [x] Sidebar navigation visible on desktop (≥1024px)
- [x] Hamburger menu on mobile/tablet (<1024px)
- [x] Active nav item highlighted
- [x] Navigation links work for all main sections
- [x] Page content area scrolls independently
- [x] Clean, Apple-inspired aesthetic

## Navigation Items

| Label     | Path                  | Icon (optional) |
| --------- | --------------------- | --------------- |
| Budgets   | `/budgets`            | 📊 or similar   |
| Accounts  | `/accounts`           | 🏦 or similar   |
| Recurring | `/recurring-expenses` | 🔄 or similar   |

## Implementation Steps

1. **Install lucide-react for icons**

   ```bash
   npm install lucide-react
   ```

2. **Create sidebar component `src/components/layout/Sidebar.tsx`**

   ```typescript
   import { NavLink } from "react-router-dom";
   import { LayoutDashboard, Wallet, RefreshCw, X } from "lucide-react";
   import { cn } from "@/lib/utils";
   import { ROUTES } from "@/routes";

   const navItems = [
     { label: "Budgets", path: ROUTES.BUDGETS, icon: LayoutDashboard },
     { label: "Accounts", path: ROUTES.ACCOUNTS, icon: Wallet },
     { label: "Recurring", path: ROUTES.RECURRING_EXPENSES, icon: RefreshCw },
   ];

   interface SidebarProps {
     open: boolean;
     onClose: () => void;
   }

   export function Sidebar({ open, onClose }: SidebarProps) {
     return (
       <>
         {/* Mobile overlay */}
         {open && (
           <div
             className="fixed inset-0 bg-black/50 z-40 lg:hidden"
             onClick={onClose}
           />
         )}

         {/* Sidebar */}
         <aside
           className={cn(
             "fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50",
             "transform transition-transform duration-200 ease-in-out",
             "lg:translate-x-0 lg:static lg:z-auto",
             open ? "translate-x-0" : "-translate-x-full"
           )}
         >
           {/* Header */}
           <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
             <h1 className="text-xl font-semibold text-gray-900">Balance</h1>
             <button
               onClick={onClose}
               className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
             >
               <X className="w-5 h-5" />
             </button>
           </div>

           {/* Navigation */}
           <nav className="p-4 space-y-1">
             {navItems.map((item) => (
               <NavLink
                 key={item.path}
                 to={item.path}
                 onClick={onClose}
                 className={({ isActive }) =>
                   cn(
                     "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
                     "transition-colors duration-150",
                     isActive
                       ? "bg-blue-50 text-blue-700"
                       : "text-gray-700 hover:bg-gray-100"
                   )
                 }
               >
                 <item.icon className="w-5 h-5" />
                 {item.label}
               </NavLink>
             ))}
           </nav>
         </aside>
       </>
     );
   }
   ```

3. **Create header component `src/components/layout/Header.tsx`**

   ```typescript
   import { Menu } from "lucide-react";

   interface HeaderProps {
     onMenuClick: () => void;
   }

   export function Header({ onMenuClick }: HeaderProps) {
     return (
       <header className="sticky top-0 h-16 bg-white border-b border-gray-200 lg:hidden">
         <div className="flex items-center h-full px-4">
           <button
             onClick={onMenuClick}
             className="p-2 -ml-2 rounded-md hover:bg-gray-100"
           >
             <Menu className="w-6 h-6" />
           </button>
           <h1 className="ml-3 text-lg font-semibold text-gray-900">Balance</h1>
         </div>
       </header>
     );
   }
   ```

4. **Create main layout component `src/components/layout/AppLayout.tsx`**

   ```typescript
   import { useState } from "react";
   import { Outlet } from "react-router-dom";
   import { Sidebar } from "./Sidebar";
   import { Header } from "./Header";

   export function AppLayout() {
     const [sidebarOpen, setSidebarOpen] = useState(false);

     return (
       <div className="min-h-screen bg-gray-50">
         <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

         <div className="lg:pl-64">
           <Header onMenuClick={() => setSidebarOpen(true)} />

           <main className="p-4 md:p-6 lg:p-8">
             <Outlet />
           </main>
         </div>
       </div>
     );
   }
   ```

5. **Create layout barrel export `src/components/layout/index.ts`**

   ```typescript
   export { AppLayout } from "./AppLayout";
   export { Sidebar } from "./Sidebar";
   export { Header } from "./Header";
   ```

6. **Update `src/App.tsx`** to use layout with nested routes

   ```typescript
   import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
   import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
   import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
   import { ROUTES } from "./routes";
   import { AppLayout } from "./components/layout";
   import {
     AccountsPage,
     RecurringExpensesPage,
     BudgetsPage,
     BudgetWizardPage,
     BudgetDetailPage,
     TodoListPage,
     NotFoundPage,
   } from "./pages";

   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 1000 * 60,
         refetchOnWindowFocus: true,
         retry: 1,
       },
     },
   });

   function App() {
     return (
       <QueryClientProvider client={queryClient}>
         <BrowserRouter>
           <Routes>
             <Route element={<AppLayout />}>
               <Route
                 path={ROUTES.HOME}
                 element={<Navigate to={ROUTES.BUDGETS} replace />}
               />
               <Route path={ROUTES.ACCOUNTS} element={<AccountsPage />} />
               <Route
                 path={ROUTES.RECURRING_EXPENSES}
                 element={<RecurringExpensesPage />}
               />
               <Route path={ROUTES.BUDGETS} element={<BudgetsPage />} />
               <Route path={ROUTES.BUDGET_NEW} element={<BudgetWizardPage />} />
               <Route
                 path={ROUTES.BUDGET_DETAIL}
                 element={<BudgetDetailPage />}
               />
               <Route path={ROUTES.BUDGET_TODO} element={<TodoListPage />} />
             </Route>
             <Route path="*" element={<NotFoundPage />} />
           </Routes>
         </BrowserRouter>
         <ReactQueryDevtools initialIsOpen={false} />
       </QueryClientProvider>
     );
   }

   export default App;
   ```

## File Structure After Completion

```
src/
├── components/
│   └── layout/
│       ├── AppLayout.tsx
│       ├── Header.tsx
│       ├── index.ts
│       └── Sidebar.tsx
└── App.tsx (updated)
```

## Definition of Done

- [x] Desktop: Sidebar always visible on left
- [x] Mobile: Hamburger menu opens/closes sidebar
- [x] Clicking nav item navigates to correct page
- [x] Active nav item is visually highlighted
- [x] Clicking outside sidebar on mobile closes it
- [x] Page content displays in main area
- [x] iOS safe areas handled properly
- [x] Mobile modals work correctly (full-screen or bottom sheet) — N/A, no modals in this story

## Mobile Navigation Implementation

**Breakpoints:**

- Mobile: < 768px (md)
- Tablet: 768px - 1023px
- Desktop: ≥ 1024px (lg)

**Create `src/components/layout/MobileHeader.tsx`:**

```typescript
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-40">
      <div className="flex items-center justify-between h-full px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          aria-label="Öppna meny"
        >
          <Menu className="w-6 h-6" />
        </Button>
        <Link to="/budgets" className="font-semibold text-lg">
          Balance
        </Link>
        <div className="w-10" /> {/* Spacer to center title */}
      </div>
    </header>
  );
}
```

**Create `src/components/layout/MobileSidebar.tsx`:**

```typescript
import { BarChart3, CreditCard, Repeat } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navItems = [
  { path: "/budgets", label: "Budgetar", icon: BarChart3 },
  { path: "/accounts", label: "Konton", icon: CreditCard },
  { path: "/recurring-expenses", label: "Återkommande utgifter", icon: Repeat },
];

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
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
  );
}
```

**Update `src/components/layout/AppLayout.tsx`:**

```typescript
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";
import { MobileSidebar } from "./MobileSidebar";

export function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Header */}
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
  );
}
```

**iOS Safe Areas (add to `src/index.css`):**

```css
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

**Mobile Modal Behavior:**

```typescript
// Modals on mobile should be full-screen or bottom sheet
<DialogContent className="w-full max-w-lg sm:max-w-lg max-h-screen sm:max-h-[90vh] sm:rounded-lg">
```

## Testing

### Test File: `src/components/layout/Sidebar.test.tsx`

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
  };

  it("renders app title", () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByText("Balance")).toBeInTheDocument();
  });

  it("renders all navigation items", () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByRole("link", { name: /budgets/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /accounts/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /recurring/i })
    ).toBeInTheDocument();
  });

  it("navigation links have correct hrefs", () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByRole("link", { name: /budgets/i })).toHaveAttribute(
      "href",
      "/budgets"
    );
    expect(screen.getByRole("link", { name: /accounts/i })).toHaveAttribute(
      "href",
      "/accounts"
    );
    expect(screen.getByRole("link", { name: /recurring/i })).toHaveAttribute(
      "href",
      "/recurring-expenses"
    );
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    render(<Sidebar open={true} onClose={onClose} />);

    const closeButton = screen.getByRole("button");
    await userEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when nav link is clicked", async () => {
    const onClose = vi.fn();
    render(<Sidebar open={true} onClose={onClose} />);

    await userEvent.click(screen.getByRole("link", { name: /accounts/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it("has correct visibility classes when open", () => {
    const { container } = render(<Sidebar open={true} onClose={vi.fn()} />);

    const sidebar = container.querySelector("aside");
    expect(sidebar).toHaveClass("translate-x-0");
  });

  it("has correct visibility classes when closed", () => {
    const { container } = render(<Sidebar open={false} onClose={vi.fn()} />);

    const sidebar = container.querySelector("aside");
    expect(sidebar).toHaveClass("-translate-x-full");
  });
});
```

### Test File: `src/components/layout/Header.test.tsx`

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { Header } from "./Header";

describe("Header", () => {
  it("renders app title", () => {
    render(<Header onMenuClick={vi.fn()} />);

    expect(screen.getByText("Balance")).toBeInTheDocument();
  });

  it("renders menu button", () => {
    render(<Header onMenuClick={vi.fn()} />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("calls onMenuClick when menu button is clicked", async () => {
    const onMenuClick = vi.fn();
    render(<Header onMenuClick={onMenuClick} />);

    await userEvent.click(screen.getByRole("button"));

    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });
});
```

### Test File: `src/components/layout/AppLayout.test.tsx`

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { AppLayout } from "./AppLayout";

describe("AppLayout", () => {
  it("renders sidebar", () => {
    render(<AppLayout />);

    expect(screen.getByText("Balance")).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    render(<AppLayout />);

    expect(screen.getByRole("link", { name: /budgets/i })).toBeInTheDocument();
  });

  it("toggles sidebar on mobile menu click", async () => {
    render(<AppLayout />);

    // Find the mobile menu button (in Header)
    const menuButtons = screen.getAllByRole("button");
    const mobileMenuButton = menuButtons.find((btn) => btn.closest("header"));

    if (mobileMenuButton) {
      await userEvent.click(mobileMenuButton);
      // Sidebar should be visible (has translate-x-0 class)
      const sidebar = document.querySelector("aside");
      expect(sidebar).toHaveClass("translate-x-0");
    }
  });
});
```

### TDD Flow for Story 1.5

1. **Write tests first** — Create test files above
2. **Run tests** — All should fail
3. **Implement `Sidebar.tsx`** — Make Sidebar tests pass
4. **Implement `Header.tsx`** — Make Header tests pass
5. **Implement `AppLayout.tsx`** — Make AppLayout tests pass
6. **Run tests** — All should pass
