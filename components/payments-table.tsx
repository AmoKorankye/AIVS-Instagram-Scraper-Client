"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface Account {
  id: string
  fullName: string
  username: string
}

export function PaymentsTable({ accounts = [], totalFiltered = 0, isLoading = false }: {
  accounts?: Account[]
  totalFiltered?: number
  isLoading?: boolean
}) {
  const [currentPage, setCurrentPage] = useState(0)
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
        <Button>Assign to VAs</Button>
      </CardHeader>
      <CardContent>

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
