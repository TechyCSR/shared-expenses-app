import { SignUp } from "@clerk/clerk-react"
import { useAuth } from "@clerk/clerk-react"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"

export default function SignUpPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate("/dashboard", { replace: true })
    }
  }, [isLoaded, isSignedIn, navigate])

  if (!isLoaded || isSignedIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <Link to="/" className="mb-8 flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
          <span className="text-black font-bold text-xs">SE</span>
        </div>
        <span className="text-white font-semibold text-lg">Shared Expenses</span>
      </Link>
      <div className="w-full max-w-md">
        <SignUp routing="path" path="/signup" />
      </div>
      <p className="mt-6 text-sm text-gray-500">
        Already have an account?{" "}
        <Link to="/login" className="text-white hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
