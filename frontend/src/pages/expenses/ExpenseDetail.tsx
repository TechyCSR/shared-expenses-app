import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import type { Expense } from "@/types"
import { useClerk, useUser } from "@clerk/clerk-react"

export default function ExpenseDetail() {
  const { groupId, expenseId } = useParams<{ groupId: string; expenseId: string }>()
  const { user } = useUser()
  const { signOut } = useClerk()

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
    <div className="min-h-screen bg-black">
      <header className="border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={`/groups/${groupId}`} className="text-xl font-semibold text-white">Shared Expenses</Link>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <img src={user.imageUrl} alt={user.fullName || "User"} className="w-8 h-8 rounded-full" />
                <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-gray-400 hover:text-white">
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <Card className="bg-[#0a0a0a] border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">{expense.description}</CardTitle>
              <Link to={`/groups/${groupId}/expenses/${expenseId}/edit`}>
                <Button variant="secondary" size="sm">Edit</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-400">Amount</span><p className="font-medium text-white">{expense.amount} {expense.currency}</p></div>
              <div><span className="text-gray-400">Date</span><p className="font-medium text-white">{expense.expense_date}</p></div>
              <div><span className="text-gray-400">Paid By</span><p className="font-medium text-white">{expense.payer_name || expense.paid_by.slice(0, 8)}</p></div>
              <div><span className="text-gray-400">Split</span><p className="font-medium text-white capitalize">{expense.split_type}</p></div>
            </div>
            {expense.participants && expense.participants.length > 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-2">Participants</p>
                <div className="space-y-1">
                  {expense.participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-800 last:border-0">
                      <span className="text-gray-300">{p.user_name || p.user_email}</span>
                      <span className="font-medium text-white">{p.amount_owed} {expense.currency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {expense.notes && <div><p className="text-sm text-gray-400">Notes</p><p className="text-sm text-gray-300">{expense.notes}</p></div>}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}