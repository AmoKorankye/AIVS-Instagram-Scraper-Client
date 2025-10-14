"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { useAssignmentProgress } from "@/contexts/assignment-progress-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MoreVertical } from "lucide-react"

interface Account {
  id: string
  fullName: string
  username: string
}

export function PaymentsTable({ 
  accounts = [], 
  totalFiltered = 0, 
  isLoading = false,
  onCampaignComplete,
  canAssignToVAs = false,
  statusMessage = ""
}: {
  accounts?: Account[]
  totalFiltered?: number
  isLoading?: boolean
  onCampaignComplete?: () => void
  canAssignToVAs?: boolean
  statusMessage?: string
}) {
  const [currentPage, setCurrentPage] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [customProfilesPerTable, setCustomProfilesPerTable] = useState("")
  const [isFixed180ConfirmOpen, setIsFixed180ConfirmOpen] = useState(false)
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)
  const { toast } = useToast()
  
  // Use global assignment progress context instead of local state
  const { 
    isAssigning, 
    progress, 
    progressStep, 
    startAssignment, 
    updateProgress, 
    completeAssignment, 
    failAssignment 
  } = useAssignmentProgress()
  
  const itemsPerPage = 10
  const totalAccounts = accounts.length

  // Get default profiles per table from env
  const defaultProfilesPerTable = Number(process.env.NEXT_PUBLIC_PROFILES_PER_TABLE) || 180

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

  const handleAssignToVAs = async (profilesPerTable?: number) => {
    // NOTE: Intentionally bypassing status/permission checks so the action
    // always proceeds when the user clicks the menu item. Any feedback
    // is still handled by the toast messages returned from the workflow.

    // Start assignment using global context
    startAssignment()

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

      // Get profiles_per_table: use custom value if provided, otherwise use default from env
      const profilesPerTableToUse = profilesPerTable !== undefined ? profilesPerTable : defaultProfilesPerTable

      // STEP 1: Create Campaign & Daily Selection (0% → 33%)
      updateProgress(10, 'creating')
      const selectionResponse = await fetch(`${apiUrl}/api/daily-selection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profiles_per_table: profilesPerTableToUse
        })
      })

      const selectionResult = await selectionResponse.json()

      if (!selectionResult.success) {
        toast({
          title: "Campaign creation failed",
          description: selectionResult.error || 'Could not create campaign',
          variant: "destructive",
        })
        failAssignment()
        return
      }

      const campaignId = selectionResult.campaign_id
      const _totalSelected = selectionResult.total_selected
      updateProgress(33, 'creating')

      // STEP 2: Distribute to VA Tables (33% → 66%)
      updateProgress(40, 'distributing')

      // Always send profiles_per_table to backend (already determined above)
      const distributeResponse = await fetch(`${apiUrl}/api/distribute/${campaignId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profiles_per_table: profilesPerTableToUse
        })
      })

      const distributeResult = await distributeResponse.json()

      if (!distributeResult.success) {
        toast({
          title: "Distribution failed",
          description: distributeResult.error || 'Could not distribute profiles',
          variant: "destructive",
        })
        failAssignment()
        return
      }

      updateProgress(66, 'distributing')

      // STEP 3: Sync to Airtable (66% → 100%)
      updateProgress(75, 'syncing')

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
        failAssignment()
        return
      }

      // Complete the assignment with the profiles per table value
      completeAssignment(profilesPerTableToUse)

      // Success! Use the value we sent to the backend
      toast({
        title: "Campaign completed",
        description: `Assigned ${profilesPerTableToUse} accounts per VA successfully.`,
      })

      // Trigger UI refresh
      onCampaignComplete?.()

    } catch (error) {
      console.error('Campaign workflow error:', error)
      toast({
        title: "Workflow failed",
        description: 'Failed to complete campaign workflow. Make sure the server is running.',
        variant: "destructive",
      })
      failAssignment()
    }
  }

  // Handler for fixed assignment: open a confirmation dialog first
  const handleFixed180Assignment = () => {
    setIsFixed180ConfirmOpen(true)
  }

  // Confirm and perform the 180 assignment after checking availability
  const confirmFixed180Assignment = async () => {
    setIsCheckingAvailability(true)

    try {
      // Query Supabase for the count of unused usernames (used = false)
      const { count, error } = await supabase
        .from('global_usernames')
        .select('*', { count: 'exact', head: true })
        .eq('used', false)

      if (error) throw error

      const available = count ?? 0

      // Required minimum for assigning 180 across 80 VA tables
      const required = 14400

      if (available < required) {
        toast({
          title: "Not enough profiles",
          description: "Please scrape more profiles before attempting to distribute 14,400 profiles.",
          variant: "destructive",
        })
        setIsFixed180ConfirmOpen(false)
        return
      }

      // Enough available — close confirm and proceed
      setIsFixed180ConfirmOpen(false)
      handleAssignToVAs(180)
    } catch (err) {
      console.error('Error checking available profiles:', err)
      toast({
        title: "Availability check failed",
        description: "Could not verify available profiles. Try again or check the server.",
        variant: "destructive",
      })
    } finally {
      setIsCheckingAvailability(false)
    }
  }

  // Handler for opening custom assignment dialog
  const handleOpenCustomDialog = () => {
    setCustomProfilesPerTable(defaultProfilesPerTable.toString())
    setIsDialogOpen(true)
  }

  // Handler for confirming custom assignment
  const handleConfirmCustomAssignment = () => {
    const value = parseInt(customProfilesPerTable)
    
    if (isNaN(value) || value <= 0) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid number of profiles per VA.",
        variant: "destructive",
      })
      return
    }

    setIsDialogOpen(false)
    handleAssignToVAs(value)
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

  // Assignment actions are intentionally not disabled so that the
  // dropdown menu buttons are always clickable.

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Extracted Accounts</CardTitle>
          <p className="text-sm text-muted-foreground">
            {totalFiltered > 0 ? `${totalFiltered} filtered accounts found` : "No accounts to display"}
          </p>
        </div>
        
        {/* Dropdown Menu for VA Assignment - Always visible and clickable */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="More actions"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleFixed180Assignment}>
              Assign 180 accounts per VA
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleOpenCustomDialog}>
              Custom VA Assignment...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

      {/* Custom Assignment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit VA Assignment</DialogTitle>
            <DialogDescription>
              Enter the number of profiles each VA should receive.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="profiles-per-table" className="text-right">
                Profiles per VA
              </Label>
              <Input
                id="profiles-per-table"
                type="number"
                min="1"
                value={customProfilesPerTable}
                onChange={(e) => setCustomProfilesPerTable(e.target.value)}
                className="col-span-3"
                placeholder={defaultProfilesPerTable.toString()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmCustomAssignment}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm dialog for fixed 180 assignment */}
      <Dialog open={isFixed180ConfirmOpen} onOpenChange={setIsFixed180ConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign 180 accounts per VA</DialogTitle>
            <DialogDescription>
              This will attempt to distribute 180 profiles to each VA (total required: 14,400). Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFixed180ConfirmOpen(false)} disabled={isCheckingAvailability}>
              Cancel
            </Button>
            <Button onClick={confirmFixed180Assignment} disabled={isCheckingAvailability}>
              {isCheckingAvailability ? 'Checking...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
