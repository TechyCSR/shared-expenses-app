import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import type { Group, GroupMember, Expense } from "@/types"
import { useClerk, useUser } from "@clerk/clerk-react"

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useUser()
  const { signOut } = useClerk()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<"expenses" | "members" | "balances">("expenses")
  const [showAddMember, setShowAddMember] = useState(false)
  const [addEmail, setAddEmail] = useState("")
  const [addRole, setAddRole] = useState("member")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

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
      const users = res.data.data.users || []
      // Filter out existing members
      const existingIds = members?.filter(m => m.is_active).map(m => m.user_id) || []
      setSearchResults(users.filter((u: any) => !existingIds.includes(u.id)))
    } catch (err) {
      console.error("Search failed:", err)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const isAdmin = members?.some(m => m.user_id === user?.id && m.role === "admin" && m.is_active)

  const handleAddMember = (email: string) => {
    addMemberMutation.mutate({ email, role: addRole })
  }

  const handleRemoveMember = (userId: string, fullName: string) => {
    if (confirm(`Are you sure you want to remove ${fullName || "this member"} from the group?`)) {
      removeMemberMutation.mutate(userId)
    }
  }

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

  const activeMembers = members?.filter(m => m.is_active) || []
  const pastMembers = members?.filter(m => !m.is_active) || []

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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-white">Members</h2>
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

            {showAddMember && (
              <Card className="bg-[#0a0a0a] border-gray-800 mb-4">
                <CardContent className="py-4">
                  <h3 className="text-sm font-medium text-white mb-3">Add Member to Group</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Search by email</label>
                      <input
                        type="text"
                        placeholder="Search users by email..."
                        className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-500"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value)
                          searchUsers(e.target.value)
                        }}
                      />
                    </div>

                    {searchResults.length > 0 && (
                      <div className="border border-gray-700 rounded divide-y divide-gray-700">
                        {searchResults.map((u: any) => (
                          <div key={u.id} className="p-2 flex items-center justify-between">
                            <div>
                              <p className="text-sm text-white">{u.full_name || "Unknown"}</p>
                              <p className="text-xs text-gray-500">{u.email}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAddMember(u.email)}
                              disabled={addMemberMutation.isPending}
                            >
                              Add
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchQuery.length >= 2 && searching && (
                      <p className="text-xs text-gray-500">Searching...</p>
                    )}

                    {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                      <p className="text-xs text-gray-500">No users found</p>
                    )}

                    <div className="pt-2 border-t border-gray-700">
                      <label className="text-xs text-gray-400 mb-1 block">Or enter email directly</label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="user@example.com"
                          className="flex-1 bg-black border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gray-500"
                          value={addEmail}
                          onChange={(e) => setAddEmail(e.target.value)}
                        />
                        <select
                          className="bg-black border border-gray-700 rounded px-2 py-2 text-white text-sm focus:outline-none focus:border-gray-500"
                          value={addRole}
                          onChange={(e) => setAddRole(e.target.value)}
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        <Button
                          size="sm"
                          onClick={() => handleAddMember(addEmail)}
                          disabled={!addEmail || addMemberMutation.isPending}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>

                  {addMemberMutation.isError && (
                    <p className="text-xs text-red-400 mt-2">Failed to add member. User may not exist.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {activeMembers.length > 0 && (
              <div className="space-y-2 mb-6">
                <h3 className="text-sm font-medium text-gray-400">Active Members ({activeMembers.length})</h3>
                {activeMembers.map((member) => (
                  <Card key={member.id} className="bg-[#0a0a0a] border-gray-800 py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-white">{member.full_name || member.email}</p>
                        <p className="text-xs text-gray-500">
                          {member.email} · <span className="capitalize">{member.role}</span> · Joined {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-400">Active</span>
                        {isAdmin && member.user_id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            onClick={() => handleRemoveMember(member.user_id, member.full_name || member.email)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {pastMembers.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-400">Past Members ({pastMembers.length})</h3>
                {pastMembers.map((member) => (
                  <Card key={member.id} className="bg-[#0a0a0a] border-gray-800 py-3 px-4 opacity-60">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-white">{member.full_name || member.email}</p>
                        <p className="text-xs text-gray-500">
                          {member.email} · Joined {new Date(member.joined_at).toLocaleDateString()} · Left {new Date(member.left_at!).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">Removed</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {members?.length === 0 && (
              <Card className="bg-[#0a0a0a] border-gray-800">
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500 text-sm">No members in this group</p>
                </CardContent>
              </Card>
            )}
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