import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Layout from "@/components/Layout"
import Loading from "@/components/ui/Loading"
import type { Expense } from "@/types"
import { formatAmount } from "@/utils/format"

export default function ExpenseDetail() {
  const { groupId, expenseId } = useParams<{ groupId: string; expenseId: string }>()

  const { data: expense, isLoading } = useQuery({
    queryKey: ["expense", expenseId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/expenses/${expenseId}`)
      return res.data.data as Expense
    },
    enabled: !!expenseId,
  })

  if (isLoading) {
    return <Layout><Loading message="Loading expense..." /></Layout>
  }

  if (!expense) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-6 py-8">
          <p className="text-gray-400">Expense not found</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/groups/${groupId}`} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-semibold text-white">Expense Details</h1>
        </div>

        <Card className="bg-[#0a0a0a] border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">{expense.description}</CardTitle>
              <Link to={`/groups/${groupId}/expenses/${expenseId}/edit`}>
                <Button variant="secondary" size="sm">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Amount</span>
                <p className="font-medium text-white text-lg">{formatAmount(expense.amount)} {expense.currency}</p>
              </div>
              <div>
                <span className="text-gray-400">Date</span>
                <p className="font-medium text-white">{expense.expense_date}</p>
              </div>
              <div>
                <span className="text-gray-400">Paid By</span>
                <p className="font-medium text-white">{expense.payer_name || "Unknown"}</p>
              </div>
              <div>
                <span className="text-gray-400">Split</span>
                <p className="font-medium text-white capitalize">{expense.split_type}</p>
              </div>
            </div>
            
            {expense.participants && expense.participants.length > 0 && (
              <div className="pt-4 border-t border-gray-800">
                <p className="text-sm text-gray-400 mb-3">Participants</p>
                <div className="space-y-2">
                  {expense.participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm py-2 px-3 bg-gray-900/50 rounded">
                      <span className="text-gray-300">{p.user_name || p.user_email}</span>
                      <span className="font-medium text-white">{formatAmount(p.amount_owed)} {expense.currency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {expense.notes && (
              <div className="pt-4 border-t border-gray-800">
                <p className="text-sm text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-300">{expense.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}