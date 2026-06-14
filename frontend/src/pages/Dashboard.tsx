import { useQuery } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import type { Group } from "@/types"
import { Link } from "react-router-dom"

export default function Dashboard() {
  const { data: groups } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await api.get("/groups")
      return res.data.data as Group[]
    },
  })

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Shared Expenses</h1>
          <div className="flex items-center gap-3">
            <Link to="/groups"><Button variant="ghost" size="sm">Groups</Button></Link>
            <Link to="/settings"><Button variant="ghost" size="sm">Settings</Button></Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold">Dashboard</h2>
          <Link to="/groups/new">
            <Button size="sm">New Group</Button>
          </Link>
        </div>

        {!groups || groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">No groups yet</p>
              <Link to="/groups/new">
                <Button>Create Your First Group</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {groups.map((group) => (
              <Link key={group.id} to={`/groups/${group.id}`}>
                <Card className="hover:border-gray-400 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle>{group.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
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