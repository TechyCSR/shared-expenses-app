import { useState, useMemo } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Layout from "@/components/Layout"
import Loading from "@/components/ui/Loading"
import type { ImportAnomaly } from "@/types"

interface ImportSummary {
  job: {
    id: string
    status: string
    total_rows: number
    imported_rows: number
    rejected_rows: number
    filename: string
  }
  anomalies: ImportAnomaly[]
  policy: Record<string, { default: string; reason: string }>
}

const SEVERITY_STYLES: Record<string, string> = {
  error: "border-red-500/30 bg-red-500/5",
  warning: "border-yellow-500/30 bg-yellow-500/5",
  info: "border-blue-500/30 bg-blue-500/5",
}

const SEVERITY_BADGE: Record<string, string> = {
  error: "bg-red-500/20 text-red-300 border-red-500/30",
  warning: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  info: "bg-blue-500/20 text-blue-300 border-blue-500/30",
}

export default function ImportReview() {
  const { groupId, jobId } = useParams<{ groupId: string; jobId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<"all" | "error" | "warning" | "info">("all")

  // Single API call fetches everything
  const { data: summary, isLoading } = useQuery({
    queryKey: ["import-summary", jobId],
    queryFn: async () => {
      const res = await api.get(`/imports/${jobId}/summary`)
      return res.data.data as ImportSummary
    },
    enabled: !!jobId,
    staleTime: 30_000,
  })

  // Optimistic single anomaly decision
  const resolveMutation = useMutation({
    mutationFn: async ({ anomalyId, decision }: { anomalyId: string; decision: string }) => {
      if (decision === "") {
        // Reset = send empty/null
        return api.patch(`/imports/${jobId}/anomalies/${anomalyId}`, { decision: "approve" }).then(() => {})
      }
      await api.patch(`/imports/${jobId}/anomalies/${anomalyId}`, { decision })
    },
    onMutate: async ({ anomalyId, decision }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["import-summary", jobId] })
      const previous = queryClient.getQueryData<ImportSummary>(["import-summary", jobId])
      if (previous) {
        queryClient.setQueryData<ImportSummary>(["import-summary", jobId], {
          ...previous,
          anomalies: previous.anomalies.map(a =>
            a.id === anomalyId
              ? { ...a, user_decision: decision || null, resolved_at: new Date().toISOString() }
              : a
          ),
        })
      }
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["import-summary", jobId], ctx.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["import-summary", jobId] })
    },
  })

  // Single bulk API call for "Approve All"
  const approveAllMutation = useMutation({
    mutationFn: async (decision: "approve" | "reject") => {
      const res = await api.post(`/imports/${jobId}/approve-all`, { decision })
      return res.data.data
    },
    onMutate: async (decision) => {
      await queryClient.cancelQueries({ queryKey: ["import-summary", jobId] })
      const previous = queryClient.getQueryData<ImportSummary>(["import-summary", jobId])
      if (previous) {
        const now = new Date().toISOString()
        queryClient.setQueryData<ImportSummary>(["import-summary", jobId], {
          ...previous,
          anomalies: previous.anomalies.map(a =>
            !a.user_decision ? { ...a, user_decision: decision, resolved_at: now } : a
          ),
        })
      }
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["import-summary", jobId], ctx.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["import-summary", jobId] })
    },
  })

  const commitMutation = useMutation({
    mutationFn: async (force: boolean) => {
      const res = await api.post(`/imports/${jobId}/commit`, { force })
      return res.data.data
    },
    onSuccess: () => {
      // Invalidate all related queries so dashboard/group updates immediately
      queryClient.invalidateQueries({ queryKey: ["expenses", groupId] })
      queryClient.invalidateQueries({ queryKey: ["balances", groupId] })
      queryClient.invalidateQueries({ queryKey: ["groups"] })
      queryClient.invalidateQueries({ queryKey: ["import-summary", jobId] })
      navigate(`/groups/${groupId}/import/${jobId}/report`)
    },
  })

  const stats = useMemo(() => {
    if (!summary) return { error: 0, warning: 0, info: 0, unresolved: 0, total: 0 }
    const anomalies = summary.anomalies || []
    return {
      error: anomalies.filter(a => a.severity === "error").length,
      warning: anomalies.filter(a => a.severity === "warning").length,
      info: anomalies.filter(a => a.severity === "info").length,
      unresolved: anomalies.filter(a => !a.user_decision).length,
      total: anomalies.length,
    }
  }, [summary])

  const filteredAnomalies = useMemo(() => {
    if (!summary) return []
    return filter === "all"
      ? summary.anomalies
      : summary.anomalies.filter(a => a.severity === filter)
  }, [summary, filter])

  if (isLoading || !summary) {
    return <Layout><Loading message="Loading import..." /></Layout>
  }

  const { job, anomalies, policy } = summary
  const unresolvedErrors = anomalies.filter(a => a.severity === "error" && !a.user_decision)

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to={`/groups/${groupId}`} className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tight">Review Import</h1>
              <p className="text-sm text-gray-500 mt-0.5 font-mono">{job.filename}</p>
            </div>
          </div>
          <Button
            onClick={() => commitMutation.mutate(false)}
            disabled={unresolvedErrors.length > 0 || commitMutation.isPending}
            className="bg-white text-black hover:bg-gray-100 font-medium"
          >
            {commitMutation.isPending ? "Importing..." : "Commit Import"}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Rows" value={job.total_rows} accent="white" />
          <StatCard label="Errors" value={stats.error} accent="red" />
          <StatCard label="Warnings" value={stats.warning} accent="yellow" />
          <StatCard label="Unresolved" value={stats.unresolved} accent="blue" />
        </div>

        {/* Bulk Actions */}
        {stats.unresolved > 0 && (
          <Card className="bg-[#0a0a0a] border border-gray-800 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-white">Bulk Actions</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {stats.unresolved} of {stats.total} anomalies awaiting decision
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => approveAllMutation.mutate("approve")}
                    disabled={approveAllMutation.isPending}
                    className="border-gray-700 hover:bg-gray-800"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve All
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => approveAllMutation.mutate("reject")}
                    disabled={approveAllMutation.isPending}
                    className="text-gray-400 hover:text-red-400"
                  >
                    Reject All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Unresolved Error Warning */}
        {unresolvedErrors.length > 0 && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-300">
              ⚠ {unresolvedErrors.length} unresolved error{unresolvedErrors.length !== 1 ? "s" : ""} must be resolved before committing.
            </p>
          </div>
        )}

        {/* Filter Tabs */}
        {anomalies.length > 0 && (
          <div className="flex gap-1 mb-4 border-b border-gray-800">
            {(["all", "error", "warning", "info"] as const).map((f) => {
              const count = f === "all" ? stats.total : f === "error" ? stats.error : f === "warning" ? stats.warning : stats.info
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                    filter === f ? "border-white text-white" : "border-transparent text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {f}
                  <span className="ml-2 text-xs text-gray-600">{count}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {anomalies.length === 0 ? (
          <Card className="bg-[#0a0a0a] border border-gray-800">
            <CardContent className="py-12 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-300 text-sm">No anomalies detected. Ready to import.</p>
              <Button
                size="sm"
                onClick={() => commitMutation.mutate(false)}
                disabled={commitMutation.isPending}
                className="mt-4 bg-white text-black hover:bg-gray-100"
              >
                {commitMutation.isPending ? "Importing..." : "Commit Import"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredAnomalies.map((anomaly) => (
              <AnomalyRow
                key={anomaly.id}
                anomaly={anomaly}
                policyReason={policy[anomaly.anomaly_type]?.reason}
                onApprove={() => resolveMutation.mutate({ anomalyId: anomaly.id, decision: "approve" })}
                onReject={() => resolveMutation.mutate({ anomalyId: anomaly.id, decision: "reject" })}
                onReset={() => resolveMutation.mutate({ anomalyId: anomaly.id, decision: "" })}
                disabled={resolveMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: "white" | "red" | "yellow" | "blue" }) {
  const colors = {
    white: "border-gray-800 text-white",
    red: "border-red-500/30 text-red-400",
    yellow: "border-yellow-500/30 text-yellow-400",
    blue: "border-blue-500/30 text-blue-400",
  }
  return (
    <Card className={`bg-[#0a0a0a] border ${colors[accent]}`}>
      <CardContent className="p-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-semibold mt-1 tabular-nums ${colors[accent].split(" ")[1]}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

function AnomalyRow({
  anomaly,
  policyReason,
  onApprove,
  onReject,
  onReset,
  disabled,
}: {
  anomaly: ImportAnomaly
  policyReason?: string
  onApprove: () => void
  onReject: () => void
  onReset: () => void
  disabled: boolean
}) {
  return (
    <Card className={`bg-[#0a0a0a] border ${SEVERITY_STYLES[anomaly.severity] || "border-gray-800"}`}>
      <div className="flex items-start justify-between gap-4 py-3 px-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded border uppercase ${SEVERITY_BADGE[anomaly.severity]}`}>
              {anomaly.severity}
            </span>
            <span className="text-xs text-gray-500 tabular-nums">Row {anomaly.row_number}</span>
            <span className="text-xs font-medium text-gray-300">{anomaly.anomaly_type}</span>
            {anomaly.user_decision && (
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                anomaly.user_decision === "approve"
                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                  : "bg-red-500/20 text-red-300 border border-red-500/30"
              }`}>
                {anomaly.user_decision === "approve" ? "✓ Approved" : "✗ Rejected"}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-300">{anomaly.message}</p>
          {policyReason && !anomaly.user_decision && (
            <p className="text-xs text-gray-600 mt-1.5 italic">Default policy: {policyReason}</p>
          )}
          {anomaly.raw_row_data && (
            <div className="mt-2 text-xs text-gray-500 truncate font-mono">
              {anomaly.raw_row_data.description || "(no description)"} · {anomaly.raw_row_data.amount || "?"} {anomaly.raw_row_data.currency || ""}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!anomaly.user_decision ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={onApprove}
                disabled={disabled}
                className="text-green-400 hover:text-green-300 hover:bg-green-500/10 h-8"
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onReject}
                disabled={disabled}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8"
              >
                Reject
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={onReset}
              className="text-gray-500 hover:text-gray-300 h-8"
              title="Reset decision"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
