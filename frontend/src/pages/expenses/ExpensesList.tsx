import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import api from "@/services/api"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import type { Expense } from "@/types"
import { useClerk, useUser } from "@clerk/clerk-react"

export default function ExpensesList() {
  const { groupId } = useParams<{ groupId: string }>()
  const { user } = useUser()
  const { signOut } = useClerk()

  const { data } = useQuery({
    queryKey: ["expenses", groupId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/expenses`)
      return res.data.data
    },
    enabled: !!groupId,
  })

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
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
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold text-white mb-4">Expenses</h2>
        <div className="space-y-2">
          {data?.expenses?.map((expense: Expense) => (
            <Link key={expense.id} to={`/groups/${groupId}/expenses/${expense.id}`}>
              <Card className="bg-[#0a0a0a] border-gray-800 hover:border-gray-700 transition-colors cursor-pointer py-3 px-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm text-white">{expense.description}</p>
                  <p className="text-sm text-gray-300">{expense.amount} {expense.currency}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}