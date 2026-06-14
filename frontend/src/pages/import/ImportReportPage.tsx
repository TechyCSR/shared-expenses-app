import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import type { ImportReport } from "@/types"

export default function ImportReportPage() {
  const { groupId, jobId } = useParams<{ groupId: string; jobId: string }>()

  const { data: report } = useQuery({
    queryKey: ["import-report", jobId],
    queryFn: async () => {
      const res = await api.get(`/imports/${jobId}/report`)
      return res.data.data as ImportReport
    },
    enabled: !!jobId,
  })

  if (!report) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const rd = report.report_data

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link to={`/groups/${groupId}`} className="text-xl font-semibold text-white">Shared Expenses</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold text-white mb-6">Import Report</h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-[#0a0a0a] border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Total Rows</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-white">{rd.total_rows}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#0a0a0a] border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Imported</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-green-400">{rd.imported_rows}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#0a0a0a] border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-red-400">{rd.rejected_rows}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#0a0a0a] border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Anomalies Detected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-white">{Object.values(rd.detected_anomalies).reduce((a: number, b: number) => a + b, 0)}</p>
            </CardContent>
          </Card>
        </div>

        {Object.keys(rd.detected_anomalies).length > 0 && (
          <Card className="bg-[#0a0a0a] border-gray-800 mb-4">
            <CardHeader>
              <CardTitle className="text-sm text-gray-300">Anomalies by Type</CardTitle>
            </CardHeader>
            <CardContent>
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

        {Object.keys(rd.actions_taken).length > 0 && (
          <Card className="bg-[#0a0a0a] border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-sm text-gray-300">Actions Taken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(rd.actions_taken).map(([action, count]) => (
                  <div key={action} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{action}</span>
                    <span className="font-medium text-white">{count as number}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Link to={`/groups/${groupId}`}>
          <Button variant="secondary">Back to Group</Button>
        </Link>
      </main>
    </div>
  )
}