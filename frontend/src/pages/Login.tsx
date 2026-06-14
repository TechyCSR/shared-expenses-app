import { SignIn } from "@clerk/clerk-react"
import { useAuth } from "@clerk/clerk-react"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

export default function Login() {
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
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-md">
        <SignIn routing="path" path="/login" />
      </div>
    </div>
  )
}