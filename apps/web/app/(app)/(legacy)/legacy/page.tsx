"use client"

// Libraries
import { useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/client/auth"
import { trpc } from "@/lib/trpc"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"

// Components
import { Folder, ArrowUpRight, Search, Loader2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"
import { Card } from "@workspace/ui/components/card"

// Types
function formatActivityDate(value: string) {
  const date = new Date(value)

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

type PaginationPage = number | "ellipsis-start" | "ellipsis-end"

function getPaginationItems(
  totalPages: number,
  currentPage: number
): PaginationPage[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const items: PaginationPage[] = []
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  items.push(1)

  if (start > 2) {
    items.push("ellipsis-start")
  } else {
    for (let p = 2; p < start; p++) items.push(p)
  }

  for (let p = start; p <= end; p++) items.push(p)

  if (end < totalPages - 1) {
    items.push("ellipsis-end")
  } else {
    for (let p = end + 1; p < totalPages; p++) items.push(p)
  }

  items.push(totalPages)
  return items
}

export default function Page() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  const [currentPage, setCurrentPage] = useState(1)
  const [activityPage, setActivityPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")

  const enabled = Boolean(session) && !isPending
  const projectsQuery = trpc.project.list.useQuery(undefined, { enabled })
  const usageQuery = trpc.usage.stats.useQuery(undefined, { enabled })
  const activityQuery = trpc.account.activity.useQuery(undefined, { enabled })
  const invitesQuery = trpc.projectMember.myInvites.useQuery(undefined, { enabled })

  const utils = trpc.useUtils()

  const acceptInviteMutation = trpc.projectMember.acceptInvite.useMutation({
    onSuccess: async (result) => {
      await Promise.all([
        utils.projectMember.myInvites.invalidate(),
        utils.project.list.invalidate(),
        utils.usage.stats.invalidate(),
        utils.account.activity.invalidate(),
      ])
      router.push(`/project/${result.projectId}`)
    },
    onError: (error) => toast.error(error.message),
  })

  const declineInviteMutation = trpc.projectMember.declineInvite.useMutation({
    onSuccess: async () => {
      await utils.projectMember.myInvites.invalidate()
      toast.success("Invitation declined")
    },
    onError: (error) => toast.error(error.message),
  })

  const projects = projectsQuery.data ?? []
  const usage = usageQuery.data
  const activities = activityQuery.data ?? []
  const invites = invitesQuery.data ?? []
  const isLoading =
    isPending ||
    projectsQuery.isLoading ||
    usageQuery.isLoading ||
    activityQuery.isLoading ||
    invitesQuery.isLoading
  const hasError =
    projectsQuery.isError ||
    usageQuery.isError ||
    activityQuery.isError ||
    invitesQuery.isError

  if (isLoading) {
    return null
  }

  if (hasError || !usage) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <p className="text-sm text-destructive">
          Unable to load your dashboard. Please try again.
        </p>
      </div>
    )
  }

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  )
  const totalPages = Math.ceil(filteredProjects.length / 5)
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * 5,
    currentPage * 5
  )
  const activityTotalPages = Math.ceil(activities.length / 5)
  const paginatedActivities = activities.slice(
    (activityPage - 1) * 5,
    activityPage * 5
  )

  return (
    <div className="flex min-h-svh flex-col gap-3 py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">
          Welcome, {session?.user.name}!
        </h1>
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          <Card className="gap-0 p-3">
            <p className="text-sm font-semibold text-muted-foreground">
              Your Projects
            </p>
            <p className="text-xl font-bold text-foreground">
              {usage.ownedProjects.current}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                / {usage.ownedProjects.limit}
              </span>
            </p>
          </Card>

          <Card className="gap-0 p-3">
            <p className="text-sm font-semibold text-muted-foreground">
              Events Quota
            </p>
            <p className="text-xl font-bold text-foreground">
              {usage.eventsMonth.current.toLocaleString()}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                / {usage.eventsMonth.limit.toLocaleString()}
              </span>
            </p>
          </Card>

          <Card className="gap-0 p-3">
            <p className="text-sm font-semibold text-muted-foreground">
              Account Plan
            </p>
            <p className="text-xl font-bold text-foreground">{usage.plan}</p>
          </Card>
        </div>
      </div>

      {invites.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            Pending Invitations
          </h2>

          <div className="grid gap-2">
            {invites.map((invite) => (
              <Card key={invite.id} className="p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {invite.project.name}
                      </span>
                      <Badge variant="secondary">{invite.role}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Invited by {invite.invitedBy.name} ({invite.invitedBy.email})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={
                        acceptInviteMutation.isPending ||
                        declineInviteMutation.isPending
                      }
                      onClick={() =>
                        declineInviteMutation.mutate({ token: invite.token })
                      }
                    >
                      {declineInviteMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Decline"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      disabled={
                        acceptInviteMutation.isPending ||
                        declineInviteMutation.isPending
                      }
                      onClick={() =>
                        acceptInviteMutation.mutate({ token: invite.token })
                      }
                    >
                      {acceptInviteMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Accept"
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Your Projects
          </h2>
          <Button variant="default">
            <Link href="/new">Create Project</Link>
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-lg bg-card p-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Folder
                className="size-5 text-muted-foreground"
                fill="currentColor"
              />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-foreground">
                No Projects Yet
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                You haven&apos;t created any projects yet. Get started by
                creating your first project to start tracking events.
              </p>
            </div>
            <a
              href="#"
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Learn More
              <ArrowUpRight className="size-3" />
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                aria-label="Search projects"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setCurrentPage(1)
                }}
                className="h-8 !border-0 !bg-card pl-9"
              />
            </div>

            <div className="overflow-hidden rounded-lg bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="w-fit pl-4 whitespace-nowrap text-muted-foreground">
                      Project
                    </TableHead>
                    <TableHead className="w-fit pl-4 whitespace-nowrap text-muted-foreground">
                      Owner
                    </TableHead>
                    <TableHead className="w-fit pr-4 pl-4 text-right whitespace-nowrap text-muted-foreground">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProjects.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={3}
                        className="h-28 text-center text-muted-foreground"
                      >
                        No projects match your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProjects.map((project) => (
                      <TableRow
                        key={project.id}
                        className="cursor-pointer border-border/40 transition-colors hover:bg-accent/50"
                        onClick={() => router.push(`/project/${project.id}`)}
                      >
                        <TableCell className="w-fit pl-4 font-medium whitespace-nowrap text-foreground">
                          {project.name}
                        </TableCell>
                        <TableCell className="w-fit pl-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="relative size-6 overflow-hidden rounded-sm border border-border/60 bg-secondary">
                              <Image
                                src={project.owner?.image || ""}
                                alt={project.owner?.name || "Avatar"}
                                width={24}
                                height={24}
                                unoptimized
                                className="object-cover"
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {project.owner?.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="w-fit pr-4 pl-4 text-right whitespace-nowrap">
                          <Button
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/project/${project.id}/settings`)
                            }}
                          >
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent className="justify-center">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {getPaginationItems(totalPages, currentPage).map((page) =>
                    page === "ellipsis-start" || page === "ellipsis-end" ? (
                      <PaginationItem key={page}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={page === currentPage}
                          onClick={() => setCurrentPage(page)}
                          className="cursor-pointer border-0"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Recent Activity
        </h2>

        <div className="overflow-hidden rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="pl-4 text-muted-foreground">
                  Activity
                </TableHead>
                <TableHead className="text-muted-foreground">Project</TableHead>
                <TableHead className="text-muted-foreground">User</TableHead>
                <TableHead className="pr-4 text-right text-muted-foreground">
                  Date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedActivities.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={4}
                    className="h-28 text-center text-muted-foreground"
                  >
                    No recent activity yet.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedActivities.map((activity) => (
                  <TableRow
                    key={activity.id}
                    className="cursor-pointer border-border/40 transition-colors hover:bg-accent/50"
                    onClick={() =>
                      router.push(`/project/${activity.project.id}/settings`)
                    }
                  >
                    <TableCell className="max-w-80 pl-4">
                      <span className="font-medium text-foreground">
                        {activity.message}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {activity.project.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="relative size-6 overflow-hidden rounded-sm border border-border/60 bg-secondary">
                          <Image
                            src={activity.user.image || ""}
                            alt={activity.user.name}
                            width={24}
                            height={24}
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {activity.user.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="pr-4 text-right whitespace-nowrap text-muted-foreground">
                      {formatActivityDate(activity.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {activityTotalPages > 1 && (
          <Pagination>
            <PaginationContent className="justify-center">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    setActivityPage((page) => Math.max(1, page - 1))
                  }
                  className={
                    activityPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              {getPaginationItems(activityTotalPages, activityPage).map(
                (page) =>
                  page === "ellipsis-start" || page === "ellipsis-end" ? (
                    <PaginationItem key={page}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === activityPage}
                        onClick={() => setActivityPage(page)}
                        className="cursor-pointer border-0"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setActivityPage((page) =>
                      Math.min(activityTotalPages, page + 1)
                    )
                  }
                  className={
                    activityPage === activityTotalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  )
}
