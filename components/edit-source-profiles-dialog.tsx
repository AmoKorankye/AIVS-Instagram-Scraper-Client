"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, X, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface SourceProfile {
  id: string
  username: string
}

interface EditSourceProfilesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProfilesUpdated?: () => void
}

export function EditSourceProfilesDialog({ 
  open, 
  onOpenChange,
  onProfilesUpdated 
}: EditSourceProfilesDialogProps) {
  const [profiles, setProfiles] = useState<SourceProfile[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [password, setPassword] = useState("")
  const [isClearing, setIsClearing] = useState(false)
  const { toast } = useToast()

  // Fetch profiles when dialog opens
  const fetchProfiles = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('source_profiles')
        .select('id, username')
        .order('username', { ascending: true })
      
      if (error) throw error
      
      setProfiles(data || [])
    } catch (error) {
      console.error('Error fetching profiles:', error)
      toast({
        title: "Failed to load profiles",
        description: "Could not load profiles from database.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (open) {
      fetchProfiles()
    }
  }, [open, fetchProfiles])

  const extractUsername = (input: string): string | null => {
    const trimmedInput = input.trim()

    // Check if it's a URL
    if (trimmedInput.startsWith("http")) {
      if (!trimmedInput.toLowerCase().includes("instagram")) {
        return null
      }

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
      const usernamePattern = /^[a-zA-Z0-9._]+$/
      if (usernamePattern.test(trimmedInput) && trimmedInput.length > 0) {
        return trimmedInput
      }
      return null
    }
  }

  const addProfile = async () => {
    if (!inputValue.trim()) return

    const username = extractUsername(inputValue)
    if (!username) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid Instagram username or URL.",
        variant: "destructive",
      })
      return
    }

    // Check if profile already exists
    if (profiles.some((profile) => profile.username === username)) {
      toast({
        title: "Profile already exists",
        description: "This username is already in the source profiles.",
        variant: "destructive",
      })
      return
    }

    try {
      // Generate a UUID for the new profile
      const profileId = crypto.randomUUID()
      
      const { data, error } = await supabase
        .from('source_profiles')
        .insert([{ id: profileId, username }])
        .select()
      
      if (error) throw error
      
      if (data && data[0]) {
        setProfiles((prev) => [data[0], ...prev])
        setInputValue("")
        toast({
          title: "Profile added",
          description: `@${username} has been added to source profiles.`,
        })
      }
    } catch (error) {
      console.error('Error adding profile:', error)
      toast({
        title: "Failed to add profile",
        description: "Could not add profile to database.",
        variant: "destructive",
      })
    }
  }

  const removeProfile = async (id: string, username: string) => {
    try {
      const { error } = await supabase
        .from('source_profiles')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setProfiles((prev) => prev.filter((profile) => profile.id !== id))
      toast({
        title: "Profile removed",
        description: `@${username} has been removed from source profiles.`,
      })
    } catch (error) {
      console.error('Error removing profile:', error)
      toast({
        title: "Failed to remove profile",
        description: "Could not remove profile from database.",
        variant: "destructive",
      })
    }
  }

  const handleClearAll = async () => {
    // Simple password check - in production, use proper authentication
    const correctPassword = process.env.NEXT_PUBLIC_LOGIN_PASSWORD
    
    if (password !== correctPassword) {
      toast({
        title: "Incorrect password",
        description: "The password you entered is incorrect.",
        variant: "destructive",
      })
      setPassword("")
      return
    }

    setIsClearing(true)
    try {
      const { error } = await supabase
        .from('source_profiles')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all (using a condition that's always true)
      
      if (error) throw error
      
      setProfiles([])
      setShowPasswordPrompt(false)
      setPassword("")
      toast({
        title: "All profiles cleared",
        description: "All source profiles have been deleted from the database.",
      })
    } catch (error) {
      console.error('Error clearing profiles:', error)
      toast({
        title: "Failed to clear profiles",
        description: "Could not delete profiles from database.",
        variant: "destructive",
      })
    } finally {
      setIsClearing(false)
    }
  }

  const handleSaveAndClose = () => {
    onProfilesUpdated?.()
    onOpenChange(false)
    toast({
      title: "Changes saved",
      description: "Source profiles have been updated.",
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addProfile()
    }
  }

  const handlePasswordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleClearAll()
    }
  }

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Source Profiles</DialogTitle>
          <DialogDescription>
            Add or remove Instagram accounts from your source profiles database.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Add new profile section */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Add New Profile</h3>
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter Instagram username or URL"
                className="flex-1"
              />
              <Button onClick={addProfile} variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Profiles list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">
                Source Profiles ({profiles.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordPrompt(!showPasswordPrompt)}
                className="text-destructive hover:text-destructive"
                disabled={profiles.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>

            {/* Password prompt for clear all */}
            {showPasswordPrompt && (
              <div className="p-4 border rounded-lg bg-destructive/10 space-y-3">
                <p className="text-sm font-medium text-destructive">
                  ⚠️ This will delete all {profiles.length} source profiles permanently.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handlePasswordKeyPress}
                    placeholder="Enter password to confirm"
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleClearAll} 
                    variant="destructive"
                    disabled={isClearing || !password}
                  >
                    {isClearing ? "Clearing..." : "Confirm Delete"}
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowPasswordPrompt(false)
                      setPassword("")
                    }} 
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Profiles list */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Loading profiles...
                </p>
              ) : profiles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No source profiles found
                </p>
              ) : (
                profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(profile.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">@{profile.username}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => removeProfile(profile.id, profile.username)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveAndClose}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
