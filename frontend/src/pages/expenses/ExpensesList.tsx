import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import type { Expense } from "@/types"

export default function ExpensesList() {
  const { groupId } = useParams<{ groupId: string }>()

  const { data } = useQuery({
    queryKey: ["expenses", groupId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/expenses`)
      return res.data.data
    },
    enabled: !!groupId,
  })

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link to={`/groups/${groupId}`} className="text-xl font-semibold">Shared Expenses</Link>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold mb-4">Expenses</h2>
        <div className="space-y-2">
          {data?.expenses?.map((expense: Expense) => (
            <Link key={expense.id} to={`/groups/${groupId}/expenses/${expense.id}`}>
              <Card className="hover:border-gray-400 transition-colors cursor-pointer py-3 px-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{expense.description}</p>
                  <p className="text-sm">{expense.amount} {expense.currency}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}