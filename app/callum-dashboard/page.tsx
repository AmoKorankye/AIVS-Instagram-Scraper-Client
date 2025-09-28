"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DependenciesCard } from "@/components/dependencies-card"
import { PaymentsTable } from "@/components/payments-table"
import { useAuth } from "@/contexts/auth-context"

interface ScrapedAccount {
  id: string
  fullName: string
  username: string
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [scrapedAccounts, setScrapedAccounts] = useState<ScrapedAccount[]>([])
  const [totalFiltered, setTotalFiltered] = useState(0)
  const [isScrapingLoading, setIsScrapingLoading] = useState(false)

  const handleScrapingStart = () => {
    setIsScrapingLoading(true)
    setScrapedAccounts([])
    setTotalFiltered(0)
  }

  const handleScrapingComplete = (accounts: ScrapedAccount[], total: number) => {
    setScrapedAccounts(accounts)
    setTotalFiltered(total)
    setIsScrapingLoading(false)
  }

  const handleScrapingError = (error: string) => {
    setIsScrapingLoading(false)
    setScrapedAccounts([])
    setTotalFiltered(0)
  }

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/callum")
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <p>Loading...</p>
      </div>
    )
  }

  // Don't show dashboard if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <p>Redirecting to login...</p>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DependenciesCard 
            onScrapingStart={handleScrapingStart}
            onScrapingComplete={handleScrapingComplete}
            onError={handleScrapingError}
          />
          <PaymentsTable 
            accounts={scrapedAccounts}
            totalFiltered={totalFiltered}
            isLoading={isScrapingLoading}
          />
        </div>
      </div>
    </div>
  )
}
