import { Routes, Route, Navigate, useNavigate } from "react-router-dom"
import { useAuth, useUser } from "@clerk/clerk-react"
import { useEffect, useRef } from "react"
import Dashboard from "./pages/Dashboard"
import HomePage from "./pages/HomePage"
import GroupsList from "./pages/groups/GroupsList"
import CreateGroup from "./pages/groups/CreateGroup"
import GroupDetail from "./pages/groups/GroupDetail"
import GroupSettings from "./pages/groups/GroupSettings"
import ExpensesList from "./pages/expenses/ExpensesList"
import CreateExpense from "./pages/expenses/CreateExpense"
import ExpenseDetail from "./pages/expenses/ExpenseDetail"
import EditExpense from "./pages/expenses/EditExpense"
import RecordSettlement from "./pages/settlements/RecordSettlement"
import GroupBalances from "./pages/balances/GroupBalances"
import ImportUpload from "./pages/import/ImportUpload"
import ImportReview from "./pages/import/ImportReview"
import ImportReportPage from "./pages/import/ImportReportPage"
import Settings from "./pages/Settings"
import Login from "./pages/Login"
import SignUpPage from "./pages/SignUp"
import api from "@/services/api"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Component to sync user with backend after Clerk sign in
function AuthSync() {
  const { isSignedIn, isLoaded, getToken } = useAuth()
  const { user } = useUser()
  const navigate = useNavigate()
  const hasSynced = useRef(false)

  useEffect(() => {
    async function syncUser() {
      if (!isLoaded || !isSignedIn || !user || hasSynced.current) return

      // Mark as synced immediately to prevent double-sync
      hasSynced.current = true

      try {
        // Get Clerk session token
        const clerkToken = await getToken()

        // Use fetch directly for initial auth to avoid interceptor issues
        const response = await fetch(`${import.meta.env.VITE_API_URL || "/api/v1"}/auth/clerk/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(clerkToken ? { "Authorization": `Bearer ${clerkToken}` } : {})
          },
          body: JSON.stringify({
            clerk_id: user.id,
            email: user.primaryEmailAddress?.emailAddress || "",
            full_name: user.fullName || "",
            avatar_url: user.imageUrl || "",
          })
        })

        const data = await response.json()

        // Store the returned JWT if successful
        if (data?.success && data?.data?.access_token) {
          localStorage.setItem("access_token", data.data.access_token)
        }
      } catch (err) {
        console.error("Failed to sync user:", err)
        // Reset so it can retry
        hasSynced.current = false
      }
    }

    syncUser()
  }, [isLoaded, isSignedIn, user, getToken])

  // Redirect to dashboard if signed in and on login page
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const currentPath = window.location.pathname
      if (currentPath === "/login") {
        navigate("/dashboard", { replace: true })
      }
    }
  }, [isLoaded, isSignedIn, navigate])

  return null
}

export default function App() {
  return (
    <>
      <AuthSync />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/groups" element={<ProtectedRoute><GroupsList /></ProtectedRoute>} />
        <Route path="/groups/new" element={<ProtectedRoute><CreateGroup /></ProtectedRoute>} />
        <Route path="/groups/:id" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
        <Route path="/groups/:groupId/settings" element={<ProtectedRoute><GroupSettings /></ProtectedRoute>} />
        <Route path="/groups/:groupId/expenses" element={<ProtectedRoute><ExpensesList /></ProtectedRoute>} />
        <Route path="/groups/:groupId/expenses/new" element={<ProtectedRoute><CreateExpense /></ProtectedRoute>} />
        <Route path="/groups/:groupId/expenses/:expenseId" element={<ProtectedRoute><ExpenseDetail /></ProtectedRoute>} />
        <Route path="/groups/:groupId/expenses/:expenseId/edit" element={<ProtectedRoute><EditExpense /></ProtectedRoute>} />
        <Route path="/groups/:groupId/settlements/new" element={<ProtectedRoute><RecordSettlement /></ProtectedRoute>} />
        <Route path="/groups/:groupId/balances" element={<ProtectedRoute><GroupBalances /></ProtectedRoute>} />
        <Route path="/groups/:groupId/import" element={<ProtectedRoute><ImportUpload /></ProtectedRoute>} />
        <Route path="/groups/:groupId/import/:jobId/review" element={<ProtectedRoute><ImportReview /></ProtectedRoute>} />
        <Route path="/groups/:groupId/import/:jobId/report" element={<ProtectedRoute><ImportReportPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}