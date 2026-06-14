import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Layout from "@/components/Layout"

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
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Card className="bg-[#0a0a0a] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Create Group</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Group Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-700 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-700 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Default Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-700 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={mutation.isPending || !name.trim()} className="bg-white text-black hover:bg-gray-200">
                  {mutation.isPending ? "Creating..." : "Create Group"}
                </Button>
                <Link to="/groups"><Button type="button" variant="secondary">Cancel</Button></Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}