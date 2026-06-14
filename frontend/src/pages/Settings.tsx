import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

export default function Settings() {
  const token = localStorage.getItem("access_token")

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link to="/" className="text-xl font-semibold">Shared Expenses</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold mb-4">Settings</h2>
        <Card className="mb-4">
          <CardHeader><CardTitle className="text-sm">Authentication</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-2">
              {token ? "Authenticated with Clerk" : "Not authenticated"}
            </p>
            {token && (
              <Button variant="danger" size="sm" onClick={() => {
                localStorage.removeItem("access_token")
                window.location.href = "/"
              }}>
                Sign Out
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}