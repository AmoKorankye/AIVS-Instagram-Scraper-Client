"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

type ProgressStep = 'idle' | 'creating' | 'distributing' | 'syncing' | 'complete'

interface AssignmentProgressContextType {
  isAssigning: boolean
  progress: number
  progressStep: ProgressStep
  profilesPerTable: number | null
  startAssignment: () => void
  updateProgress: (progress: number, step: ProgressStep) => void
  completeAssignment: (profilesPerTable: number) => void
  failAssignment: () => void
  resetAssignment: () => void
}

const AssignmentProgressContext = createContext<AssignmentProgressContextType | undefined>(undefined)

export function AssignmentProgressProvider({ children }: { children: ReactNode }) {
  const [isAssigning, setIsAssigning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressStep, setProgressStep] = useState<ProgressStep>('idle')
  const [profilesPerTable, setProfilesPerTable] = useState<number | null>(null)

  const startAssignment = useCallback(() => {
    setIsAssigning(true)
    setProgress(0)
    setProgressStep('creating')
    setProfilesPerTable(null)
  }, [])

  const updateProgress = useCallback((newProgress: number, step: ProgressStep) => {
    setProgress(newProgress)
    setProgressStep(step)
  }, [])

  const completeAssignment = useCallback((profiles: number) => {
    setProgress(100)
    setProgressStep('complete')
    setProfilesPerTable(profiles)
    
    // Reset after 2 seconds
    setTimeout(() => {
      setProgressStep('idle')
      setProgress(0)
      setIsAssigning(false)
      setProfilesPerTable(null)
    }, 2000)
  }, [])

  const failAssignment = useCallback(() => {
    setProgressStep('idle')
    setProgress(0)
    setIsAssigning(false)
    setProfilesPerTable(null)
  }, [])

  const resetAssignment = useCallback(() => {
    setProgressStep('idle')
    setProgress(0)
    setIsAssigning(false)
    setProfilesPerTable(null)
  }, [])

  return (
    <AssignmentProgressContext.Provider
      value={{
        isAssigning,
        progress,
        progressStep,
        profilesPerTable,
        startAssignment,
        updateProgress,
        completeAssignment,
        failAssignment,
        resetAssignment,
      }}
    >
      {children}
    </AssignmentProgressContext.Provider>
  )
}

export function useAssignmentProgress() {
  const context = useContext(AssignmentProgressContext)
  if (context === undefined) {
    throw new Error('useAssignmentProgress must be used within an AssignmentProgressProvider')
  }
  return context
}
