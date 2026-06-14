import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Layout from "@/components/Layout"
import Loading from "@/components/ui/Loading"
import type { Group, GroupMember, Expense } from "@/types"
import { formatAmount } from "@/utils/format"
import { useUser } from "@clerk/clerk-react"

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<"expenses" | "members" | "balances">("expenses")

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["group", id],
    queryFn: async () => {
      const res = await api.get(`/groups/${id}`)
      return res.data.data as Group
    },
    enabled: !!id,
  })

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["group-members", id],
    queryFn: async () => {
      const res = await api.get(`/groups/${id}/members`)
      return res.data.data as GroupMember[]
    },
    enabled: !!id,
  })

  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses", id],
    queryFn: async () => {
      const res = await api.get(`/groups/${id}/expenses`)
      return res.data.data
    },
    enabled: !!id,
  })

  if (groupLoading || membersLoading) {
    return <Layout><Loading message="Loading group..." /></Layout>
  }

  if (!group) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-6 py-8">
          <p className="text-gray-400">Group not found</p>
        </div>
      </Layout>
    )
  }

  const tabs: { key: typeof tab; label: string }[] = [
    { key: "expenses", label: "Expenses" },
    { key: "members", label: "Members" },
    { key: "balances", label: "Balances" },
  ]

  const activeMembers = members?.filter(m => m.is_active) || []

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Group Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-white">{group.name}</h1>
              <p className="text-sm text-gray-500">{activeMembers.length} members · {group.default_currency}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/groups/${id}/settings`}>
              <Button variant="secondary" size="sm">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mb-6">
          <Link to={`/groups/${id}/expenses/new`}>
            <Button size="sm" className="bg-white text-black hover:bg-gray-200">+ Add Expense</Button>
          </Link>
          <Link to={`/groups/${id}/import`}>
            <Button variant="secondary" size="sm">Import CSV</Button>
          </Link>
          <Link to={`/groups/${id}/settlements/new`}>
            <Button variant="ghost" size="sm" className="text-gray-300">Record Settlement</Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-800">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? "border-white text-white"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === "expenses" && (
          <div>
            {expensesLoading ? (
              <Loading message="Loading expenses..." />
            ) : !expensesData?.expenses || expensesData.expenses.length === 0 ? (
              <Card className="bg-[#0a0a0a] border-gray-800">
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500 text-sm">No expenses yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {expensesData.expenses.map((expense: Expense) => (
                  <Link key={expense.id} to={`/groups/${id}/expenses/${expense.id}`}>
                    <Card className="bg-[#0a0a0a] border-gray-800 hover:border-gray-700 transition-colors cursor-pointer py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm text-white">{expense.description}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {expense.expense_date} · {expense.payer_name || expense.paid_by.slice(0, 8)}
                          </p>
                        </div>
                        <p className="font-medium text-sm text-white">{formatAmount(expense.amount)} {expense.currency}</p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "members" && (
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Active Members ({activeMembers.length})</h3>
            <div className="space-y-2">
              {activeMembers.map((member) => (
                <Card key={member.id} className="bg-[#0a0a0a] border-gray-800 py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-white">{member.full_name || member.email}</p>
                      <p className="text-xs text-gray-500">{member.email} · <span className="capitalize">{member.role}</span></p>
                    </div>
                    <span className="text-xs text-green-400">Active</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {tab === "balances" && (
          <div>
            <Link to={`/groups/${id}/balances`}>
              <Button variant="secondary" size="sm">View Detailed Balances</Button>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  )
}