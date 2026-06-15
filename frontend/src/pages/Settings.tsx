import { useClerk } from "@clerk/clerk-react"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Layout from "@/components/Layout"
import { useUser } from "@clerk/clerk-react"
import { Link } from "react-router-dom"

export default function Settings() {
  const { signOut } = useClerk()
  const { user } = useUser()

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/dashboard" className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-semibold text-white">Settings</h1>
        </div>

        <Card className="bg-[#0a0a0a] border-gray-800 mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-medium text-white mb-4">Profile</h2>
            <div className="flex items-center gap-4">
              {user?.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt={user.fullName || "User"}
                  className="w-16 h-16 rounded-full border-2 border-gray-700"
                />
              )}
              <div>
                <p className="text-white font-medium">{user?.fullName}</p>
                <p className="text-gray-500 text-sm">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0a0a] border-gray-800">
          <CardContent className="p-6">
            <h2 className="text-lg font-medium text-white mb-4">Account</h2>
            <Button
              variant="danger"
              onClick={() => signOut()}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}