import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Layout from "@/components/Layout"
import Loading from "@/components/ui/Loading"
import type { Group, GroupMember, Expense } from "@/types"
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
                  <Card key={expense.id} className="bg-[#0a0a0a] border-gray-800 hover:border-gray-700 transition-colors py-3 px-4">
                    <div className="flex items-center justify-between">
                      <Link to={`/groups/${id}/expenses/${expense.id}`} className="flex-1">
                        <div>
                          <p className="font-medium text-sm text-white">{expense.description}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {expense.expense_date} · {expense.payer_name || expense.paid_by.slice(0, 8)}
                          </p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-sm text-white">{formatAmount(expense.amount)} {expense.currency}</p>
                        <Link to={`/groups/${id}/expenses/${expense.id}/edit`} className="text-gray-400 hover:text-white p-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
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
            <Link to={`/groups/${id}/balances`}>
              <Button variant="secondary" size="sm">View Detailed Balances</Button>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  )
}