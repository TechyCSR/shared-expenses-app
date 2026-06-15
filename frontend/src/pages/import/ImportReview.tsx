import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Layout from "@/components/Layout"
import Loading from "@/components/ui/Loading"
import type { ImportAnomaly, ImportJob } from "@/types"

export default function ImportReview() {
  const { groupId, jobId } = useParams<{ groupId: string; jobId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<"all" | "error" | "warning" | "info">("all")

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ["import-job", jobId],
    queryFn: async () => {
      const res = await api.get(`/imports/${jobId}`)
      return res.data.data as ImportJob
    },
    enabled: !!jobId,
  })

  const { data: anomalies, isLoading: anomaliesLoading } = useQuery({
    queryKey: ["import-anomalies", jobId],
    queryFn: async () => {
      const res = await api.get(`/imports/${jobId}/anomalies`)
      return res.data.data as ImportAnomaly[]
    },
    enabled: !!jobId,
  })

  const resolveMutation = useMutation({
    mutationFn: async ({ anomalyId, decision }: { anomalyId: string; decision: string }) => {
      await api.patch(`/imports/${jobId}/anomalies/${anomalyId}`, { decision })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["import-anomalies", jobId] })
    },
  })

  const approveAllMutation = useMutation({
    mutationFn: async (decision: "approve" | "reject") => {
      const res = await api.post(`/imports/${jobId}/approve-all`, { decision })
      return res.data.data
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
      // Refresh dashboard data so expenses show up
      queryClient.invalidateQueries({ queryKey: ["expenses", groupId] })
      queryClient.invalidateQueries({ queryKey: ["balances", groupId] })
      queryClient.invalidateQueries({ queryKey: ["groups"] })
      navigate(`/groups/${groupId}/import/${jobId}/report`)
    },
  })

  if (jobLoading || anomaliesLoading) {
    return <Layout><Loading message="Loading import..." /></Layout>
  }

  if (!job) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-6 py-8">
          <p className="text-gray-400">Import not found</p>
        </div>
      </Layout>
    )
  }

  const errorCount = anomalies?.filter(a => a.severity === "error").length || 0
  const warningCount = anomalies?.filter(a => a.severity === "warning").length || 0
  const infoCount = anomalies?.filter(a => a.severity === "info").length || 0
  const unresolvedErrors = anomalies?.filter(a => a.severity === "error" && !a.user_decision) || []
  const unresolvedAll = anomalies?.filter(a => !a.user_decision) || []

  const filteredAnomalies = anomalies?.filter(a => filter === "all" ? true : a.severity === filter) || []

  const handleApproveAll = () => {
    if (confirm(`This will approve ALL ${unresolvedAll.length} unresolved anomalies. Continue?`)) {
      approveAllMutation.mutate("approve")
    }
  }

  const handleRejectAll = () => {
    if (confirm(`This will reject ALL ${unresolvedAll.length} unresolved anomalies. Continue?`)) {
      approveAllMutation.mutate("reject")
    }
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/groups/${groupId}`} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-white">Review Import</h1>
            <p className="text-sm text-gray-400 mt-1">
              {job.filename} · {job.total_rows} rows · {anomalies?.length || 0} anomalies
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

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-[#0a0a0a] border-red-900">
            <CardContent className="p-4">
              <p className="text-xs text-red-400 uppercase tracking-wide">Errors</p>
              <p className="text-2xl font-semibold text-white mt-1">{errorCount}</p>
              <p className="text-xs text-gray-500 mt-1">{unresolvedErrors.length} unresolved</p>
            </CardContent>
          </Card>
          <Card className="bg-[#0a0a0a] border-yellow-900">
            <CardContent className="p-4">
              <p className="text-xs text-yellow-400 uppercase tracking-wide">Warnings</p>
              <p className="text-2xl font-semibold text-white mt-1">{warningCount}</p>
              <p className="text-xs text-gray-500 mt-1">Auto-handled</p>
            </CardContent>
          </Card>
          <Card className="bg-[#0a0a0a] border-blue-900">
            <CardContent className="p-4">
              <p className="text-xs text-blue-400 uppercase tracking-wide">Info</p>
              <p className="text-2xl font-semibold text-white mt-1">{infoCount}</p>
              <p className="text-xs text-gray-500 mt-1">Notes</p>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Actions */}
        {unresolvedAll.length > 0 && (
          <Card className="bg-[#0a0a0a] border-2 border-gray-700 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white">Bulk Actions</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {unresolvedAll.length} anomalies awaiting decision
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleApproveAll}
                    disabled={approveAllMutation.isPending}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve All
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRejectAll}
                    disabled={approveAllMutation.isPending}
                    className="text-red-400 hover:text-red-300"
                  >
                    Reject All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter Tabs */}
        {anomalies && anomalies.length > 0 && (
          <div className="flex gap-1 mb-4 border-b border-gray-800">
            {(["all", "error", "warning", "info"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                  filter === f
                    ? "border-white text-white"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                {f}
                {f !== "all" && (
                  <span className="ml-1.5 text-xs">
                    ({f === "error" ? errorCount : f === "warning" ? warningCount : infoCount})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Unresolved Errors Warning */}
        {unresolvedErrors.length > 0 && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-md">
            <p className="text-sm text-red-400">
              ⚠ {unresolvedErrors.length} unresolved error(s) must be resolved or approved before committing.
            </p>
          </div>
        )}

        {/* Anomalies List */}
        {!anomalies || anomalies.length === 0 ? (
          <Card className="bg-[#0a0a0a] border-gray-800">
            <CardContent className="py-12 text-center">
              <svg className="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-300 text-sm">No anomalies detected! Ready to import.</p>
              <Button
                size="sm"
                onClick={() => commitMutation.mutate(false)}
                disabled={commitMutation.isPending}
                className="mt-4 bg-white text-black hover:bg-gray-200"
              >
                {commitMutation.isPending ? "Importing..." : "Commit Import"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredAnomalies.map((anomaly) => (
              <Card key={anomaly.id} className={`bg-[#0a0a0a] border-gray-800 ${
                anomaly.severity === "error" ? "border-red-900/50" :
                anomaly.severity === "warning" ? "border-yellow-900/50" : ""
              }`}>
                <div className="flex items-start justify-between gap-4 py-3 px-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded uppercase ${
                        anomaly.severity === "error" ? "bg-red-900/50 text-red-400" :
                        anomaly.severity === "warning" ? "bg-yellow-900/50 text-yellow-400" :
                        "bg-blue-900/50 text-blue-400"
                      }`}>
                        {anomaly.severity}
                      </span>
                      <span className="text-xs text-gray-500">Row {anomaly.row_number}</span>
                      <span className="text-xs font-medium text-gray-300">{anomaly.anomaly_type}</span>
                      {anomaly.user_decision && (
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                          anomaly.user_decision === "approve" 
                            ? "bg-green-900/30 text-green-400" 
                            : "bg-red-900/30 text-red-400"
                        }`}>
                          {anomaly.user_decision === "approve" ? "✓ Approved" : "✗ Rejected"}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300">{anomaly.message}</p>
                    {anomaly.raw_row_data && (
                      <div className="mt-2 p-2 bg-gray-900/50 rounded text-xs">
                        <p className="text-gray-500 mb-1">Raw row:</p>
                        <p className="text-gray-400 truncate">
                          {anomaly.raw_row_data.description || "(no description)"} · {anomaly.raw_row_data.amount || "?"} {anomaly.raw_row_data.currency || ""}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!anomaly.user_decision ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => resolveMutation.mutate({ anomalyId: anomaly.id, decision: "approve" })}
                          className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
                          disabled={resolveMutation.isPending}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => resolveMutation.mutate({ anomalyId: anomaly.id, decision: "reject" })}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          disabled={resolveMutation.isPending}
                        >
                          Reject
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => resolveMutation.mutate({ anomalyId: anomaly.id, decision: "" })}
                        className="text-gray-400 hover:text-gray-300"
                        title="Reset decision"
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}