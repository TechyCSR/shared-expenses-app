import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import type { ImportAnomaly, ImportJob } from "@/types"

type DecisionMap = Record<string, { decision: string; resolution?: Record<string, unknown> }>

export default function ImportReview() {
  const { groupId, jobId } = useParams<{ groupId: string; jobId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [decisions, setDecisions] = useState<DecisionMap>({})

  const { data: job } = useQuery({
    queryKey: ["import-job", jobId],
    queryFn: async () => {
      const res = await api.get(`/imports/${jobId}`)
      return res.data.data as ImportJob
    },
    enabled: !!jobId,
  })

  const { data: anomalies } = useQuery({
    queryKey: ["import-anomalies", jobId],
    queryFn: async () => {
      const res = await api.get(`/imports/${jobId}/anomalies`)
      return res.data.data as ImportAnomaly[]
    },
    enabled: !!jobId,
  })

  const resolveMutation = useMutation({
    mutationFn: async ({ anomalyId, decision }: { anomalyId: string; decision: string; resolution?: Record<string, unknown> }) => {
      await api.patch(`/imports/${jobId}/anomalies/${anomalyId}`, { decision })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["import-anomalies", jobId] })
    },
  })

  const commitMutation = useMutation({
    mutationFn: async (force: boolean) => {
      const res = await api.post(`/imports/${jobId}/commit`, { force })
      return res.data.data
    },
    onSuccess: () => {
      navigate(`/groups/${groupId}/import/${jobId}/report`)
    },
  })

  const setDecision = (id: string, decision: string) => {
    setDecisions((prev) => ({ ...prev, [id]: { ...prev[id], decision } }))
    resolveMutation.mutate({ anomalyId: id, decision })
  }

  if (!job || !anomalies) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const unresolvedErrors = anomalies.filter(
    (a) => a.severity === "error" && !decisions[a.id]
  )

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link to={`/groups/${groupId}`} className="text-xl font-semibold text-white">Shared Expenses</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-white">Review Import</h2>
            <p className="text-sm text-gray-400 mt-1">
              {job.filename} · {job.total_rows} rows · {anomalies.length} anomalies detected
            </p>
          </div>
          <Button
            onClick={() => commitMutation.mutate(false)}
            disabled={unresolvedErrors.length > 0 || commitMutation.isPending}
            className="bg-white text-black hover:bg-gray-200"
          >
            {commitMutation.isPending ? "Importing..." : "Commit Import"}
          </Button>
        </div>

        {unresolvedErrors.length > 0 && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-md">
            <p className="text-sm text-red-400">
              {unresolvedErrors.length} unresolved error(s) remaining. Resolve them before committing.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => commitMutation.mutate(true)}
              className="text-red-400 mt-1 hover:text-red-300 hover:bg-red-900/30"
            >
              Force Import Anyway
            </Button>
          </div>
        )}

        {anomalies.length === 0 ? (
          <Card className="bg-[#0a0a0a] border-gray-800">
            <CardContent className="py-8 text-center">
              <p className="text-gray-400 text-sm">No anomalies detected. Ready to import!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {anomalies.map((anomaly) => (
              <Card key={anomaly.id} className={`bg-[#0a0a0a] border-gray-800 ${
                anomaly.severity === "error" ? "border-red-900" :
                anomaly.severity === "warning" ? "border-yellow-900" : ""
              }`}>
                <div className="flex items-start justify-between gap-4 py-3 px-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        anomaly.severity === "error" ? "bg-red-900/50 text-red-400" :
                        anomaly.severity === "warning" ? "bg-yellow-900/50 text-yellow-400" :
                        "bg-blue-900/50 text-blue-400"
                      }`}>
                        {anomaly.severity}
                      </span>
                      <span className="text-xs text-gray-500">Row {anomaly.row_number}</span>
                      <span className="text-xs font-medium text-gray-300">{anomaly.anomaly_type}</span>
                    </div>
                    <p className="text-sm text-gray-300">{anomaly.message}</p>
                    {anomaly.raw_row_data && (
                      <div className="mt-1 text-xs text-gray-600 truncate">
                        {anomaly.raw_row_data.description} · {anomaly.raw_row_data.amount} {anomaly.raw_row_data.currency}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!decisions[anomaly.id]?.decision ? (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => setDecision(anomaly.id, "approve")} className="text-green-400 hover:text-green-300">Approve</Button>
                        <Button size="sm" variant="ghost" onClick={() => setDecision(anomaly.id, "reject")} className="text-red-400 hover:text-red-300">Reject</Button>
                      </>
                    ) : (
                      <span className={`text-xs font-medium ${
                        decisions[anomaly.id]?.decision === "approve" ? "text-green-400" : "text-red-400"
                      }`}>
                        {decisions[anomaly.id]?.decision === "approve" ? "Approved" : "Rejected"}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}