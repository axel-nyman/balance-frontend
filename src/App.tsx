import { cn } from '@/lib/utils'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className={cn('text-4xl font-bold text-blue-600', 'mb-4')}>
          Balance
        </h1>
        <p className="text-gray-600">
          Personal budgeting for couples
        </p>
      </div>
    </div>
  )
}

export default App
