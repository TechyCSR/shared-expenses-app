import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Layout from "@/components/Layout"
import Loading from "@/components/ui/Loading"
import type { ImportReport } from "@/types"

interface AnomalyDetail {
  row_number: number
  anomaly_type: string
  severity: string
  message: string
  decision: string
  raw_row: Record<string, string>
}

interface RejectionReason {
  row: number
  reason: string
  description: string
}

export default function ImportReportPage() {
  const { groupId, jobId } = useParams<{ groupId: string; jobId: string }>()
  const [downloading, setDownloading] = useState(false)
  const [activeTab, setActiveTab] = useState<"summary" | "anomalies" | "rejected" | "policy">("summary")

  const { data: report, isLoading } = useQuery({
    queryKey: ["import-report", jobId],
    queryFn: async () => {
      const res = await api.get(`/imports/${jobId}/report`)
      return res.data.data as ImportReport
    },
    enabled: !!jobId,
    staleTime: Infinity,
  })

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "/api/v1"}/imports/${jobId}/report/download`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      )
      if (!response.ok) throw new Error("Download failed")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `import_report_${jobId?.slice(0, 8)}.md`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    } catch (err) {
      alert("Failed to download report")
    } finally {
      setDownloading(false)
    }
  }

  if (isLoading) return <Layout><Loading message="Loading report..." /></Layout>

  if (!report) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="text-gray-400">Report not found</p>
        </div>
      </Layout>
    )
  }

  const rd = report.report_data as Record<string, any>
  const totalAnomalies = Object.values(rd.detected_anomalies || {}).reduce((a: number, b: any) => a + b, 0)
  const anomalyDetails: AnomalyDetail[] = rd.anomaly_details || []
  const rejectionReasons: RejectionReason[] = rd.rejection_reasons || []
  const policy = rd.policy || {}

  const successRate = rd.total_rows > 0 ? Math.round((rd.imported_rows / rd.total_rows) * 100) : 0

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/groups/${groupId}`} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-white tracking-tight">Import Report</h1>
            <p className="text-sm text-gray-500 mt-0.5 font-mono">{rd.filename || "CSV Import"}</p>
          </div>
          <Button onClick={handleDownload} disabled={downloading} className="bg-white text-black hover:bg-gray-100">
            {downloading ? (
              "Downloading..."
            ) : (
              <>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </>
            )}
          </Button>
        </div>

        {/* Outcome Banner */}
        {rd.imported_rows > 0 && rd.rejected_rows === 0 && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-300">
              <span className="font-semibold">✓ Success.</span> All {rd.imported_rows} rows imported successfully.
            </p>
          </div>
        )}
        {rd.imported_rows > 0 && rd.rejected_rows > 0 && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-300">
              <span className="font-semibold">⚠ Partial success.</span> {rd.imported_rows} imported, {rd.rejected_rows} skipped.
            </p>
          </div>
        )}
        {rd.imported_rows === 0 && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-300">
              <span className="font-semibold">✗ No rows imported.</span> All {rd.rejected_rows} rows were skipped.
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label="Total" value={rd.total_rows || 0} />
          <StatCard label="Imported" value={rd.imported_rows || 0} color="green" />
          <StatCard label="Rejected" value={rd.rejected_rows || 0} color="red" />
          <StatCard label="Anomalies" value={totalAnomalies} color="yellow" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-gray-800">
          {[
            { key: "summary", label: "Summary" },
            { key: "anomalies", label: `Anomalies (${anomalyDetails.length})` },
            { key: "rejected", label: `Rejected (${rejectionReasons.length})` },
            { key: "policy", label: "Policy" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.key ? "border-white text-white" : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "summary" && (
          <div className="space-y-4">
            <Card className="bg-[#0a0a0a] border border-gray-800">
              <CardContent className="p-5">
                <h3 className="text-sm font-medium text-white mb-3">Import Summary</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-gray-500">Total rows</dt><dd className="text-white tabular-nums">{rd.total_rows}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Imported</dt><dd className="text-green-400 tabular-nums">{rd.imported_rows}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Rejected</dt><dd className="text-red-400 tabular-nums">{rd.rejected_rows}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Success rate</dt><dd className="text-white tabular-nums">{successRate}%</dd></div>
                </dl>
              </CardContent>
            </Card>

            {Object.keys(rd.detected_anomalies || {}).length > 0 && (
              <Card className="bg-[#0a0a0a] border border-gray-800">
                <CardContent className="p-5">
                  <h3 className="text-sm font-medium text-white mb-3">Anomalies by Type</h3>
                  <div className="space-y-2">
                    {Object.entries(rd.detected_anomalies).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 font-mono">{type}</span>
                        <span className="font-medium text-white tabular-nums">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {Object.keys(rd.actions_taken || {}).length > 0 && (
              <Card className="bg-[#0a0a0a] border border-gray-800">
                <CardContent className="p-5">
                  <h3 className="text-sm font-medium text-white mb-3">User Decisions</h3>
                  <div className="space-y-2">
                    {Object.entries(rd.actions_taken).map(([action, count]) => (
                      <div key={action} className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 capitalize">{action}</span>
                        <span className="font-medium text-white tabular-nums">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "anomalies" && (
          <Card className="bg-[#0a0a0a] border border-gray-800">
            <CardContent className="p-3">
              {anomalyDetails.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-sm">No anomalies detected</p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {anomalyDetails.map((a, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded border ${
                        a.severity === "error" ? "border-red-500/20 bg-red-500/5" :
                        a.severity === "warning" ? "border-yellow-500/20 bg-yellow-500/5" :
                        "border-blue-500/20 bg-blue-500/5"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded uppercase ${
                          a.severity === "error" ? "bg-red-500/20 text-red-300" :
                          a.severity === "warning" ? "bg-yellow-500/20 text-yellow-300" :
                          "bg-blue-500/20 text-blue-300"
                        }`}>
                          {a.severity}
                        </span>
                        <span className="text-xs text-gray-500 tabular-nums">Row {a.row_number}</span>
                        <span className="text-xs font-medium text-gray-300 font-mono">{a.anomaly_type}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ml-auto ${
                          a.decision === "approve" ? "bg-green-500/20 text-green-300" :
                          a.decision === "reject" ? "bg-red-500/20 text-red-300" :
                          "bg-gray-800 text-gray-500"
                        }`}>
                          {a.decision}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{a.message}</p>
                      {a.raw_row?.description && (
                        <p className="text-xs text-gray-600 mt-1 font-mono truncate">
                          {a.raw_row.description} · {a.raw_row.amount} {a.raw_row.currency || ""}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "rejected" && (
          <Card className="bg-[#0a0a0a] border border-gray-800">
            <CardContent className="p-5">
              <h3 className="text-sm font-medium text-white mb-3">Why some rows were skipped</h3>
              {rejectionReasons.length === 0 ? (
                <p className="text-gray-500 text-sm">No rows were rejected</p>
              ) : (
                <div className="space-y-2">
                  {rejectionReasons.map((r, i) => (
                    <div key={i} className="p-3 bg-red-500/5 border border-red-500/20 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-red-300 tabular-nums">Row {r.row}</span>
                        <span className="text-xs font-mono text-red-400">{r.reason}</span>
                      </div>
                      <p className="text-sm text-gray-300">{r.description || "(no description)"}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {r.reason === "no_matching_payer" && "The 'paid_by' value doesn't match any group member and can't be auto-mapped."}
                        {r.reason === "no_matching_participants" && "No valid participants could be resolved from the split_with column."}
                        {r.reason === "unparseable_date" && "The date format isn't recognized. Check the date format and re-import."}
                        {r.reason === "invalid_amount" && "The amount field isn't a valid number."}
                        {r.reason === "zero_amount" && "Amount is 0 — placeholders are skipped."}
                        {r.reason === "missing_payer" && "No 'paid_by' value — can't record who paid."}
                        {r.reason === "user_rejected" && "You explicitly rejected this row."}
                        {r.reason.startsWith("unexpected_error") && "An unexpected error occurred during processing."}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "policy" && (
          <Card className="bg-[#0a0a0a] border border-gray-800">
            <CardContent className="p-5">
              <h3 className="text-sm font-medium text-white mb-3">How we handle each anomaly</h3>
              <p className="text-xs text-gray-500 mb-4">
                When anomalies are auto-handled (e.g., on bulk approve), these are the rules we apply.
              </p>
              <div className="space-y-3">
                {Object.entries(policy).map(([type, p]: [string, any]) => (
                  <div key={type} className="p-3 bg-gray-900/30 border border-gray-800 rounded">
                    <p className="text-sm font-medium text-white font-mono">{type}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      <span className="text-gray-500">Default: </span>
                      <span className="text-gray-300">{p.default.replace(/_/g, " ")}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{p.reason}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3 mt-6">
          <Link to={`/groups/${groupId}`}>
            <Button className="bg-white text-black hover:bg-gray-100">View Group Expenses</Button>
          </Link>
          <Link to={`/groups/${groupId}/import`}>
            <Button variant="secondary" className="border-gray-700 hover:bg-gray-800">Import Another CSV</Button>
          </Link>
        </div>
      </div>
    </Layout>
  )
}

function StatCard({ label, value, color = "white" }: { label: string; value: number; color?: "white" | "green" | "red" | "yellow" }) {
  const colors = {
    white: "text-white",
    green: "text-green-400",
    red: "text-red-400",
    yellow: "text-yellow-400",
  }
  return (
    <Card className="bg-[#0a0a0a] border border-gray-800">
      <CardContent className="p-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-semibold mt-1 tabular-nums ${colors[color]}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
