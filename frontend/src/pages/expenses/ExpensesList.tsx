import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import api from "@/services/api"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Layout from "@/components/Layout"
import Loading from "@/components/ui/Loading"
import type { Expense } from "@/types"

export default function ExpensesList() {
  const { groupId } = useParams<{ groupId: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ["expenses", groupId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/expenses`)
      return res.data.data
    },
    enabled: !!groupId,
  })

  if (isLoading) {
    return <Layout><Loading message="Loading expenses..." /></Layout>
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Expenses</h2>
          <Link to={`/groups/${groupId}/expenses/new`}>
            <Button size="sm" className="bg-white text-black hover:bg-gray-200">+ Add Expense</Button>
          </Link>
        </div>
        {!data?.expenses?.length ? (
          <Card className="bg-[#0a0a0a] border-gray-800 py-8">
            <p className="text-center text-gray-500 text-sm">No expenses yet</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {data.expenses.map((expense: Expense) => (
              <Link key={expense.id} to={`/groups/${groupId}/expenses/${expense.id}`}>
                <Card className="bg-[#0a0a0a] border-gray-800 hover:border-gray-700 transition-colors cursor-pointer py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-white">{expense.description}</p>
                      <p className="text-xs text-gray-500">{expense.expense_date} · {expense.payer_name || "Unknown"}</p>
                    </div>
                    <p className="font-medium text-sm text-white">{expense.amount} {expense.currency}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}