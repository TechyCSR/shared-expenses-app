import { useQuery } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import type { Group } from "@/types"
import { Link } from "react-router-dom"
import { useClerk, useUser } from "@clerk/clerk-react"

export default function GroupsList() {
  const { user } = useUser()
  const { signOut } = useClerk()

  const { data: groups } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await api.get("/groups")
      return res.data.data as Group[]
    },
  })

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold text-white">Shared Expenses</Link>
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">Groups</h2>
          <Link to="/groups/new">
            <Button size="sm" className="bg-white text-black hover:bg-gray-200">New Group</Button>
          </Link>
        </div>
        <div className="grid gap-4">
          {groups?.map((group) => (
            <Link key={group.id} to={`/groups/${group.id}`}>
              <Card className="bg-[#0a0a0a] border-gray-800 hover:border-gray-700 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-white">{group.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-gray-400">
                    <span>{group.member_count} members</span>
                    <span>{group.default_currency}</span>
                    {group.description && <span className="truncate">{group.description}</span>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}