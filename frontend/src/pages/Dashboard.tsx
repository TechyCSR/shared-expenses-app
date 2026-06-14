import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import api from "@/services/api"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Layout from "@/components/Layout"
import Loading from "@/components/ui/Loading"
import type { Group } from "@/types"
import { useUser } from "@clerk/clerk-react"

export default function Dashboard() {
  const { user, isSignedIn, isLoaded } = useUser()

  const { data: groups, isLoading, isError } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await api.get("/groups")
      return res.data.data as Group[]
    },
    enabled: isSignedIn,
    retry: false,
  })

  if (!isLoaded) {
    return <Layout><Loading message="Loading..." /></Layout>
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="w-full max-w-md bg-[#0a0a0a] border-gray-800">
          <CardContent className="py-12 text-center">
            <p className="text-gray-400 mb-4">Sign in to manage your shared expenses</p>
            <Link to="/login">
              <Button className="bg-white text-black hover:bg-gray-200">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return <Layout><Loading message="Loading groups..." /></Layout>
  }

  if (isError) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Card className="bg-[#0a0a0a] border-gray-800">
            <CardContent className="py-12 text-center">
              <p className="text-red-400 mb-4">Failed to load groups</p>
              <Link to="/login">
                <Button variant="secondary">Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">My Groups</h2>
          <Link to="/groups/new">
            <Button size="sm" className="bg-white text-black hover:bg-gray-200">+ New Group</Button>
          </Link>
        </div>

        {!groups || groups.length === 0 ? (
          <Card className="bg-[#0a0a0a] border-gray-800">
            <CardContent className="py-12 text-center">
              <p className="text-gray-400 mb-4">No groups yet</p>
              <Link to="/groups/new">
                <Button className="bg-white text-black hover:bg-gray-200">Create Your First Group</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <Link key={group.id} to={`/groups/${group.id}`}>
                <Card className="bg-[#0a0a0a] border-gray-800 hover:border-gray-700 hover:bg-gray-900/50 transition-all cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {group.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded">
                        {group.default_currency}
                      </span>
                    </div>
                    <h3 className="font-medium text-white mb-1 truncate">{group.name}</h3>
                    <p className="text-xs text-gray-500">{group.member_count} member{group.member_count !== 1 ? "s" : ""}</p>
                    <div className="flex items-center justify-end mt-3">
                      <Link to={`/groups/${group.id}/settings`} className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        Settings
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}