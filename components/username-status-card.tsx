"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export function UsernameStatusCard() {
  const [unusedCount, setUnusedCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const dailyTarget = Number(process.env.NEXT_PUBLIC_DAILY_SELECTION_TARGET) || 14400

  useEffect(() => {
    fetchUnusedCount()
  }, [])

  const fetchUnusedCount = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { count, error } = await supabase
        .from('global_usernames')
        .select('*', { count: 'exact', head: true })
        .eq('used', false)
      
      if (error) throw error
      
      setUnusedCount(count ?? 0)
    } catch (err) {
      console.error('Error fetching unused usernames count:', err)
      setError('Failed to load username status')
      setUnusedCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  const isReady = unusedCount !== null && unusedCount >= dailyTarget
  const statusMessage = isReady
    ? "You can proceed with the VA assignment."
    : "Scrape additional followers before proceeding."

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Username Status
        </CardTitle>
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
                <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              )}
              <p className={`text-sm ${isReady ? 'text-muted-foreground' : 'text-destructive'}`}>
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
