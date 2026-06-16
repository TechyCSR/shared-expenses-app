import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import api from "@/services/api"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Layout from "@/components/Layout"
import Loading from "@/components/ui/Loading"
import type { Group } from "@/types"
import { useAuth, useUser } from "@clerk/clerk-react"

export default function Dashboard() {
  const { isSignedIn: isAuthSignedIn, isLoaded: isAuthLoaded } = useAuth()
  const { isSignedIn, isLoaded } = useUser()
  
  // Use useAuth for immediate auth state, useUser for user data
  const isSignedInCombined = isAuthSignedIn && isSignedIn
  const isLoadedCombined = isAuthLoaded && isLoaded

  const { data: groups, isPlaceholderData, isLoading, isError } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await api.get("/groups")
      return res.data.data as Group[]
    },
    enabled: isSignedInCombined,
    // Show previous data immediately when refetching (e.g., after import)
    placeholderData: (prev) => prev,
    retry: false,
    staleTime: 10_000,
  })

  if (!isLoadedCombined) {
    return <Layout><Loading message="Loading..." /></Layout>
  }

  if (!isSignedInCombined) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="w-full max-w-md bg-[#0a0a0a] border border-gray-800">
          <CardContent className="py-12 text-center">
            <p className="text-gray-400 mb-4">Sign in to manage your shared expenses</p>
            <Link to="/login">
              <Button className="bg-white text-black hover:bg-gray-100">Sign In</Button>
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
          <Card className="bg-[#0a0a0a] border border-gray-800">
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
          <h2 className="text-2xl font-semibold text-white tracking-tight">My Groups</h2>
          <Link to="/groups/new">
            <Button size="sm" className="bg-white text-black hover:bg-gray-100">+ New Group</Button>
          </Link>
        </div>

        {!groups || groups.length === 0 ? (
          <Card className="bg-[#0a0a0a] border border-gray-800">
            <CardContent className="py-16 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-900 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-400 mb-2">No groups yet</p>
              <p className="text-xs text-gray-600 mb-6">Create your first group to start tracking expenses</p>
              <Link to="/groups/new">
                <Button className="bg-white text-black hover:bg-gray-100">Create Your First Group</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 transition-opacity duration-150 ${isPlaceholderData ? "opacity-60" : "opacity-100"}`}>
            {groups.map((group) => (
              <Link key={group.id} to={`/groups/${group.id}`} className="group">
                <Card className="bg-[#0a0a0a] border border-gray-800 hover:border-gray-700 hover:bg-[#111] transition-all h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-gray-900 border border-gray-800 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {group.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs px-2 py-0.5 bg-gray-900 text-gray-400 rounded border border-gray-800">
                        {group.default_currency}
                      </span>
                    </div>
                    <h3 className="font-medium text-white mb-1 truncate group-hover:text-gray-100">{group.name}</h3>
                    {group.description && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{group.description}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {group.member_count} member{group.member_count !== 1 ? "s" : ""}
                    </p>
                    <div className="flex items-center justify-end mt-3 pt-3 border-t border-gray-900">
                      <Link
                        to={`/groups/${group.id}/settings`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
                      >
                        Settings
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
