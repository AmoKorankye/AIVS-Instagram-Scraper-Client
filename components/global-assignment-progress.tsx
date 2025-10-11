"use client"

import { useAssignmentProgress } from "@/contexts/assignment-progress-context"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"

export function GlobalAssignmentProgress() {
  const { isAssigning, progress, progressStep, profilesPerTable } = useAssignmentProgress()

  // Don't render anything if not assigning
  if (progressStep === 'idle') {
    return null
  }

  return (
    <Card className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl shadow-lg">
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {progressStep === 'creating' && '📋 Creating campaign and selecting profiles...'}
            {progressStep === 'distributing' && '🎲 Distributing to VA tables...'}
            {progressStep === 'syncing' && '☁️ Syncing to Airtable...'}
            {progressStep === 'complete' && `✅ Complete! Assigned ${profilesPerTable} accounts per VA.`}
          </span>
          <span className="font-bold text-primary">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </Card>
  )
}
