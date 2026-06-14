import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import type { GroupMember } from "@/types"

export default function RecordSettlement() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const [fromUserId, setFromUserId] = useState("")
  const [toUserId, setToUserId] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("INR")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])

  const { data: members } = useQuery({
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
        from_user_id: fromUserId, to_user_id: toUserId,
        amount: parseFloat(amount), currency, settlement_date: date,
      })
    },
    onSuccess: () => navigate(`/groups/${groupId}`),
  })

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link to={`/groups/${groupId}`} className="text-xl font-semibold">Shared Expenses</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <Card>
          <CardHeader><CardTitle>Record Settlement</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">From</label>
                  <select value={fromUserId} onChange={(e) => setFromUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" required>
                    <option value="">Select user</option>
                    {members?.filter(m => m.is_active).map(m => (
                      <option key={m.user_id} value={m.user_id}>{m.full_name || m.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">To</label>
                  <select value={toUserId} onChange={(e) => setToUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" required>
                    <option value="">Select user</option>
                    {members?.filter(m => m.is_active).map(m => (
                      <option key={m.user_id} value={m.user_id}>{m.full_name || m.email}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount</label>
                  <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" required />
                </div>
              </div>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Recording..." : "Record Settlement"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}