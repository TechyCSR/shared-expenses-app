import { useParams, Link, useNavigate } from "react-router-dom"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import api from "@/services/api"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Layout from "@/components/Layout"
import Loading from "@/components/ui/Loading"
import type { Expense, GroupMember } from "@/types"
import { formatAmount } from "@/utils/format"

export default function EditExpense() {
  const { groupId, expenseId } = useParams<{ groupId: string; expenseId: string }>()
  const navigate = useNavigate()
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("INR")
  const [date, setDate] = useState("")
  const [splitType, setSplitType] = useState("equal")
  const [paidBy, setPaidBy] = useState("")
  const [participantAmounts, setParticipantAmounts] = useState<Record<string, string>>({})
  const [initialized, setInitialized] = useState(false)

  const { data: expense, isLoading: expenseLoading } = useQuery({
    queryKey: ["expense", expenseId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/expenses/${expenseId}`)
      return res.data.data as Expense
    },
    enabled: !!expenseId,
  })

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/members`)
      return res.data.data as GroupMember[]
    },
    enabled: !!groupId,
  })

  // Initialize form when expense data loads
  useEffect(() => {
    if (expense && !initialized) {
      setDescription(expense.description)
      setAmount(formatAmount(expense.amount))
      setCurrency(expense.currency)
      setDate(expense.expense_date)
      setSplitType(expense.split_type)
      setPaidBy(expense.paid_by)
      
      // Initialize participant amounts from expense data
      if (expense.participants && expense.participants.length > 0) {
        const amounts: Record<string, string> = {}
        expense.participants.forEach(p => {
          if (expense.split_type === "unequal" || expense.split_type === "percentage" || expense.split_type === "shares") {
            amounts[p.user_id] = p.share_value ? formatAmount(p.share_value) : "0"
          }
        })
        setParticipantAmounts(amounts)
      }
      setInitialized(true)
    }
  }, [expense, initialized])

  const updateMutation = useMutation({
    mutationFn: async () => {
      let participants: Array<{ user_id: string; share_value?: string }>
      
      if (splitType === "equal") {
        participants = (members?.filter(m => m.is_active).map(m => ({ user_id: m.user_id })) || [])
      } else if (splitType === "unequal") {
        participants = (members?.filter(m => m.is_active) || [])
          .filter(m => participantAmounts[m.user_id] && parseFloat(participantAmounts[m.user_id]) > 0)
          .map(m => ({ 
            user_id: m.user_id, 
            share_value: participantAmounts[m.user_id] 
          }))
      } else if (splitType === "percentage") {
        participants = (members?.filter(m => m.is_active).map(m => ({ 
          user_id: m.user_id, 
          share_value: participantAmounts[m.user_id] || "0" 
        })) || [])
      } else {
        participants = (members?.filter(m => m.is_active).map(m => ({ user_id: m.user_id })) || [])
      }

      const res = await api.put(`/groups/${groupId}/expenses/${expenseId}`, {
        description,
        amount: parseFloat(amount),
        currency,
        expense_date: date,
        split_type: splitType,
        paid_by: paidBy,
        participants,
      })
      return res.data
    },
    onSuccess: () => {
      navigate(`/groups/${groupId}/expenses/${expenseId}`)
    },
    onError: (err: any) => {
      console.error("Update failed:", err)
      alert(err?.response?.data?.error?.message || "Failed to update expense")
    },
  })

  if (expenseLoading || membersLoading) {
    return <Layout><Loading message="Loading expense..." /></Layout>
  }

  if (!expense) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-6 py-8">
          <p className="text-gray-400">Expense not found</p>
        </div>
      </Layout>
    )
  }

  const activeMembers = members?.filter(m => m.is_active) || []
  const totalAllocated = Object.values(participantAmounts)
    .reduce((sum, val) => sum + (parseFloat(val) || 0), 0)

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/groups/${groupId}/expenses/${expenseId}`} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-semibold text-white">Edit Expense</h1>
        </div>

        <Card className="bg-[#0a0a0a] border-gray-800">
          <CardContent className="p-6">
            <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate() }} className="space-y-6">
              
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-300">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-600 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all placeholder-gray-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-300">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-600 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all placeholder-gray-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-300">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-600 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-300">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-600 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
                    style={{ colorScheme: 'dark' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-300">Split Type</label>
                  <select
                    value={splitType}
                    onChange={(e) => setSplitType(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-600 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
                  >
                    <option value="equal">Equal (split evenly)</option>
                    <option value="unequal">Unequal (specify amounts)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-300">Paid By</label>
                <select
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-600 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
                  required
                >
                  <option value="">Select who paid</option>
                  {activeMembers.map(m => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.full_name || m.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Split Configuration */}
              {(splitType === "unequal" || splitType === "percentage") && (
                <div className="border-2 border-gray-600 rounded-lg p-4 space-y-4 bg-gray-900/30">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-white">
                      {splitType === "unequal" ? "Amount Each Person Pays (proportional)" : "Percentage Each Person Pays"}
                    </h3>
                    {splitType === "unequal" && (
                      <span className={`text-xs ${Math.abs(parseFloat(amount || "0") - totalAllocated) < 0.01 ? "text-green-400" : "text-red-400"}`}>
                        Remaining: {(parseFloat(amount || "0") - totalAllocated).toFixed(2)} / {amount || "0"}
                      </span>
                    )}
                    {splitType === "percentage" && (
                      <span className={`text-xs ${Math.abs(totalAllocated - 100) < 0.01 ? "text-green-400" : "text-red-400"}`}>
                        Total: {totalAllocated.toFixed(1)}% / 100%
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {activeMembers.map(m => (
                      <div key={m.user_id} className="flex items-center gap-3">
                        <span className="text-sm text-white w-32 truncate">{m.full_name || m.email}</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={participantAmounts[m.user_id] || ""}
                          onChange={(e) => setParticipantAmounts(prev => ({
                            ...prev,
                            [m.user_id]: e.target.value
                          }))}
                          className="flex-1 px-3 py-1.5 border-2 border-gray-600 rounded text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all placeholder-gray-500"
                          placeholder="0.00"
                        />
                        <span className="text-xs text-gray-400 w-12 text-right">
                          {splitType === "unequal" ? currency : "%"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending || !paidBy}
                  className="bg-white text-black hover:bg-gray-200"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Link to={`/groups/${groupId}/expenses/${expenseId}`}>
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