import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

export default function CreateGroup() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [currency, setCurrency] = useState("INR")

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/groups", { name, description, default_currency: currency })
      return res.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] })
      navigate(`/groups/${data.id}`)
    },
  })

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link to="/groups" className="text-xl font-semibold">Shared Expenses</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create Group</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Group Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Default Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={mutation.isPending || !name.trim()}>
                  {mutation.isPending ? "Creating..." : "Create Group"}
                </Button>
                <Link to="/groups"><Button type="button" variant="secondary">Cancel</Button></Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}