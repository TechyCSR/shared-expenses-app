import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Layout from "@/components/Layout"
import Loading from "@/components/ui/Loading"
import type { GroupMember } from "@/types"

export default function RecordSettlement() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const [fromUserId, setFromUserId] = useState("")
  const [toUserId, setToUserId] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("INR")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])

  const { data: members, isLoading } = useQuery({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/members`)
      return res.data.data as GroupMember[]
    },
    enabled: !!groupId,
  })

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post(`/groups/${groupId}/settlements`, {
        from_user_id: fromUserId,
        to_user_id: toUserId,
        amount: parseFloat(amount),
        currency,
        settlement_date: date,
      })
    },
    onSuccess: () => navigate(`/groups/${groupId}`),
  })

  if (isLoading) {
    return <Layout><Loading message="Loading members..." /></Layout>
  }

  const activeMembers = members?.filter(m => m.is_active) || []

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/groups/${groupId}`} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-semibold text-white">Record Settlement</h1>
        </div>

        <Card className="bg-[#0a0a0a] border-gray-800">
          <CardContent className="p-6">
            <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-400">From (Who paid)</label>
                  <select
                    value={fromUserId}
                    onChange={(e) => setFromUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-700 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white"
                    required
                  >
                    <option value="">Select user</option>
                    {activeMembers.map(m => (
                      <option key={m.user_id} value={m.user_id}>{m.full_name || m.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-400">To (Who received)</label>
                  <select
                    value={toUserId}
                    onChange={(e) => setToUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-700 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white"
                    required
                  >
                    <option value="">Select user</option>
                    {activeMembers.map(m => (
                      <option key={m.user_id} value={m.user_id}>{m.full_name || m.email}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-400">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-700 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-400">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-700 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-400">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-700 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  type="submit"
                  disabled={mutation.isPending || !fromUserId || !toUserId || !amount}
                  className="bg-white text-black hover:bg-gray-200"
                >
                  {mutation.isPending ? "Recording..." : "Record Settlement"}
                </Button>
                <Link to={`/groups/${groupId}`}>
                  <Button type="button" variant="secondary">Cancel</Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}