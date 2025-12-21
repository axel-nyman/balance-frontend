import { useParams } from 'react-router'

export function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Budget Detail</h1>
      <p className="text-gray-500">Viewing budget: {id}</p>
    </div>
  )
}
