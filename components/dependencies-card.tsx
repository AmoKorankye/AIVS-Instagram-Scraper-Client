"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface InstagramAccount {
  id: number
  username: string
}

export function DependenciesCard() {
  const [inputValue, setInputValue] = useState("")
  const [accounts, setAccounts] = useState<InstagramAccount[]>([])
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

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Find Instagram Accounts</CardTitle>
        <p className="text-sm text-muted-foreground">
          Type in the search bar to add either usernames or links to instagram profiles
        </p>
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

        <Button className="w-full" size="lg">
          Find Accounts
        </Button>
      </CardContent>
    </Card>
  )
}
