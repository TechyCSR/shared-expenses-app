import { useQuery } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import type { Group } from "@/types"
import { Link } from "react-router-dom"

export default function GroupsList() {
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
          <Link to="/" className="text-xl font-semibold">Shared Expenses</Link>
          <Link to="/groups/new"><Button size="sm">New Group</Button></Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold mb-6">Groups</h2>
        <div className="grid gap-4">
          {groups?.map((group) => (
            <Link key={group.id} to={`/groups/${group.id}`}>
              <Card className="hover:border-gray-400 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle>{group.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
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