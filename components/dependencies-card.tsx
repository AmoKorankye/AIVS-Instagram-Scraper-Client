"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, X, MoreVertical } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { EditSourceProfilesDialog } from "@/components/edit-source-profiles-dialog"

interface InstagramAccount {
  id: number
  username: string
}

interface SourceProfile {
  id: string
  username: string
}

interface ScrapedAccount {
  id: string
  fullName: string
  username: string
}

interface ApiResponse {
  success: boolean
  data: {
    accounts: ScrapedAccount[]
    totalFiltered: number
    totalScraped: number
    genderDistribution: {
      male: number
      female: number
      unknown: number
    }
  }
  error?: string
}

interface DependenciesCardProps {
  onScrapingComplete?: (accounts: ScrapedAccount[], totalFiltered: number) => void
  onScrapingStart?: () => void
  onError?: (error: string) => void
}

export function DependenciesCard({ onScrapingComplete, onScrapingStart, onError }: DependenciesCardProps) {
  const [inputValue, setInputValue] = useState("")
  const [accounts, setAccounts] = useState<InstagramAccount[]>([])
  const [totalScrapeCount, setTotalScrapeCount] = useState<number>(150)
  const [isScrapingLoading, setIsScrapingLoading] = useState(false)
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressStep, setProgressStep] = useState<'idle' | 'scraping' | 'ingesting' | 'complete'>('idle')
  const { toast } = useToast()

  const extractUsername = (input: string): string | null => {
    const trimmedInput = input.trim()

    // Check if it's a URL
    if (trimmedInput.startsWith("http")) {
      // Check if it contains instagram
      if (!trimmedInput.toLowerCase().includes("instagram")) {
        return null
      }

      // Regex patterns for Instagram URLs
      const patterns = [
        /https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)\/?(?:\?.*)?$/,
        /https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)\/(?:\?.*)?$/,
      ]

      for (const pattern of patterns) {
        const match = trimmedInput.match(pattern)
        if (match && match[1]) {
          return match[1]
        }
      }
      return null
    } else {
      // Validate username format (Instagram usernames can contain letters, numbers, periods, and underscores)
      const usernamePattern = /^[a-zA-Z0-9._]+$/
      if (usernamePattern.test(trimmedInput) && trimmedInput.length > 0) {
        return trimmedInput
      }
      return null
    }
  }

  const addAccount = () => {
    if (!inputValue.trim()) return

    const username = extractUsername(inputValue)
    if (!username) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid Instagram username or Instagram URL.",
        variant: "destructive",
      })
      return
    }

    // Check if account already exists
    if (accounts.some((account) => account.username === username)) {
      toast({
        title: "Account already added",
        description: "This Instagram account is already in your list.",
        variant: "destructive",
      })
      return
    }

    const newAccount: InstagramAccount = {
      id: Date.now(),
      username: username,
    }

    setAccounts((prev) => [...prev, newAccount])
    setInputValue("")

    toast({
      title: "Account added",
      description: `@${username} has been added to your list.`,
    })
  }

  const removeAccount = (id: number) => {
    setAccounts((prev) => prev.filter((account) => account.id !== id))
    toast({
      title: "Account removed",
      description: "The Instagram account has been removed from your list.",
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addAccount()
    }
  }

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase()
  }

  const loadSourceProfiles = async () => {
    setIsLoadingProfiles(true)
    
    try {
      const { data, error } = await supabase
        .from('source_profiles')
        .select('id, username')
        .order('username', { ascending: true })
      
      if (error) {
        throw error
      }
      
      if (data && data.length > 0) {
        // Convert Supabase profiles to local account format
        const loadedAccounts: InstagramAccount[] = data.map((profile: SourceProfile) => ({
          id: Date.now() + Math.random(), // Generate unique ID for local state
          username: profile.username || '',
        }))
        
        // Merge with existing accounts, avoiding duplicates
        setAccounts((prev) => {
          const existingUsernames = new Set(prev.map(acc => acc.username))
          const newAccounts = loadedAccounts.filter(acc => !existingUsernames.has(acc.username))
          return [...prev, ...newAccounts]
        })
        
        toast({
          title: "Profiles loaded",
          description: `Loaded ${data.length} source profiles from database.`,
        })
      } else {
        toast({
          title: "No profiles found",
          description: "No source profiles found in the database.",
        })
      }
    } catch (error) {
      console.error('Error loading profiles:', error)
      toast({
        title: "Failed to load profiles",
        description: "Could not load profiles from database. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingProfiles(false)
    }
  }

  const handleEditSourceProfiles = () => {
    setIsEditDialogOpen(true)
  }

  const handleFindAccounts = async () => {
    if (accounts.length === 0) {
      toast({
        title: "No accounts to scrape",
        description: "Please add some Instagram accounts first.",
        variant: "destructive",
      })
      return
    }

    if (totalScrapeCount <= 0) {
      toast({
        title: "Invalid scrape count",
        description: "Please enter a valid number of accounts to scrape (greater than 0).",
        variant: "destructive",
      })
      return
    }

    setIsScrapingLoading(true)
    setProgress(0)
    setProgressStep('scraping')
    onScrapingStart?.()

    try {
      const usernames = accounts.map(account => account.username)
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'
      
      // STEP 1: Scraping (0% -> 50%)
      setProgress(10)
      const response = await fetch(`${apiUrl}/api/scrape-followers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accounts: usernames,
          targetGender: 'male', // Default to male as requested
          totalScrapeCount: totalScrapeCount // Send user-defined total count
        })
      })

      const result: ApiResponse = await response.json()

      if (!result.success) {
        const errorMsg = result.error || 'Failed to scrape followers'
        onError?.(errorMsg)
        toast({
          title: "Scraping failed",
          description: errorMsg,
          variant: "destructive",
        })
        setProgressStep('idle')
        setProgress(0)
        return
      }

      setProgress(50)
      
      // STEP 2: Auto-Ingest to Database (50% -> 100%)
      setProgressStep('ingesting')
      setProgress(60)
      
      const ingestResponse = await fetch(`${apiUrl}/api/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profiles: result.data.accounts.map(account => ({
            id: account.id,
            username: account.username,
            full_name: account.fullName
          }))
        })
      })

      setProgress(80)
      const ingestResult = await ingestResponse.json()

      if (!ingestResult.success) {
        toast({
          title: "Ingestion failed",
          description: "Scraped data could not be saved to database.",
          variant: "destructive",
        })
        setProgressStep('idle')
        setProgress(0)
        return
      }

      setProgress(100)
      setProgressStep('complete')

      // Update UI with scraped data
      onScrapingComplete?.(result.data.accounts, result.data.totalFiltered)
      
      // Show success toast
      toast({
        title: "Process completed",
        description: `Scraped ${result.data.totalFiltered} accounts and added ${ingestResult.added_to_global} new profiles to database.`,
      })

      // Reset progress after 2 seconds
      setTimeout(() => {
        setProgressStep('idle')
        setProgress(0)
      }, 2000)

    } catch {
      const errorMsg = 'Failed to connect to API. Make sure the server is running on port 5001.'
      onError?.(errorMsg)
      toast({
        title: "Connection failed",
        description: errorMsg,
        variant: "destructive",
      })
      setProgressStep('idle')
      setProgress(0)
    } finally {
      setIsScrapingLoading(false)
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>Find Instagram Accounts</CardTitle>
            <p className="text-sm text-muted-foreground mt-1.5">
              Type in the search bar to add either usernames or links to instagram profiles
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={isLoadingProfiles}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={loadSourceProfiles} disabled={isLoadingProfiles}>
                {isLoadingProfiles ? 'Loading...' : 'Load source profiles'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEditSourceProfiles}>
                Edit source profiles
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter Instagram username or URL"
            className="flex-1"
          />
          <Button onClick={addAccount} variant="outline" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Added Accounts</h3>
          <div className="space-y-3">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{getInitials(account.username)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">@{account.username}</p>
                    <p className="text-xs text-muted-foreground">Instagram Account</p>
                  </div>
                </div>
                <Button
                  onClick={() => removeAccount(account.id)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {accounts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No Instagram accounts added yet</p>
            )}
          </div>
        </div>

        {/* Total Scrape Count Input */}
        <div className="space-y-2">
          <label htmlFor="totalScrapeCount" className="text-sm font-medium">
            Total Accounts to Scrape
          </label>
          <Input
            id="totalScrapeCount"
            type="number"
            min="1"
            value={totalScrapeCount}
            onChange={(e) => {
              const value = parseInt(e.target.value)
              if (value > 0 || e.target.value === '') {
          setTotalScrapeCount(value || 0)
              }
            }}
            placeholder="Enter total number of accounts"
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            {accounts.length === 1
              ? `The account will scrape ~${totalScrapeCount} followers`
              : accounts.length > 1
              ? `Each of the ${accounts.length} accounts will scrape ~${Math.floor(totalScrapeCount / accounts.length)} followers`
              : 'Add accounts above to see distribution'}
          </p>
        </div>

        {/* Progress Indicator */}
        {progressStep !== 'idle' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {progressStep === 'scraping' && '📡 Scraping followers...'}
                {progressStep === 'ingesting' && '💾 Saving to database...'}
                {progressStep === 'complete' && '✅ Complete!'}
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <Button className="w-full" size="lg" onClick={handleFindAccounts} disabled={isScrapingLoading || accounts.length === 0}>
          {isScrapingLoading ? (
            progressStep === 'scraping' ? "Scraping Followers..." : "Saving to Database..."
          ) : "Find Accounts"}
        </Button>
      </CardContent>

      {/* Edit Source Profiles Dialog */}
      <EditSourceProfilesDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onProfilesUpdated={loadSourceProfiles}
      />
    </Card>
  )
}
