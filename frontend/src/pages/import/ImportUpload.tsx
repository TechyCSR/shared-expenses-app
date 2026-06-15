import { useState, useRef } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import api from "@/services/api"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Layout from "@/components/Layout"

export default function ImportUpload() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)

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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to={`/groups/${groupId}`} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-semibold text-white">Import CSV</h1>
        </div>

        <Card className="bg-[#0a0a0a] border-gray-800">
          <CardContent className="p-6">
            <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  dragActive 
                    ? "border-white bg-white/5" 
                    : "border-gray-700 hover:border-gray-600"
                }`}
                onClick={() => fileRef.current?.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
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
                    <svg className="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium text-sm text-white">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); setFile(null) }}
                      className="mt-3 text-gray-400"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div>
                    <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-300">Drop CSV here or click to browse</p>
                    <p className="text-xs text-gray-600 mt-2">
                      Expected headers: date, description, paid_by, amount, currency,<br/>
                      split_type, split_with, split_details, notes
                    </p>
                  </div>
                )}
              </div>

              {mutation.isError && (
                <div className="p-3 bg-red-900/20 border border-red-800 rounded">
                  <p className="text-sm text-red-400">
                    {(mutation.error as any)?.response?.data?.error?.message || (mutation.error as Error).message}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  disabled={!file || mutation.isPending} 
                  className="bg-white text-black hover:bg-gray-200"
                >
                  {mutation.isPending ? "Uploading..." : "Upload & Parse"}
                </Button>
                <Link to={`/groups/${groupId}`}>
                  <Button type="button" variant="secondary">Cancel</Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-gray-900/30 border border-gray-800 rounded-lg">
          <h3 className="text-sm font-medium text-white mb-2">What happens next?</h3>
          <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
            <li>Your CSV will be parsed and validated</li>
            <li>Any data issues (missing fields, mismatches, duplicates, etc.) will be detected and surfaced</li>
            <li>You'll review and decide how to handle each issue (approve/reject)</li>
            <li>Click "Commit Import" to add the expenses to your group</li>
            <li>A detailed report will be generated and can be downloaded</li>
          </ol>
        </div>
      </div>
    </Layout>
  )
}