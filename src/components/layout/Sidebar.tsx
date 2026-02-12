import { NavLink } from 'react-router'
import { LayoutDashboard, Wallet, RefreshCw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/routes'

const navItems = [
  { label: 'Budgets', path: ROUTES.BUDGETS, icon: LayoutDashboard },
  { label: 'Accounts', path: ROUTES.ACCOUNTS, icon: Wallet },
  { label: 'Recurring', path: ROUTES.RECURRING_EXPENSES, icon: RefreshCw },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
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
          'fixed top-0 left-0 h-full w-64 bg-background z-50',
          'shadow-[1px_0_3px_oklch(0.2_0_0/0.04),0_0_1px_oklch(0.2_0_0/0.02)]',
          'transform transition-transform duration-200 ease-in-out',
          'lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <h1 className="text-xl font-semibold text-foreground">Balance</h1>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-accent lg:hidden"
            aria-label="Close menu"
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
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors duration-150',
                  isActive
                    ? 'text-foreground font-semibold'
                    : 'text-muted-foreground font-medium hover:bg-accent hover:text-foreground'
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
  )
}
