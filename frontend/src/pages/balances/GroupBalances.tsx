import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Layout from "@/components/Layout"
import Loading from "@/components/ui/Loading"
import type { GroupBalances as BalanceType } from "@/types"

export default function GroupBalances() {
  const { groupId } = useParams<{ groupId: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ["balances", groupId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/balances`)
      return res.data.data as BalanceType
    },
    enabled: !!groupId,
  })

  if (isLoading) {
    return <Layout><Loading message="Loading balances..." /></Layout>
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
          <h1 className="text-2xl font-semibold text-white">Balances</h1>
        </div>

        {!data?.balances || data.balances.length === 0 ? (
          <Card className="bg-[#0a0a0a] border-gray-800">
            <CardContent className="py-8 text-center">
              <p className="text-gray-500 text-sm">No balances to show</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {data.balances.map((balance) => (
              <Card key={balance.user_id} className="bg-[#0a0a0a] border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-medium">User {balance.user_id.slice(0, 8)}</span>
                    <span className={`text-lg font-semibold ${parseFloat(balance.balance) >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {parseFloat(balance.balance) >= 0 ? "+" : ""}{balance.balance} {balance.currency}
                    </span>
                  </div>
                  
                  {balance.breakdown && (
                    <div className="space-y-2 mt-4">
                      <h4 className="text-xs font-medium text-gray-400 uppercase">Expenses Paid</h4>
                      {balance.breakdown.expenses_paid?.length > 0 ? (
                        balance.breakdown.expenses_paid.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-400">{item.description}</span>
                            <span className="text-white">+{item.amount}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-600">None</p>
                      )}
                      
                      <h4 className="text-xs font-medium text-gray-400 uppercase mt-3">Expenses Owed</h4>
                      {balance.breakdown.expenses_owed?.length > 0 ? (
                        balance.breakdown.expenses_owed.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-400">{item.description}</span>
                            <span className="text-red-400">-{item.amount}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-600">None</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}