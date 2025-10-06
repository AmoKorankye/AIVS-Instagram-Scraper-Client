"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"

interface Account {
  id: string
  fullName: string
  username: string
}

export function ScrapedResultsTable({ 
  accounts = [], 
  totalFiltered = 0, 
  isLoading = false,
  onCampaignComplete 
}: {
  accounts?: Account[]
  totalFiltered?: number
  isLoading?: boolean
  onCampaignComplete?: () => void
}) {
  const [currentPage, setCurrentPage] = useState(0)
  const [isAssigning, setIsAssigning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressStep, setProgressStep] = useState<'idle' | 'creating' | 'distributing' | 'syncing' | 'complete'>('idle')
  const { toast } = useToast()
  const itemsPerPage = 10
  const totalAccounts = accounts.length

  const startIndex = currentPage * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalAccounts)
  const currentAccounts = accounts.slice(startIndex, endIndex)
  const totalPages = Math.ceil(totalAccounts / itemsPerPage)

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
  }

  const handleAssignToVAs = async () => {
    if (totalFiltered === 0) {
      toast({
        title: "No accounts to assign",
        description: "Please scrape some accounts first.",
        variant: "destructive",
      })
      return
    }

    setIsAssigning(true)
    setProgress(0)
    setProgressStep('creating')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

      // STEP 1: Create Campaign & Daily Selection (0% → 33%)
      setProgress(10)
      const selectionResponse = await fetch(`${apiUrl}/api/daily-selection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      })

      const selectionResult = await selectionResponse.json()

      if (!selectionResult.success) {
        toast({
          title: "Campaign creation failed",
          description: selectionResult.error || 'Could not create campaign',
          variant: "destructive",
        })
        setProgressStep('idle')
        setProgress(0)
        return
      }

      const campaignId = selectionResult.campaign_id
      const totalSelected = selectionResult.total_selected
      setProgress(33)

      // STEP 2: Distribute to VA Tables (33% → 66%)
      setProgressStep('distributing')
      setProgress(40)

      const distributeResponse = await fetch(`${apiUrl}/api/distribute/${campaignId}`, {
        method: 'POST'
      })

      const distributeResult = await distributeResponse.json()

      if (!distributeResult.success) {
        toast({
          title: "Distribution failed",
          description: distributeResult.error || 'Could not distribute profiles',
          variant: "destructive",
        })
        setProgressStep('idle')
        setProgress(0)
        return
      }

      setProgress(66)

      // STEP 3: Sync to Airtable (66% → 100%)
      setProgressStep('syncing')
      setProgress(75)

      const syncResponse = await fetch(`${apiUrl}/api/airtable-sync/${campaignId}`, {
        method: 'POST'
      })

      const syncResult = await syncResponse.json()

      if (!syncResult.success) {
        toast({
          title: "Airtable sync failed",
          description: syncResult.error || 'Could not sync to Airtable',
          variant: "destructive",
        })
        setProgressStep('idle')
        setProgress(0)
        return
      }

      setProgress(100)
      setProgressStep('complete')

      // Success!
      toast({
        title: "Campaign completed",
        description: `Successfully assigned ${totalSelected} profiles to ${syncResult.tables_synced} VA tables in Airtable.`,
      })

      // Trigger UI refresh
      onCampaignComplete?.()

      // Reset progress after 2 seconds
      setTimeout(() => {
        setProgressStep('idle')
        setProgress(0)
      }, 2000)

    } catch (error) {
      console.error('Campaign workflow error:', error)
      toast({
        title: "Workflow failed",
        description: 'Failed to complete campaign workflow. Make sure the server is running.',
        variant: "destructive",
      })
      setProgressStep('idle')
      setProgress(0)
    } finally {
      setIsAssigning(false)
    }
  }

  const SkeletonRow = ({ index }: { index: number }) => (
    <div className="flex items-center gap-4 px-4 py-3">
      <div className="w-12 text-sm font-medium text-muted-foreground">{startIndex + index + 1}</div>
      <div className="flex-1">
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex-1">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex-1">
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Extracted Accounts</CardTitle>
          <p className="text-sm text-muted-foreground">
            {totalFiltered > 0 ? `${totalFiltered} filtered accounts found` : "No accounts to display"}
          </p>
        </div>
        <Button 
          onClick={handleAssignToVAs} 
          disabled={isAssigning || totalFiltered === 0}
          size="lg"
        >
          {isAssigning ? (
            progressStep === 'creating' ? 'Creating Campaign...' :
            progressStep === 'distributing' ? 'Distributing...' :
            progressStep === 'syncing' ? 'Syncing to Airtable...' :
            'Complete!'
          ) : 'Assign to VAs'}
        </Button>
      </CardHeader>
      <CardContent>
        {/* Progress Indicator */}
        {progressStep !== 'idle' && (
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {progressStep === 'creating' && '📋 Creating campaign and selecting profiles...'}
                {progressStep === 'distributing' && '🎲 Distributing to VA tables...'}
                {progressStep === 'syncing' && '☁️ Syncing to Airtable...'}
                {progressStep === 'complete' && '✅ Complete!'}
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {totalAccounts > 0 && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              {startIndex + 1}–{endIndex} of {totalAccounts}
            </p>
          </div>
        )}

        {(totalAccounts > 0 || isLoading) && (
          <div className="rounded-md border">
            <div className="border-b bg-muted/50 px-4 py-3">
              <div className="flex items-center gap-4">
                <div className="w-12 font-medium">#</div>
                <div className="flex-1 font-medium">ID</div>
                <div className="flex-1 font-medium">Full Name</div>
                <div className="flex-1 font-medium">Username</div>
              </div>
            </div>

            <div className="divide-y">
              {isLoading
                ? Array.from({ length: 10 }, (_, index) => <SkeletonRow key={`skeleton-${index}`} index={index} />)
                : currentAccounts.map((account: Account, index: number) => (
                    <div key={account.id} className="flex items-center gap-4 px-4 py-3">
                      <div className="w-12 text-sm font-medium text-muted-foreground">{startIndex + index + 1}</div>
                      <div className="flex-1 text-sm font-medium">{account.id}</div>
                      <div className="flex-1 text-sm">{account.fullName}</div>
                      <div className="flex-1 text-sm">@{account.username}</div>
                    </div>
                  ))}
            </div>
          </div>
        )}

        {totalAccounts > 0 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Showing {currentAccounts.length} of {totalAccounts} accounts
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrevious} disabled={currentPage === 0}>
                Previous
              </Button>
              <Button variant="outline" onClick={handleNext} disabled={currentPage === totalPages - 1}>
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
