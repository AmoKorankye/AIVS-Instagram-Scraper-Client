"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { DependenciesCard } from "@/components/dependencies-card"
import { PaymentsTable } from "@/components/payments-table"
import { UsernameStatusCard } from "@/components/username-status-card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"

interface ScrapedAccount {
  id: string
  fullName: string
  username: string
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()
  const [scrapedAccounts, setScrapedAccounts] = useState<ScrapedAccount[]>([])
  const [totalFiltered, setTotalFiltered] = useState(0)
  const [isScrapingLoading, setIsScrapingLoading] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

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

  const handleLogout = () => {
    setShowLogoutDialog(true)
  }

  const confirmLogout = () => {
    logout() // Clear authentication state
    router.push("/callum")
    setShowLogoutDialog(false)
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
        {/* Header with logo and logout */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
              <Image 
                src="/aivs logo.JPG" 
                alt="AIVS Logo" 
                width={48} 
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Logout</DialogTitle>
                <DialogDescription>
                  Are you sure you want to logout? You will be redirected to the login page.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowLogoutDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={confirmLogout}>
                  Yes, Logout
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Username Status Card */}
        <div className="mb-6">
          <UsernameStatusCard />
        </div>
        
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
