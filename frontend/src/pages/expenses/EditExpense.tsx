import { useParams, Link, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import type { Expense, GroupMember } from "@/types"

export default function EditExpense() {
  const { groupId, expenseId } = useParams<{ groupId: string; expenseId: string }>()
  const navigate = useNavigate()
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("INR")
  const [date, setDate] = useState("")
  const [splitType, setSplitType] = useState("equal")
  const [paidBy, setPaidBy] = useState("")

  const { data: expense } = useQuery({
    queryKey: ["expense", expenseId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/expenses/${expenseId}`)
      return res.data.data as Expense
    },
    enabled: !!expenseId,
  })

  const { data: members } = useQuery({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/members`)
      return res.data.data as GroupMember[]
    },
    enabled: !!groupId,
  })

  if (expense && !date) {
    setDescription(expense.description)
    setAmount(expense.amount.toString())
    setCurrency(expense.currency)
    setDate(expense.expense_date)
    setSplitType(expense.split_type)
    setPaidBy(expense.paid_by)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.put(`/groups/${groupId}/expenses/${expenseId}`, {
        description, amount: parseFloat(amount), currency,
        expense_date: date, split_type: splitType, paid_by: paidBy,
      })
      navigate(`/groups/${groupId}/expenses/${expenseId}`)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link to={`/groups/${groupId}`} className="text-xl font-semibold text-white">Shared Expenses</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Card className="bg-[#0a0a0a] border-gray-800">
          <CardHeader><CardTitle className="text-white">Edit Expense</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-700 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Amount</label>
                  <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-700 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-700 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white">
                    <option value="INR">INR</option><option value="USD">USD</option><option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-700 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Split Type</label>
                  <select value={splitType} onChange={(e) => setSplitType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-700 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white">
                    <option value="equal">Equal</option>
                    <option value="unequal">Unequal</option>
                    <option value="percentage">Percentage</option>
                    <option value="shares">Shares</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Paid By</label>
                <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-700 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white" required>
                  <option value="">Select payer</option>
                  {members?.filter(m => m.is_active).map(m => (
                    <option key={m.user_id} value={m.user_id}>{m.full_name || m.email}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="bg-white text-black hover:bg-gray-200">Save Changes</Button>
                <Link to={`/groups/${groupId}/expenses/${expenseId}`}><Button type="button" variant="secondary">Cancel</Button></Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}