import { useQuery } from "@tanstack/react-query"
import { useUser, useClerk } from "@clerk/clerk-react"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import type { Group } from "@/types"
import { Link } from "react-router-dom"

export default function Dashboard() {
  const { user, isSignedIn } = useUser()
  const { signOut } = useClerk()

  const { data: groups, isLoading, isError } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await api.get("/groups")
      return res.data.data as Group[]
    },
    enabled: isSignedIn,
    retry: false,
  })

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="w-full max-w-md bg-[#0a0a0a] border-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Welcome to Shared Expenses</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
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
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="w-full max-w-md bg-[#0a0a0a] border-gray-800">
          <CardContent className="py-12 text-center">
            <p className="text-red-400 mb-4">Failed to load groups</p>
            <Link to="/login">
              <Button variant="secondary">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Shared Expenses</h1>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                <img
                  src={user.imageUrl}
                  alt={user.fullName || "User"}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm text-gray-300 hidden sm:block">
                  {user.fullName}
                </span>
              </div>
            )}
            <Link to="/settings">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800">
                Settings
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-800"
              onClick={() => signOut()}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-white">Dashboard</h2>
          <Link to="/groups/new">
            <Button size="sm" className="bg-white text-black hover:bg-gray-200">New Group</Button>
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
          <div className="grid gap-4">
            {groups.map((group) => (
              <Link key={group.id} to={`/groups/${group.id}`}>
                <Card className="bg-[#0a0a0a] border-gray-800 hover:border-gray-700 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-white">{group.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      <span>{group.member_count} members</span>
                      <span>{group.default_currency}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}