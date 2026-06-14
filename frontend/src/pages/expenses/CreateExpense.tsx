import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import type { GroupMember } from "@/types"

export default function CreateExpense() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("INR")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [splitType, setSplitType] = useState("equal")
  const [paidBy, setPaidBy] = useState("")

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
      const participants = members?.filter(m => m.is_active).map(m => ({ user_id: m.user_id })) || []
      const res = await api.post(`/groups/${groupId}/expenses`, {
        description, amount: parseFloat(amount), currency,
        expense_date: date, split_type: splitType,
        paid_by: paidBy, participants,
      })
      return res.data.data
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
          <CardHeader><CardTitle>New Expense</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount</label>
                  <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black">
                    <option value="INR">INR</option><option value="USD">USD</option><option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Split Type</label>
                  <select value={splitType} onChange={(e) => setSplitType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black">
                    <option value="equal">Equal</option>
                    <option value="unequal">Unequal</option>
                    <option value="percentage">Percentage</option>
                    <option value="shares">Shares</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Paid By</label>
                <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black" required>
                  <option value="">Select payer</option>
                  {members?.filter(m => m.is_active).map(m => (
                    <option key={m.user_id} value={m.user_id}>{m.full_name || m.email}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Creating..." : "Create Expense"}
                </Button>
                <Link to={`/groups/${groupId}`}><Button type="button" variant="secondary">Cancel</Button></Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}