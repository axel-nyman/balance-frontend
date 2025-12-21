import { Menu } from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 h-16 bg-white border-b border-gray-200 lg:hidden">
      <div className="flex items-center h-full px-4">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-md hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="ml-3 text-lg font-semibold text-gray-900">Balance</h1>
      </div>
    </header>
  )
}
