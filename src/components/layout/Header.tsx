import { Menu } from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 h-16 bg-card border-b border-border lg:hidden">
      <div className="flex items-center h-full px-4">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-xl hover:bg-accent"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="ml-3 text-lg font-semibold text-foreground">Balance</h1>
      </div>
    </header>
  )
}
