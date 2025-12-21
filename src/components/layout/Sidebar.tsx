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
          'fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50',
          'transform transition-transform duration-200 ease-in-out',
          'lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Balance</h1>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
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
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                  'transition-colors duration-150',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
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
