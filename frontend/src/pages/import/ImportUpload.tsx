import { useState, useRef } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

export default function ImportUpload() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected")
      const formData = new FormData()
      formData.append("file", file)
      const res = await api.post(`/groups/${groupId}/imports`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      return res.data.data
    },
    onSuccess: (data) => {
      navigate(`/groups/${groupId}/import/${data.id}/review`)
    },
  })

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link to={`/groups/${groupId}`} className="text-xl font-semibold text-white">Shared Expenses</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Card className="bg-[#0a0a0a] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Import Expenses from CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
              <div
                className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-gray-600 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {file ? (
                  <div>
                    <p className="font-medium text-sm text-white">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-400">Click to select a CSV file</p>
                    <p className="text-xs text-gray-600 mt-1">Headers: date, description, paid_by, amount, currency, split_type, split_with, split_details</p>
                  </div>
                )}
              </div>

              {mutation.isError && (
                <p className="text-sm text-red-400">
                  {(mutation.error as Error).message}
                </p>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={!file || mutation.isPending} className="bg-white text-black hover:bg-gray-200">
                  {mutation.isPending ? "Uploading..." : "Upload & Parse"}
                </Button>
                <Link to={`/groups/${groupId}`}>
                  <Button type="button" variant="secondary">Cancel</Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}