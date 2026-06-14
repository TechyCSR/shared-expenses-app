import { Loader2 } from "lucide-react"

interface LoadingProps {
  message?: string
  size?: "sm" | "md" | "lg"
}

export default function Loading({ message = "Loading...", size = "md" }: LoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <Loader2 className={`${sizeClasses[size]} text-white animate-spin`} />
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  )
}

export function LoadingInline({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 py-4">
      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      {message && <span className="text-gray-500 text-sm">{message}</span>}
    </div>
  )
}