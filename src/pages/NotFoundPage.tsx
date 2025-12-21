import { Link } from 'react-router'
import { ROUTES } from '../routes'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="mt-2 text-gray-500">Page not found</p>
      <Link
        to={ROUTES.BUDGETS}
        className="mt-4 text-blue-600 hover:underline"
      >
        Go to Budgets
      </Link>
    </div>
  )
}
