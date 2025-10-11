"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface UsernameStatusCardProps {
  onStatusChange?: (isReady: boolean, unusedCount: number, statusMessage: string) => void
}

export function UsernameStatusCard({ onStatusChange }: UsernameStatusCardProps) {
  const [unusedCount, setUnusedCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calculate daily target: NUM_VA_TABLES * PROFILES_PER_TABLE
  const numVATables = Number(process.env.NEXT_PUBLIC_NUM_VA_TABLES) || 80
  const profilesPerTable = Number(process.env.NEXT_PUBLIC_PROFILES_PER_TABLE) || 180
  const dailyTarget = numVATables * profilesPerTable

  // Status messages - single source of truth
  const STATUS_MESSAGES = {
    READY: "You can proceed with the VA assignment.",
    NOT_READY: "Scrape additional followers before proceeding."
  }

  const fetchUnusedCount = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { count, error } = await supabase
        .from('global_usernames')
        .select('*', { count: 'exact', head: true })
        .eq('used', false)
      
      if (error) throw error
      
      const currentCount = count ?? 0
      setUnusedCount(currentCount)
      
      // Determine readiness and corresponding message
      const ready = currentCount >= dailyTarget
      const message = ready ? STATUS_MESSAGES.READY : STATUS_MESSAGES.NOT_READY
      
      // 🔍 DEBUG LOGGING
      console.log('=== USERNAME STATUS DEBUG ===')
      console.log('Database count (unused usernames):', currentCount)
      console.log('Daily target threshold:', dailyTarget)
      console.log('Is ready (count >= target):', ready)
      console.log('Status message:', message)
      console.log('Notifying parent with canAssignToVAs:', ready)
      console.log('============================')
      
      // Notify parent with both readiness state and status message
      onStatusChange?.(ready, currentCount, message)
    } catch (err) {
      console.error('Error fetching unused usernames count:', err)
      setError('Failed to load username status')
      setUnusedCount(0)
      onStatusChange?.(false, 0, STATUS_MESSAGES.NOT_READY)
    } finally {
      setIsLoading(false)
    }
  }, [dailyTarget, onStatusChange])

  useEffect(() => {
    fetchUnusedCount()
  }, [fetchUnusedCount])

  useEffect(() => {
    // Notify parent immediately when component mounts or count changes
    if (unusedCount !== null) {
      const ready = unusedCount >= dailyTarget
      const message = ready ? STATUS_MESSAGES.READY : STATUS_MESSAGES.NOT_READY
      onStatusChange?.(ready, unusedCount, message)
    }
  }, [unusedCount, dailyTarget, onStatusChange])

  // Derive state from the same logic - ensuring consistency
  const isReady = unusedCount !== null && unusedCount >= dailyTarget
  const statusMessage = isReady ? STATUS_MESSAGES.READY : STATUS_MESSAGES.NOT_READY

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Username Status
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchUnusedCount}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {unusedCount?.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">
                usernames remaining
              </span>
            </div>
            
            <div className="flex items-start gap-2">
              {isReady ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              )}
              <p className={`text-sm font-medium ${isReady ? 'text-green-600' : 'text-destructive'}`}>
                {statusMessage}
              </p>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Daily Target:</span>
                <span className="font-medium">{dailyTarget.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>Needed:</span>
                <span className={`font-medium ${isReady ? 'text-green-600' : 'text-orange-600'}`}>
                  {isReady ? 0 : (dailyTarget - (unusedCount ?? 0)).toLocaleString()}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
