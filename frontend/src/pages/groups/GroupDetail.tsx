import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import type { Group, GroupMember, Expense } from "@/types"
import { useClerk, useUser } from "@clerk/clerk-react"

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useUser()
  const { signOut } = useClerk()
  const [tab, setTab] = useState<"expenses" | "members" | "balances">("expenses")

  const { data: group } = useQuery({
    queryKey: ["group", id],
    queryFn: async () => {
      const res = await api.get(`/groups/${id}`)
      return res.data.data as Group
    },
    enabled: !!id,
  })

  const { data: members } = useQuery({
    queryKey: ["group-members", id],
    queryFn: async () => {
      const res = await api.get(`/groups/${id}/members`)
      return res.data.data as GroupMember[]
    },
    enabled: !!id,
  })

  const { data: expensesData } = useQuery({
    queryKey: ["expenses", id],
    queryFn: async () => {
      const res = await api.get(`/groups/${id}/expenses`)
      return res.data.data
    },
    enabled: !!id,
  })

  if (!group) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const tabs: { key: typeof tab; label: string }[] = [
    { key: "expenses", label: "Expenses" },
    { key: "members", label: "Members" },
    { key: "balances", label: "Balances" },
  ]

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xl font-semibold text-white">Shared Expenses</Link>
            <span className="text-gray-600">/</span>
            <h1 className="text-lg font-medium text-white">{group.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <img
                src={user.imageUrl}
                alt={user.fullName || "User"}
                className="w-8 h-8 rounded-full"
              />
            )}
            <Link to={`/groups/${id}/expenses/new`}>
              <Button size="sm" className="bg-white text-black hover:bg-gray-200">Add Expense</Button>
            </Link>
            <Link to={`/groups/${id}/import`}>
              <Button variant="secondary" size="sm">Import CSV</Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-gray-800"
              onClick={() => signOut()}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
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

        {tab === "expenses" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-white">Expenses</h2>
              <Link to={`/groups/${id}/settlements/new`}>
                <Button variant="ghost" size="sm" className="text-gray-300">Record Settlement</Button>
              </Link>
            </div>
            {(!expensesData?.expenses || expensesData.expenses.length === 0) ? (
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
                        <p className="font-medium text-sm text-white">{expense.amount} {expense.currency}</p>
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
            <h2 className="text-lg font-medium text-white mb-4">Members</h2>
            <div className="space-y-2">
              {members?.filter(m => m.is_active).map((member) => (
                <Card key={member.id} className="bg-[#0a0a0a] border-gray-800 py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-white">{member.full_name || member.email}</p>
                      <p className="text-xs text-gray-500">{member.email} · {member.role}</p>
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
            <h2 className="text-lg font-medium text-white mb-4">Balances</h2>
            <Link to={`/groups/${id}/balances`}>
              <Button variant="secondary" size="sm">View Detailed Balances</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}