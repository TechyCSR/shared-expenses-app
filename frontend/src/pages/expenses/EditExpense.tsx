import { useParams, Link, useNavigate } from "react-router-dom"

export default function EditExpense() {
  const { groupId, expenseId } = useParams()
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-xl font-semibold mb-4">Edit Expense</h1>
      <p className="text-sm text-gray-500">Edit page for expense {expenseId}</p>
      <button onClick={() => navigate(`/groups/${groupId}/expenses/${expenseId}`)} className="text-sm underline mt-4">Back</button>
    </div>
  )
}