import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import type { Expense } from "@/types"

export default function ExpenseDetail() {
  const { groupId, expenseId } = useParams<{ groupId: string; expenseId: string }>()

  const { data: expense } = useQuery({
    queryKey: ["expense", expenseId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/expenses/${expenseId}`)
      return res.data.data as Expense
    },
    enabled: !!expenseId,
  })

  if (!expense) return null

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link to={`/groups/${groupId}`} className="text-xl font-semibold">Shared Expenses</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{expense.description}</CardTitle>
              <Link to={`/groups/${groupId}/expenses/${expenseId}/edit`}>
                <Button variant="secondary" size="sm">Edit</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Amount</span><p className="font-medium">{expense.amount} {expense.currency}</p></div>
              <div><span className="text-gray-500">Date</span><p className="font-medium">{expense.expense_date}</p></div>
              <div><span className="text-gray-500">Paid By</span><p className="font-medium">{expense.payer_name || expense.paid_by.slice(0, 8)}</p></div>
              <div><span className="text-gray-500">Split</span><p className="font-medium capitalize">{expense.split_type}</p></div>
            </div>
            {expense.participants && expense.participants.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Participants</p>
                <div className="space-y-1">
                  {expense.participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                      <span>{p.user_name || p.user_email}</span>
                      <span className="font-medium">{p.amount_owed} {expense.currency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {expense.notes && <div><p className="text-sm text-gray-500">Notes</p><p className="text-sm">{expense.notes}</p></div>}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}