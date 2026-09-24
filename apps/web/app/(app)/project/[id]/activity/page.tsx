"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

import { Avatar, AvatarImage } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { trpc } from "@/lib/trpc"

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export default function ActivityPage() {
  const params = useParams()
  const projectId = String(params.id)
  const [search, setSearch] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearchQuery(search), 300)
    return () => window.clearTimeout(timeout)
  }, [search])

  const logsQuery = trpc.projectSettings.auditLogsPage.useQuery(
    {
      projectId,
      page,
      pageSize,
      search: searchQuery,
    },
    {
      placeholderData: (previousData) => previousData,
    }
  )

  if (logsQuery.isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center py-10">
        <span className="text-sm text-muted-foreground">
          Loading activity...
        </span>
      </div>
    )
  }

  if (logsQuery.isError || !logsQuery.data) {
    return (
      <div className="flex min-h-full items-center justify-center py-10">
        <div className="text-center">
          <p className="text-sm text-destructive">
            Unable to load project activity.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => logsQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      </div>
    )
  }

  const logs = logsQuery.data.items
  const query = searchQuery.trim()
  const totalPages = logsQuery.data.totalPages

  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6 py-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Activity</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A record of changes and actions taken in this project.
          </p>
        </div>
      </header>

      <div className="flex items-center justify-between gap-3">
        <Input
          placeholder="Search activity..."
          value={search}
          onChange={(value) => {
            setSearch(value.target.value)
            setPage(1)
          }}
          className="w-full max-w-md"
        />
        <span className="shrink-0 text-sm text-muted-foreground">
          {logsQuery.data.total}{" "}
          {logsQuery.data.total === 1 ? "entry" : "entries"}
        </span>
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>User</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead className="text-right">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow className="border-border">
                <TableCell
                  colSpan={3}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  {query
                    ? "No activity matches your search."
                    : "No activity yet."}
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log, index) => (
                <TableRow
                  key={`${log.createdAt}-${index}`}
                  className="border-border"
                >
                  <TableCell>
                    {log.user ? (
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          <AvatarImage
                            className="rounded-sm"
                            src={log.user.image ?? undefined}
                            alt={log.user.name}
                          />
                        </Avatar>
                        <span className="truncate font-medium">
                          {log.user.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        System
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[32rem] font-medium">
                    {log.message}
                  </TableCell>
                  <TableCell className="text-right text-sm whitespace-nowrap text-muted-foreground">
                    {formatTimestamp(log.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || logsQuery.isFetching}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages || logsQuery.isFetching}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
