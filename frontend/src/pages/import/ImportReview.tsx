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
    mutationFn: async ({ anomalyId, decision, resolution }: { anomalyId: string; decision: string; resolution?: Record<string, unknown> }) => {
      await api.patch(`/imports/${jobId}/anomalies/${anomalyId}`, { decision, resolution })
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  const unresolvedErrors = anomalies.filter(
    (a) => a.severity === "error" && !decisions[a.id]
  )

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link to={`/groups/${groupId}`} className="text-xl font-semibold">Shared Expenses</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Review Import</h2>
            <p className="text-sm text-gray-500 mt-1">
              {job.filename} · {job.total_rows} rows · {anomalies.length} anomalies detected
            </p>
          </div>
          <Button
            onClick={() => commitMutation.mutate(false)}
            disabled={unresolvedErrors.length > 0 || commitMutation.isPending}
          >
            {commitMutation.isPending ? "Importing..." : "Commit Import"}
          </Button>
        </div>

        {unresolvedErrors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">
              {unresolvedErrors.length} unresolved error(s) remaining. Resolve them before committing.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => commitMutation.mutate(true)}
              className="text-red-600 mt-1"
            >
              Force Import Anyway
            </Button>
          </div>
        )}

        {anomalies.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500 text-sm">No anomalies detected. Ready to import!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {anomalies.map((anomaly) => (
              <Card key={anomaly.id} className={`py-3 px-4 ${
                anomaly.severity === "error" ? "border-red-200" :
                anomaly.severity === "warning" ? "border-yellow-200" : ""
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        anomaly.severity === "error" ? "bg-red-100 text-red-700" :
                        anomaly.severity === "warning" ? "bg-yellow-100 text-yellow-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {anomaly.severity}
                      </span>
                      <span className="text-xs text-gray-400">Row {anomaly.row_number}</span>
                      <span className="text-xs font-medium text-gray-600">{anomaly.anomaly_type}</span>
                    </div>
                    <p className="text-sm">{anomaly.message}</p>
                    {anomaly.raw_row_data && (
                      <div className="mt-1 text-xs text-gray-400 truncate">
                        {anomaly.raw_row_data.description} · {anomaly.raw_row_data.amount} {anomaly.raw_row_data.currency}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!decisions[anomaly.id]?.decision ? (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => setDecision(anomaly.id, "approve")}>Approve</Button>
                        <Button size="sm" variant="ghost" onClick={() => setDecision(anomaly.id, "reject")}>Reject</Button>
                      </>
                    ) : (
                      <span className={`text-xs font-medium ${
                        decisions[anomaly.id]?.decision === "approve" ? "text-green-600" : "text-red-600"
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