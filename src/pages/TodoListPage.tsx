import { useParams } from 'react-router'

export function TodoListPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Todo List</h1>
      <p className="text-gray-500">Todo list for budget: {id}</p>
    </div>
  )
}
