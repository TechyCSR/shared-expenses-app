import { Link } from "react-router-dom"
import { useClerk, useUser } from "@clerk/clerk-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

export default function Settings() {
  const { user } = useUser()
  const { signOut } = useClerk()

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link to="/" className="text-xl font-semibold text-white">Shared Expenses</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold text-white mb-4">Settings</h2>
        <Card className="bg-[#0a0a0a] border-gray-800 mb-4">
          <CardHeader><CardTitle className="text-white text-sm">Profile</CardTitle></CardHeader>
          <CardContent>
            {user && (
              <div className="flex items-center gap-4">
                <img src={user.imageUrl} alt={user.fullName || "User"} className="w-16 h-16 rounded-full" />
                <div>
                  <p className="text-white font-medium">{user.fullName}</p>
                  <p className="text-gray-400 text-sm">{user.primaryEmailAddress?.emailAddress}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-[#0a0a0a] border-gray-800 mb-4">
          <CardHeader><CardTitle className="text-white text-sm">Authentication</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400 mb-2">
              Authenticated with Clerk
            </p>
            <Button variant="secondary" size="sm" onClick={() => signOut()}>
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}