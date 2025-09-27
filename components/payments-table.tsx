"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

const accounts = [
  {
    id: "001",
    fullName: "Kenneth Williams",
    username: "ken99",
    followerOf: "tech_influencer",
  },
  {
    id: "002",
    fullName: "Abraham Johnson",
    username: "abe45",
    followerOf: "fitness_guru",
  },
  {
    id: "003",
    fullName: "Monserrat Davis",
    username: "monserrat44",
    followerOf: "fashion_blogger",
  },
  {
    id: "004",
    fullName: "Carmella Rodriguez",
    username: "carmella",
    followerOf: "food_critic",
  },
  {
    id: "005",
    fullName: "Jason Thompson",
    username: "jason78",
    followerOf: "travel_vlogger",
  },
  {
    id: "006",
    fullName: "Sarah Martinez",
    username: "sarah23",
    followerOf: "lifestyle_coach",
  },
  {
    id: "007",
    fullName: "Michael Brown",
    username: "mike_b",
    followerOf: "business_mentor",
  },
  {
    id: "008",
    fullName: "Emily Chen",
    username: "emily_c",
    followerOf: "art_curator",
  },
  {
    id: "009",
    fullName: "David Wilson",
    username: "dave_w",
    followerOf: "music_producer",
  },
  {
    id: "010",
    fullName: "Lisa Anderson",
    username: "lisa_a",
    followerOf: "wellness_expert",
  },
  {
    id: "011",
    fullName: "Robert Taylor",
    username: "rob_t",
    followerOf: "crypto_analyst",
  },
  {
    id: "012",
    fullName: "Jennifer Lee",
    username: "jen_lee",
    followerOf: "design_studio",
  },
]

export function PaymentsTable() {
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
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
      <div className="flex-1">
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="w-10">
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Extracted Accounts</CardTitle>
          <p className="text-sm text-muted-foreground">{totalAccounts} instagram accounts found</p>
        </div>
        <Button>Assign to VAs</Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {startIndex}–{endIndex} of {totalAccounts}
          </p>
        </div>

        <div className="rounded-md border">
          <div className="border-b bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-4">
              <div className="w-12 font-medium">#</div>
              <div className="flex-1 font-medium">ID</div>
              <div className="flex-1 font-medium">Full Name</div>
              <div className="flex-1 font-medium">Username</div>
              <div className="flex-1 font-medium">Follower Of</div>
              <div className="w-10"></div>
            </div>
          </div>

          <div className="divide-y">
            {isLoading
              ? Array.from({ length: 10 }, (_, index) => <SkeletonRow key={`skeleton-${index}`} index={index} />)
              : currentAccounts.map((account, index) => (
                  <div key={account.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="w-12 text-sm font-medium text-muted-foreground">{startIndex + index + 1}</div>
                    <div className="flex-1 text-sm font-medium">{account.id}</div>
                    <div className="flex-1 text-sm">{account.fullName}</div>
                    <div className="flex-1 text-sm">@{account.username}</div>
                    <div className="flex-1 text-sm">@{account.followerOf}</div>
                    <div className="w-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View details</DropdownMenuItem>
                          <DropdownMenuItem>Edit account</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Remove account</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
          </div>
        </div>

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
      </CardContent>
    </Card>
  )
}
