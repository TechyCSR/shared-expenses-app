import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Layout from "@/components/Layout"
import Loading from "@/components/ui/Loading"
import type { ImportReport } from "@/types"

export default function ImportReportPage() {
  const { groupId, jobId } = useParams<{ groupId: string; jobId: string }>()

  const { data: report, isLoading } = useQuery({
    queryKey: ["import-report", jobId],
    queryFn: async () => {
      const res = await api.get(`/imports/${jobId}/report`)
      return res.data.data as ImportReport
    },
    enabled: !!jobId,
  })

  const handleDownload = async () => {
    const token = localStorage.getItem("access_token")
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "/api/v1"}/imports/${jobId}/report/download`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    )
    if (!response.ok) {
      alert("Failed to download report")
      return
    }
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `import_report_${jobId?.slice(0, 8)}.md`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    a.remove()
  }

  if (isLoading) {
    return <Layout><Loading message="Loading report..." /></Layout>
  }

  if (!report) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-6 py-8">
          <p className="text-gray-400">Report not found</p>
        </div>
      </Layout>
    )
  }

  const rd = report.report_data as Record<string, any>
  const totalAnomalies = Object.values(rd.detected_anomalies || {}).reduce((a: number, b: any) => a + b, 0)
  const anomalyDetails = rd.anomaly_details || []

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/groups/${groupId}`} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-white">Import Report</h1>
            <p className="text-sm text-gray-400 mt-1">{rd.filename || "CSV Import"}</p>
          </div>
          <Button onClick={handleDownload} variant="secondary">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Report
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-[#0a0a0a] border-gray-800">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 uppercase">Total Rows</p>
              <p className="text-2xl font-semibold text-white mt-1">{rd.total_rows || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#0a0a0a] border-green-900">
            <CardContent className="p-4">
              <p className="text-xs text-green-400 uppercase">Imported</p>
              <p className="text-2xl font-semibold text-green-400 mt-1">{rd.imported_rows || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#0a0a0a] border-red-900">
            <CardContent className="p-4">
              <p className="text-xs text-red-400 uppercase">Rejected</p>
              <p className="text-2xl font-semibold text-red-400 mt-1">{rd.rejected_rows || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#0a0a0a] border-yellow-900">
            <CardContent className="p-4">
              <p className="text-xs text-yellow-400 uppercase">Anomalies</p>
              <p className="text-2xl font-semibold text-yellow-400 mt-1">{totalAnomalies}</p>
            </CardContent>
          </Card>
        </div>

        {/* Anomaly Breakdown */}
        {anomalyDetails.length > 0 && (
          <Card className="bg-[#0a0a0a] border-gray-800 mb-4">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-white mb-3">All Anomalies & Actions</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {anomalyDetails.map((a: any, i: number) => (
                  <div
                    key={i}
                    className={`p-3 rounded border ${
                      a.severity === "error" ? "border-red-900/50 bg-red-900/10" :
                      a.severity === "warning" ? "border-yellow-900/50 bg-yellow-900/10" :
                      "border-blue-900/50 bg-blue-900/10"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded uppercase ${
                        a.severity === "error" ? "bg-red-900/50 text-red-400" :
                        a.severity === "warning" ? "bg-yellow-900/50 text-yellow-400" :
                        "bg-blue-900/50 text-blue-400"
                      }`}>
                        {a.severity}
                      </span>
                      <span className="text-xs text-gray-500">Row {a.row_number}</span>
                      <span className="text-xs font-medium text-gray-300">{a.anomaly_type}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ml-auto ${
                        a.decision === "approve" ? "bg-green-900/30 text-green-400" :
                        a.decision === "reject" ? "bg-red-900/30 text-red-400" :
                        "bg-gray-800 text-gray-500"
                      }`}>
                        {a.decision}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{a.message}</p>
                    {a.raw_row?.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        Row data: {a.raw_row.description} · {a.raw_row.amount} {a.raw_row.currency || ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Anomalies by Type */}
        {Object.keys(rd.detected_anomalies || {}).length > 0 && (
          <Card className="bg-[#0a0a0a] border-gray-800 mb-4">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-white mb-3">By Type</h3>
              <div className="space-y-1">
                {Object.entries(rd.detected_anomalies).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{type}</span>
                    <span className="font-medium text-white">{count as number}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions Summary */}
        {Object.keys(rd.actions_taken || {}).length > 0 && (
          <Card className="bg-[#0a0a0a] border-gray-800 mb-6">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-white mb-3">Actions Taken</h3>
              <div className="space-y-1">
                {Object.entries(rd.actions_taken).map(([action, count]) => (
                  <div key={action} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 capitalize">{action}</span>
                    <span className="font-medium text-white">{count as number}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Link to={`/groups/${groupId}`}>
            <Button className="bg-white text-black hover:bg-gray-200">View Group Expenses</Button>
          </Link>
          <Link to={`/groups/${groupId}/import`}>
            <Button variant="secondary">Import Another CSV</Button>
          </Link>
        </div>
      </div>
    </Layout>
  )
}