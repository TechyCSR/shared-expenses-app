import { Link, useNavigate } from "react-router-dom"
import { useAuth, useUser } from "@clerk/clerk-react"
import { useEffect } from "react"
import { Button } from "@/components/ui/Button"

export default function HomePage() {
  const { isSignedIn: isAuthSignedIn, isLoaded: isAuthLoaded } = useAuth()
  const { isSignedIn, isLoaded } = useUser()
  
  // Use combined auth state to prevent flicker
  const isSignedInCombined = isAuthSignedIn && isSignedIn
  const isLoadedCombined = isAuthLoaded && isLoaded
  const navigate = useNavigate()

  // Redirect signed-in users to dashboard
  useEffect(() => {
    if (isLoadedCombined && isSignedInCombined) {
      navigate("/dashboard", { replace: true })
    }
  }, [isLoadedCombined, isSignedInCombined, navigate])

  const handleGetStarted = () => {
    if (isSignedInCombined) {
      navigate("/dashboard")
    } else {
      navigate("/signup")
    }
  }

  const handleSignIn = () => {
    if (isSignedInCombined) {
      navigate("/dashboard")
    } else {
      navigate("/login")
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-900 bg-black/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">SE</span>
            </div>
            <span className="text-white font-semibold text-lg">SharedExpenses</span>
          </div>
          <div className="flex items-center gap-4">
            {isLoadedCombined && isSignedInCombined ? (
              <Link to="/dashboard">
                <Button variant="secondary" size="sm">Open App</Button>
              </Link>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={handleSignIn}>
                  Sign In
                </Button>
                <Button size="sm" className="bg-white text-black hover:bg-gray-200" onClick={handleGetStarted}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-full text-xs text-gray-400 mb-8">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              CSV Import Now Available
            </div>
            <h1 className="text-5xl md:text-6xl font-semibold text-white leading-tight tracking-tight mb-6">
              Shared Expenses,
              <br />
              <span className="text-gray-500">Without Spreadsheet Chaos.</span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed">
              Import messy expense sheets, detect anomalies automatically, manage settlements, and track balances with complete transparency.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" className="bg-white text-black hover:bg-gray-200 h-12 px-8" onClick={handleGetStarted}>
                Get Started
              </Button>
              <Button size="lg" variant="secondary" className="h-12 px-8" onClick={handleSignIn}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-24 px-6 border-t border-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-white mb-4">How it works</h2>
            <p className="text-gray-400 max-w-md mx-auto">Three simple steps to financial clarity</p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4">
            <div className="flex-1 max-w-xs text-center">
              <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Import</h3>
              <p className="text-sm text-gray-500">Upload your CSV and we'll parse it automatically</p>
            </div>
            <div className="hidden md:block text-gray-700">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
            <div className="flex-1 max-w-xs text-center">
              <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Review</h3>
              <p className="text-sm text-gray-500">Check and resolve detected anomalies</p>
            </div>
            <div className="hidden md:block text-gray-700">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
            <div className="flex-1 max-w-xs text-center">
              <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Track</h3>
              <p className="text-sm text-gray-500">Monitor balances and settlements in real-time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 border-t border-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-white mb-4">Everything you need</h2>
            <p className="text-gray-400 max-w-md mx-auto">Built for teams who want clarity, not complexity</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              title="CSV Import"
              description="Upload messy spreadsheets and automatically detect issues, duplicates, and data quality problems."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Balance Tracking"
              description="See exactly who owes whom with complete transparency and real-time updates."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              title="Membership Timeline"
              description="Support members joining and leaving groups over time with proper historical calculations."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
              title="Anomaly Detection"
              description="Rule-based engine detects duplicates, missing data, and invalid entries before import."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              }
              title="Settlements"
              description="Record payments between users and update balances automatically."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              }
              title="Multiple Split Types"
              description="Support for equal, unequal, percentage, and share-based expense splits."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 border-t border-gray-900">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-semibold text-white mb-4">Ready to get started?</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Join teams who trust SharedExpenses for clear, transparent expense management.
          </p>
          <Button size="lg" className="bg-white text-black hover:bg-gray-200 h-12 px-8" onClick={handleGetStarted}>
            Create Free Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
              <span className="text-black font-bold text-xs">SE</span>
            </div>
            <span className="text-gray-500 text-sm">SharedExpenses</span>
          </div>
          <p className="text-gray-600 text-sm">Built for clarity, not complexity.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
      <div className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center text-gray-400 mb-4">
        {icon}
      </div>
      <h3 className="text-white font-medium text-lg mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  )
}