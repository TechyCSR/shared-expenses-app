import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Layout from "@/components/Layout"
import Loading from "@/components/ui/Loading"
import { useUser } from "@clerk/clerk-react"
import type { GroupMember } from "@/types"

export default function CreateExpense() {
  const { groupId } = useParams<{ groupId: string }>()
  const { user } = useUser()
  const navigate = useNavigate()
  
  // Form state
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("INR")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [splitType, setSplitType] = useState("equal")
  const [paidBy, setPaidBy] = useState("")
  
  // For unequal splits: how much each person owes
  const [participantAmounts, setParticipantAmounts] = useState<Record<string, string>>({})

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
      let participants: Array<{ user_id: string; amount_owed?: string; share_value?: string }>
      
      if (splitType === "equal") {
        // Equal split - all active members split equally
        participants = activeMembers.map(m => ({ user_id: m.user_id }))
      } else if (splitType === "unequal") {
        // Unequal split - for unequal, we use share_value to represent the actual amount
        // Backend will calculate: amount_owed = (amount * share_value / total_share_value)
        // So we pass the actual amounts in share_value and let backend normalize them
        participants = activeMembers
          .filter(m => participantAmounts[m.user_id] && parseFloat(participantAmounts[m.user_id]) > 0)
          .map(m => ({ 
            user_id: m.user_id, 
            share_value: participantAmounts[m.user_id] 
          }))
      } else if (splitType === "percentage") {
        // Percentage split - share_value is the percentage
        participants = activeMembers.map(m => ({ 
          user_id: m.user_id, 
          share_value: participantAmounts[m.user_id] || "0" 
        }))
      } else {
        participants = activeMembers.map(m => ({ user_id: m.user_id }))
      }

      const res = await api.post(`/groups/${groupId}/expenses`, {
        description,
        amount: parseFloat(amount),
        currency,
        expense_date: date,
        split_type: splitType,
        paid_by: paidBy,
        participants,
      })
      return res.data.data
    },
    onSuccess: () => navigate(`/groups/${groupId}`),
    onError: (err: any) => {
      console.error("Failed to create expense:", err)
      alert(err?.response?.data?.error?.message || "Failed to create expense. Make sure the payer is a group member on the expense date.")
    },
  })

  if (isLoading) {
    return <Layout><Loading message="Loading members..." /></Layout>
  }

  const activeMembers = members?.filter(m => m.is_active) || []

  // Initialize participant amounts when members change
  const initializeAmounts = () => {
    const amounts: Record<string, string> = {}
    activeMembers.forEach(m => {
      if (splitType === "unequal") {
        // For unequal, default to 0
        amounts[m.user_id] = "0"
      } else if (splitType === "percentage") {
        // For percentage, default to 0
        amounts[m.user_id] = "0"
      }
    })
    setParticipantAmounts(amounts)
  }

  const handleSplitTypeChange = (newType: string) => {
    setSplitType(newType)
    // Re-initialize amounts when split type changes
    setTimeout(initializeAmounts, 0)
  }

  // Calculate summary for unequal/percentage/shares
  const totalAllocated = Object.values(participantAmounts)
    .reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
  
  const remaining = parseFloat(amount || "0") - totalAllocated

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/groups/${groupId}`} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-semibold text-white">New Expense</h1>
        </div>

        <Card className="bg-[#0a0a0a] border-gray-800">
          <CardContent className="p-6">
            <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-6">
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-300">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-600 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all placeholder-gray-500"
                  placeholder="e.g., Dinner at restaurant"
                  required
                />
              </div>

              {/* Amount and Currency */}
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
                    placeholder="0.00"
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

              {/* Date and Split Type */}
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
                    onChange={(e) => handleSplitTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-600 rounded-md text-sm bg-black text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all"
                  >
                    <option value="equal">Equal (split evenly)</option>
                    <option value="unequal">Unequal (specify amounts)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
              </div>

              {/* Paid By */}
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
                <p className="text-xs text-gray-500 mt-1">The person who paid for this expense</p>
              </div>

              {/* Split Configuration - Only show for unequal/percentage */}
              {(splitType === "unequal" || splitType === "percentage") && (
                <div className="border-2 border-gray-600 rounded-lg p-4 space-y-4 bg-gray-900/30">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-white">
                      {splitType === "unequal" ? "Amount Each Person Pays (proportional)" : 
                       "Percentage Each Person Pays"}
                    </h3>
                    {splitType === "unequal" && (
                      <span className={`text-xs ${Math.abs(remaining) < 0.01 ? "text-green-400" : "text-red-400"}`}>
                        Remaining: {remaining.toFixed(2)} / {amount || "0"}
                      </span>
                    )}
                    {splitType === "percentage" && (
                      <span className={`text-xs ${Math.abs(totalAllocated - 100) < 0.01 ? "text-green-400" : "text-red-400"}`}>
                        Total: {totalAllocated.toFixed(1)}% / 100%
                      </span>
                    )}
                  </div>

                  {activeMembers.length === 0 ? (
                    <p className="text-sm text-gray-500">No active members in this group</p>
                  ) : (
                    <div className="space-y-2">
                      {activeMembers.map(m => (
                        <div key={m.user_id} className="flex items-center gap-3">
                          <span className="text-sm text-white w-32 truncate">
                            {m.full_name || m.email}
                          </span>
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
                  )}

                  {/* Quick fill buttons for equal split */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const equalAmount = (parseFloat(amount || "0") / activeMembers.length).toFixed(2)
                        const amounts: Record<string, string> = {}
                        activeMembers.forEach(m => { amounts[m.user_id] = equalAmount })
                        setParticipantAmounts(amounts)
                      }}
                    >
                      Split Equally
                    </Button>
                    {splitType === "percentage" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const equalPercent = (100 / activeMembers.length).toFixed(1)
                          const amounts: Record<string, string> = {}
                          activeMembers.forEach(m => { amounts[m.user_id] = equalPercent })
                          setParticipantAmounts(amounts)
                        }}
                      >
                        Equal Percentage
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Summary for Equal Split */}
              {splitType === "equal" && amount && activeMembers.length > 0 && (
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-white mb-2">Split Summary</h3>
                  <p className="text-sm text-gray-400">
                    {(parseFloat(amount) / activeMembers.length).toFixed(2)} {currency} × {activeMembers.length} members
                  </p>
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={mutation.isPending || !paidBy || (splitType !== "equal" && Object.values(participantAmounts).every(v => !v || v === "0"))}
                  className="bg-white text-black hover:bg-gray-200"
                >
                  {mutation.isPending ? "Creating..." : "Create Expense"}
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