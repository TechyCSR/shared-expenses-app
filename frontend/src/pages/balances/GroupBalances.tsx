import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import type { GroupBalances as BalanceType } from "@/types"

export default function GroupBalances() {
  const { groupId } = useParams<{ groupId: string }>()

  const { data } = useQuery({
    queryKey: ["balances", groupId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/balances`)
      return res.data.data as BalanceType
    },
    enabled: !!groupId,
  })

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link to={`/groups/${groupId}`} className="text-xl font-semibold">Shared Expenses</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold mb-4">Balances</h2>
        <div className="space-y-3">
          {data?.balances?.map((b) => (
            <Card key={b.user_id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">User {b.user_id.slice(0, 8)}</CardTitle>
                  <span className={`text-sm font-medium ${parseFloat(b.balance) > 0 ? "text-green-600" : parseFloat(b.balance) < 0 ? "text-red-600" : "text-gray-500"}`}>
                    {parseFloat(b.balance) > 0 ? "+" : ""}{b.balance} {b.currency}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Paid: {b.breakdown.expenses_paid.length} expenses</p>
                  <p>Owed: {b.breakdown.expenses_owed.length} expenses</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}