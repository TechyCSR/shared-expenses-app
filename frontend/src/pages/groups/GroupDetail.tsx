import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Layout from "@/components/Layout"
import Loading from "@/components/ui/Loading"
import type { Group, GroupMember, Expense, GroupBalances as BalanceType } from "@/types"
import { useUser } from "@clerk/clerk-react"
import { formatAmount } from "@/utils/format"

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<"expenses" | "members" | "balances">("expenses")
  const [showAddMember, setShowAddMember] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{id: string; clerk_id: string; email: string; full_name: string | null}>>([])
  const [searching, setSearching] = useState(false)
  const [addEmail, setAddEmail] = useState("")
  const [addRole, setAddRole] = useState("member")
  const [expandedBalanceUser, setExpandedBalanceUser] = useState<string | null>(null)
  const [expenseFilter, setExpenseFilter] = useState<"all" | "mine" | "i_paid" | "i_owe">("all")
  const [expenseSort, setExpenseSort] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc" | "name">("date_desc")

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

  const { data: expensesData, isLoading: expensesLoading, isPlaceholderData } = useQuery({
    queryKey: ["expenses", id],
    queryFn: async () => {
      const res = await api.get(`/groups/${id}/expenses`)
      return res.data.data
    },
    enabled: !!id,
    placeholderData: (prev) => prev,
    staleTime: 10_000,
  })

  const { data: balancesData, isLoading: balancesLoading } = useQuery({
    queryKey: ["balances", id],
    queryFn: async () => {
      const res = await api.get(`/groups/${id}/balances`)
      return res.data.data as BalanceType
    },
    enabled: !!id && tab === "balances",
  })

  const addMemberMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const res = await api.post(`/groups/${id}/members`, { email, role })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-members", id] })
      setShowAddMember(false)
      setAddEmail("")
      setSearchResults([])
      setSearchQuery("")
    },
    onError: (err: any) => {
      console.error("Failed to add member:", err)
      alert(err?.response?.data?.error?.message || "Failed to add member")
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.delete(`/groups/${id}/members/${userId}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-members", id] })
    },
  })

  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(query)}`)
      const users: Array<{id: string; clerk_id: string; email: string; full_name: string | null}> = res.data.data.users || []
      const existingClerkIds = members?.filter(m => m.is_active).map(m => m.clerk_id).filter(Boolean) || []
      const filtered = users.filter(u => !existingClerkIds.includes(u.clerk_id))
      setSearchResults(filtered)
    } catch (err) {
      console.error("Search failed:", err)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

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
  const pastMembers = members?.filter(m => !m.is_active) || []
  const isAdmin = members?.some(m => m.clerk_id === user?.id && m.role === "admin" && m.is_active)

  // Build a name lookup for resolving paid_by and participant user_ids
  const memberNameMap: Record<string, string> = {}
  members?.forEach(m => {
    if (m.user_id) memberNameMap[m.user_id] = m.full_name || m.email
  })

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
            <Link to={`/groups/${id}/expenses/new`}>
              <Button size="sm" className="bg-white text-black hover:bg-gray-200">+ Add Expense</Button>
            </Link>
            <Link to={`/groups/${id}/settings`}>
              <Button variant="secondary" size="sm">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Button>
            </Link>
            <Link to={`/groups/${id}/import`}>
              <Button variant="secondary" size="sm">Import CSV</Button>
            </Link>
            <Link to={`/groups/${id}/settlements/new`}>
              <Button variant="secondary" size="sm">Record Settlement</Button>
            </Link>
          </div>
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
          <div className={`transition-opacity duration-150 ${isPlaceholderData ? "opacity-50" : "opacity-100"}`}>
            {expensesLoading && !expensesData ? (
              <Loading message="Loading expenses..." />
            ) : !expensesData?.expenses || expensesData.expenses.length === 0 ? (
              <Card className="bg-[#0a0a0a] border-gray-800">
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500 text-sm">No expenses yet</p>
                </CardContent>
              </Card>
            ) : (() => {
                const currentClerkId = user?.id
                const myInternalId = members?.find(m => m.clerk_id === currentClerkId)?.user_id

                const filtered = expensesData.expenses.filter((e: Expense) => {
                  if (expenseFilter === "all") return true
                  if (expenseFilter === "i_paid") return e.paid_by === myInternalId || e.paid_by === currentClerkId
                  if (expenseFilter === "i_owe") {
                    return e.participants?.some(p => p.user_id === myInternalId) || false
                  }
                  if (expenseFilter === "mine") {
                    const isPayer = e.paid_by === myInternalId || e.paid_by === currentClerkId
                    const isParticipant = e.participants?.some(p => p.user_id === myInternalId) || false
                    return isPayer || isParticipant
                  }
                  return true
                })

                const sorted = [...filtered].sort((a, b) => {
                  if (expenseSort === "date_desc") return a.expense_date < b.expense_date ? 1 : -1
                  if (expenseSort === "date_asc") return a.expense_date > b.expense_date ? 1 : -1
                  if (expenseSort === "amount_desc") return parseFloat(b.amount) - parseFloat(a.amount)
                  if (expenseSort === "amount_asc") return parseFloat(a.amount) - parseFloat(b.amount)
                  if (expenseSort === "name") return a.description.localeCompare(b.description)
                  return 0
                })

                return (
                  <div>
                    {/* Filter pills + Sort */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div className="flex flex-wrap gap-1.5">
                        {([
                          ["all", "All"],
                          ["mine", "My Expenses"],
                          ["i_paid", "I Paid"],
                          ["i_owe", "I Owe"],
                        ] as const).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => setExpenseFilter(key)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                              expenseFilter === key
                                ? "bg-white text-black"
                                : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <select
                        value={expenseSort}
                        onChange={(e) => setExpenseSort(e.target.value as typeof expenseSort)}
                        className="px-3 py-1.5 text-xs bg-gray-900 border border-gray-800 rounded-md text-gray-300 focus:outline-none focus:ring-1 focus:ring-white"
                      >
                        <option value="date_desc">Newest first</option>
                        <option value="date_asc">Oldest first</option>
                        <option value="amount_desc">Amount: high → low</option>
                        <option value="amount_asc">Amount: low → high</option>
                        <option value="name">Name (A–Z)</option>
                      </select>
                    </div>

                    {sorted.length === 0 ? (
                      <Card className="bg-[#0a0a0a] border-gray-800">
                        <CardContent className="py-8 text-center">
                          <p className="text-gray-500 text-sm">No expenses match this filter</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-2">
                        {sorted.map((expense: Expense) => {
                          const myParticipant = expense.participants?.find(p => p.user_id === myInternalId)
                          const myShare = myParticipant ? parseFloat(myParticipant.amount_owed) : 0
                          const iPaid = expense.paid_by === myInternalId || expense.paid_by === currentClerkId
                          const splitBadge = {
                            equal: "Equal",
                            unequal: "Unequal",
                            percentage: "% Split",
                            shares: "Shares",
                          }[expense.split_type] || expense.split_type

                          return (
                            <Card key={expense.id} className={`bg-[#0a0a0a] border-gray-800 hover:border-gray-700 transition-colors py-3 px-4 ${iPaid ? "border-l-2 border-l-green-500" : myShare > 0 ? "border-l-2 border-l-red-500" : ""}`}>
                              <div className="flex items-center justify-between gap-3">
                                <Link to={`/groups/${id}/expenses/${expense.id}`} className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-medium text-sm text-white truncate">{expense.description}</p>
                                    <span className="text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 bg-gray-800 text-gray-400 rounded">
                                      {splitBadge}
                                    </span>
                                    {iPaid && (
                                      <span className="text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 bg-green-900/40 text-green-400 rounded">
                                        You paid
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {expense.expense_date} · {expense.payer_name || memberNameMap[expense.paid_by] || expense.paid_by.slice(0, 8)}
                                    {myShare > 0 && !iPaid && (
                                      <span className="text-red-400"> · your share: {formatAmount(String(myShare))}</span>
                                    )}
                                    {iPaid && myParticipant && (
                                      <span className="text-gray-500"> · your share: {formatAmount(String(myShare))}</span>
                                    )}
                                  </p>
                                </Link>
                                <div className="flex items-center gap-3 shrink-0">
                                  <p className="font-medium text-sm text-white">{formatAmount(expense.amount)} {expense.currency}</p>
                                  <Link to={`/groups/${id}/expenses/${expense.id}/edit`} className="text-gray-400 hover:text-white p-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </Link>
                                </div>
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })()
            }
          </div>
        )}

        {tab === "members" && (
          <div>
            {/* Members Header with Add Member button */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-300">Active Members ({activeMembers.length})</h3>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowAddMember(!showAddMember)}
                >
                  {showAddMember ? "Cancel" : "+ Add Member"}
                </Button>
              )}
            </div>

            {/* Add Member Form (only for admins) */}
            {showAddMember && isAdmin && (
              <Card className="bg-[#0a0a0a] border-2 border-gray-600 mb-4">
                <CardContent className="py-4 space-y-3">
                  <h4 className="text-sm font-medium text-white">Add New Member</h4>
                  
                  {/* Search */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Search by email or name</label>
                    <input
                      type="text"
                      placeholder="Search by email or name..."
                      className="w-full px-3 py-2 border-2 border-gray-600 rounded text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-white placeholder-gray-500"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        searchUsers(e.target.value)
                      }}
                    />
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="border-2 border-gray-700 rounded divide-y divide-gray-700">
                      {searchResults.map((u) => (
                        <div key={u.id} className="p-2 flex items-center justify-between hover:bg-gray-900/50">
                          <div>
                            <p className="text-sm text-white">{u.full_name || "Unknown"}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => addMemberMutation.mutate({ email: u.email, role: addRole })}
                            disabled={addMemberMutation.isPending}
                          >
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {searching && <p className="text-xs text-gray-500">Searching...</p>}
                  {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                    <p className="text-xs text-gray-500">No users found</p>
                  )}

                  {/* Direct Email Entry */}
                  <div className="pt-2 border-t border-gray-700">
                    <label className="block text-xs text-gray-400 mb-1">Or enter email directly</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="user@example.com"
                        className="flex-1 px-3 py-2 border-2 border-gray-600 rounded text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-white placeholder-gray-500"
                        value={addEmail}
                        onChange={(e) => setAddEmail(e.target.value)}
                      />
                      <select
                        value={addRole}
                        onChange={(e) => setAddRole(e.target.value)}
                        className="px-2 py-2 border-2 border-gray-600 rounded text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-white"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                      <Button
                        size="sm"
                        onClick={() => addMemberMutation.mutate({ email: addEmail, role: addRole })}
                        disabled={!addEmail || addMemberMutation.isPending}
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {addMemberMutation.isError && (
                    <p className="text-xs text-red-400">Failed to add member. User may not exist.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Members List */}
            <div className="space-y-2">
              {activeMembers.map((member) => (
                <Card key={member.id} className="bg-[#0a0a0a] border-gray-800 py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-white">{member.full_name || member.email}</p>
                      <p className="text-xs text-gray-500">
                        {member.email} · <span className="capitalize">{member.role}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-400">Active</span>
                      {isAdmin && member.clerk_id !== user?.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          onClick={() => {
                            if (confirm(`Remove ${member.full_name || member.email}?`)) {
                              removeMemberMutation.mutate(member.user_id)
                            }
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Past Members */}
            {pastMembers.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Past Members ({pastMembers.length})</h3>
                <div className="space-y-2">
                  {pastMembers.map((member) => (
                    <Card key={member.id} className="bg-[#0a0a0a] border-gray-800 py-3 px-4 opacity-60">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm text-white">{member.full_name || member.email}</p>
                          <p className="text-xs text-gray-500">
                            Left {new Date(member.left_at!).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">Removed</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "balances" && (
          <div>
            {balancesLoading ? (
              <Loading message="Loading balances..." />
            ) : (
              <>
                {/* Who owes whom summary */}
                {balancesData && balancesData.debts && balancesData.debts.length > 0 && (
                  <Card className="bg-[#0a0a0a] border-gray-800 mb-4">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Who Owes Whom</h3>
                        <Link to={`/groups/${id}/balances`} className="text-xs text-gray-400 hover:text-white">
                          View details →
                        </Link>
                      </div>
                      <div className="space-y-2">
                        {balancesData.debts.map((d, i) => (
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

                {/* Per-user balance cards */}
                {!balancesData?.balances || balancesData.balances.length === 0 ? (
                  <Card className="bg-[#0a0a0a] border-gray-800">
                    <CardContent className="py-8 text-center">
                      <p className="text-gray-500 text-sm">No balances yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {balancesData.balances.map((balance) => {
                      const isExpanded = expandedBalanceUser === balance.user_id
                      const balanceNum = parseFloat(balance.balance)
                      const isPositive = balanceNum >= 0
                      const name = balancesData.member_names?.[balance.user_id] || `User ${balance.user_id.slice(0, 8)}`
                      const items = [
                        ...balance.breakdown.expenses_paid,
                        ...balance.breakdown.expenses_owed,
                        ...balance.breakdown.settlements_received,
                        ...balance.breakdown.settlements_sent,
                      ]
                      return (
                        <Card key={balance.user_id} className="bg-[#0a0a0a] border-gray-800">
                          <CardContent className="p-0">
                            <button
                              type="button"
                              onClick={() => setExpandedBalanceUser(isExpanded ? null : balance.user_id)}
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
                                {balancesData && balancesData.debts && balancesData.debts.length > 0 && (
                                  <div>
                                    <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">
                                      {balanceNum >= 0 ? 'Owed by' : 'Needs to pay'}
                                    </h4>
                                    <div className="space-y-1.5">
                                      {balancesData.debts
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
                                      {balancesData.debts.filter(d => balanceNum >= 0 ? d.to_user_id === balance.user_id : d.from_user_id === balance.user_id).length === 0 && (
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
                                          to={`/groups/${id}/expenses/${item.expense_id}`}
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
                                          to={`/groups/${id}/expenses/${item.expense_id}`}
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
                                {items.length === 0 && (
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
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}