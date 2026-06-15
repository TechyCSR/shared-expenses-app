import { Link, useLocation } from "react-router-dom"
import { useUser, UserButton } from "@clerk/clerk-react"
import { Button } from "@/components/ui/Button"

interface LayoutProps {
  children: React.ReactNode
  showNav?: boolean
}

export default function Layout({ children, showNav = true }: LayoutProps) {
  const { isSignedIn } = useUser()
  const location = useLocation()

  // Don't show nav on home page
  if (!showNav || !isSignedIn || location.pathname === "/") {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-gray-800 sticky top-0 z-50 bg-black/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-xs">SE</span>
            </div>
            <span className="text-white font-semibold text-lg hidden sm:block">Shared Expenses</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link to="/settings">
              <Button variant="secondary" size="sm" className="border-gray-600 hover:bg-gray-800">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Button>
            </Link>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 rounded-full border border-gray-700",
                  userButtonPopoverCard: "bg-[#0a0a0a] border border-gray-800",
                  userPreviewMainIdentifier: "text-white",
                  userPreviewSecondaryIdentifier: "text-gray-400",
                  userButtonPopoverActionButton: "text-gray-300 hover:text-white hover:bg-gray-800",
                  userButtonPopoverActionButtonText: "text-gray-300",
                  userButtonPopoverFooter: "hidden",
                }
              }}
            />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}