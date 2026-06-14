import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import type { GroupBalances as BalanceType } from "@/types"
import { useClerk, useUser } from "@clerk/clerk-react"

export default function GroupBalances() {
  const { groupId } = useParams<{ groupId: string }>()
  const { user } = useUser()
  const { signOut } = useClerk()

  const { data } = useQuery({
    queryKey: ["balances", groupId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/balances`)
      return res.data.data as BalanceType
    },
    enabled: !!groupId,
  })

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
        <h2 className="text-xl font-semibold text-white mb-4">Balances</h2>
        <div className="space-y-3">
          {data?.balances?.map((b) => (
            <Card key={b.user_id} className="bg-[#0a0a0a] border-gray-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-white">User {b.user_id.slice(0, 8)}</CardTitle>
                  <span className={`text-sm font-medium ${parseFloat(b.balance) > 0 ? "text-green-400" : parseFloat(b.balance) < 0 ? "text-red-400" : "text-gray-500"}`}>
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