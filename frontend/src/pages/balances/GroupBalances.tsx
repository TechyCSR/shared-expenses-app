import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent } from "@/components/ui/Card"
import Layout from "@/components/Layout"
import Loading from "@/components/ui/Loading"
import type { GroupBalances as BalanceType } from "@/types"
import { formatAmount } from "@/utils/format"

export default function GroupBalances() {
  const { groupId } = useParams<{ groupId: string }>()
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

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

  const memberNames = data?.member_names ?? {}
  const debts = data?.debts ?? []
  const balances = data?.balances ?? []

  const getName = (uid: string): string => memberNames[uid] ?? `User ${uid.slice(0, 8)}`

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

        {/* Who owes whom summary */}
        {debts.length > 0 && (
          <Card className="bg-[#0a0a0a] border-gray-800 mb-6">
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Who Owes Whom</h2>
              <div className="space-y-2">
                {debts.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 font-medium">{d.from_name}</span>
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <span className="text-green-400 font-medium">{d.to_name}</span>
                    </div>
                    <span className="text-white font-semibold">{formatAmount(String(d.amount))} {d.currency}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Per-user balance breakdown */}
        {balances.length === 0 ? (
          <Card className="bg-[#0a0a0a] border-gray-800">
            <CardContent className="py-8 text-center">
              <p className="text-gray-500 text-sm">No balances to show</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {balances.map((balance) => {
              const isExpanded = expandedUser === balance.user_id
              const balanceNum = parseFloat(balance.balance)
              const isPositive = balanceNum >= 0
              const name = getName(balance.user_id)
              const allBreakdownItems = [
                ...balance.breakdown.expenses_paid.map(i => ({ ...i, sign: "+" as const, color: "text-green-400" })),
                ...balance.breakdown.expenses_owed.map(i => ({ ...i, sign: "-" as const, color: "text-red-400" })),
                ...balance.breakdown.settlements_received.map(i => ({ ...i, sign: "+" as const, color: "text-green-400", kind: "received" })),
                ...balance.breakdown.settlements_sent.map(i => ({ ...i, sign: "-" as const, color: "text-red-400", kind: "sent" })),
              ].sort((a, b) => (a.date < b.date ? 1 : -1))

              return (
                <Card key={balance.user_id} className="bg-[#0a0a0a] border-gray-800">
                  <CardContent className="p-0">
                    <button
                      type="button"
                      onClick={() => setExpandedUser(isExpanded ? null : balance.user_id)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-900/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-sm font-semibold text-white">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                          {isPositive ? "+" : ""}{formatAmount(balance.balance)} {balance.currency}
                        </span>
                        <svg className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-800 p-4 space-y-3">
                        {/* Per-user debt breakdown (who owes whom) */}
                        {debts.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">
                              {balanceNum >= 0 ? 'Owed by' : 'Needs to pay'}
                            </h4>
                            <div className="space-y-1.5">
                              {debts
                                .filter(d => balanceNum >= 0 ? d.to_user_id === balance.user_id : d.from_user_id === balance.user_id)
                                .map((d, i) => (
                                  <div key={i} className="flex justify-between text-sm px-2 py-1.5">
                                    <div className="flex items-center gap-2">
                                      {balanceNum >= 0 ? (
                                        <>
                                          <span className="text-gray-300">{d.from_name}</span>
                                          <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                          </svg>
                                          <span className="text-green-400 text-xs">owes you</span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="text-gray-400 text-xs">owes</span>
                                          <span className="text-gray-300">{d.to_name}</span>
                                        </>
                                      )}
                                    </div>
                                    <span className="text-white font-medium">{formatAmount(String(d.amount))} {d.currency}</span>
                                  </div>
                                ))}
                              {debts.filter(d => balanceNum >= 0 ? d.to_user_id === balance.user_id : d.from_user_id === balance.user_id).length === 0 && (
                                <p className="text-xs text-gray-500 italic px-2 py-1">
                                  {balanceNum >= 0 ? 'Nothing owed to this user' : 'No outstanding payments'}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        {balance.breakdown.expenses_paid?.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">Paid for group</h4>
                            <div className="space-y-1.5">
                              {balance.breakdown.expenses_paid.map((item, i) => (
                                <Link
                                  key={i}
                                  to={`/groups/${groupId}/expenses/${item.expense_id}`}
                                  className="flex justify-between text-sm hover:bg-gray-900/40 px-2 py-1.5 -mx-2 rounded"
                                >
                                  <span className="text-gray-300">{item.description}</span>
                                  <span className="text-green-400">+{formatAmount(item.amount)}</span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {balance.breakdown.expenses_owed?.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">Owes share of</h4>
                            <div className="space-y-1.5">
                              {balance.breakdown.expenses_owed.map((item, i) => (
                                <Link
                                  key={i}
                                  to={`/groups/${groupId}/expenses/${item.expense_id}`}
                                  className="flex justify-between text-sm hover:bg-gray-900/40 px-2 py-1.5 -mx-2 rounded"
                                >
                                  <span className="text-gray-300">{item.description}</span>
                                  <span className="text-red-400">-{formatAmount(item.amount)}</span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {balance.breakdown.settlements_received?.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">Received settlements</h4>
                            <div className="space-y-1.5">
                              {balance.breakdown.settlements_received.map((item, i) => (
                                <div key={i} className="flex justify-between text-sm px-2 py-1.5">
                                  <span className="text-gray-300">{item.description}</span>
                                  <span className="text-green-400">+{formatAmount(item.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {balance.breakdown.settlements_sent?.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">Sent settlements</h4>
                            <div className="space-y-1.5">
                              {balance.breakdown.settlements_sent.map((item, i) => (
                                <div key={i} className="flex justify-between text-sm px-2 py-1.5">
                                  <span className="text-gray-300">{item.description}</span>
                                  <span className="text-red-400">-{formatAmount(item.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {allBreakdownItems.length === 0 && (
                          <p className="text-xs text-gray-500 italic">No transactions</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
