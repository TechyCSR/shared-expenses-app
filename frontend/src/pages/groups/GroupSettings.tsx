import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Layout from "@/components/Layout"
import Loading from "@/components/ui/Loading"
import { useUser } from "@clerk/clerk-react"
import type { Group, GroupMember } from "@/types"

export default function GroupSettings() {
  const { groupId } = useParams<{ groupId: string }>()
  const { user } = useUser()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [showAddMember, setShowAddMember] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [addEmail, setAddEmail] = useState("")
  const [addRole, setAddRole] = useState("member")
  const [groupName, setGroupName] = useState("")
  const [editingName, setEditingName] = useState(false)

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}`)
      return res.data.data as Group
    },
    enabled: !!groupId,
  })

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/members`)
      return res.data.data as GroupMember[]
    },
    enabled: !!groupId,
  })

  const updateGroupMutation = useMutation({
    mutationFn: async (data: { name?: string; description?: string }) => {
      const res = await api.put(`/groups/${groupId}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] })
      setEditingName(false)
    },
  })

  const addMemberMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const res = await api.post(`/groups/${groupId}/members`, { email, role })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] })
      setShowAddMember(false)
      setAddEmail("")
      setSearchResults([])
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.delete(`/groups/${groupId}/members/${userId}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] })
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
      const existingClerkIds = members?.filter(m => m.is_active).map(m => m.clerk_id).filter(Boolean) || []
      const filtered = users.filter((u: any) => !existingClerkIds.includes(u.clerk_id))
      setSearchResults(filtered)
    } catch (err) {
      console.error("Search failed:", err)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  if (groupLoading || membersLoading) {
    return <Layout><Loading message="Loading settings..." /></Layout>
  }

  if (!group) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-6 py-8">
          <p className="text-gray-400">Group not found</p>
        </div>
      </Layout>
    )
  }

  const isAdmin = members?.some(m => m.clerk_id === user?.id && m.role === "admin" && m.is_active)
  const activeMembers = members?.filter(m => m.is_active) || []
  const pastMembers = members?.filter(m => !m.is_active) || []

  const handleSaveName = () => {
    if (groupName.trim() && groupName !== group.name) {
      updateGroupMutation.mutate({ name: groupName.trim() })
    } else {
      setEditingName(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to={`/groups/${groupId}`} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-semibold text-white">Group Settings</h1>
        </div>

        {/* Group Name */}
        <Card className="bg-[#0a0a0a] border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white text-lg">General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-400">Group Name</label>
              {isAdmin && editingName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-700 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleSaveName}>Save</Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditingName(false)}>Cancel</Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-white">{group.name}</p>
                  {isAdmin && (
                    <Button size="sm" variant="ghost" onClick={() => { setGroupName(group.name); setEditingName(true) }}>
                      Edit
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-400">Default Currency</label>
              <p className="text-white">{group.default_currency}</p>
            </div>
          </CardContent>
        </Card>

        {/* Members */}
        <Card className="bg-[#0a0a0a] border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">Members ({activeMembers.length})</CardTitle>
              {isAdmin && (
                <Button size="sm" variant="secondary" onClick={() => setShowAddMember(!showAddMember)}>
                  {showAddMember ? "Cancel" : "+ Add Member"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showAddMember && (
              <div className="border border-gray-700 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-medium text-white">Add Member</h3>
                <div>
                  <input
                    type="text"
                    placeholder="Search by email or name..."
                    className="w-full px-3 py-2 border border-gray-700 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); searchUsers(e.target.value) }}
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
                        <Button size="sm" variant="ghost" onClick={() => addMemberMutation.mutate({ email: u.email, role: addRole })}>
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
                <div className="pt-2 border-t border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Or enter email directly..."
                      className="flex-1 px-3 py-2 border border-gray-700 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                    />
                    <select
                      className="px-2 py-2 border border-gray-700 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white"
                      value={addRole}
                      onChange={(e) => setAddRole(e.target.value)}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <Button size="sm" onClick={() => addMemberMutation.mutate({ email: addEmail, role: addRole })} disabled={!addEmail}>
                      Add
                    </Button>
                  </div>
                </div>
                {addMemberMutation.isError && <p className="text-xs text-red-400">Failed to add member</p>}
              </div>
            )}

            <div className="space-y-2">
              {activeMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <div>
                    <p className="text-sm text-white">{member.full_name || member.email}</p>
                    <p className="text-xs text-gray-500">{member.email} · {member.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-400">Active</span>
                    {isAdmin && member.clerk_id !== user?.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300"
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
              ))}
            </div>

            {pastMembers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Past Members ({pastMembers.length})</h4>
                <div className="space-y-2">
                  {pastMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg opacity-60">
                      <div>
                        <p className="text-sm text-white">{member.full_name || member.email}</p>
                        <p className="text-xs text-gray-500">Left {new Date(member.left_at!).toLocaleDateString()}</p>
                      </div>
                      <span className="text-xs text-gray-500">Removed</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}