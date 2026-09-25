"use client"

import { notFound, useParams } from "next/navigation"
import { useState } from "react"

import { Button } from "@workspace/ui/components/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { trpc } from "@/lib/trpc"

function statusClass(status: number) {
  if (status >= 200 && status < 300) return "text-emerald-500"
  if (status >= 400) return "text-red-500"
  return "text-amber-500"
}

function formatJson(body: string | null) {
  if (!body) return null
  try {
    return JSON.stringify(JSON.parse(body), null, 2)
  } catch {
    return body
  }
}

export default function ApiLogsPage() {
  const params = useParams()
  const projectId = String(params.id)
  const [page, setPage] = useState(1)
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)
  const pageSize = 20
  const logsQuery = trpc.projectSettings.requestLogsPage.useQuery({
    projectId,
    page,
    pageSize,
  })
  const requestLogsQuery = trpc.projectSettings.requestLogs.useQuery(
    { projectId },
    { enabled: selectedLogId !== null }
  )
  const selectedLog = requestLogsQuery.data?.find(
    (log) => log.id === selectedLogId
  )

  if (logsQuery.isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center py-10">
        <span className="text-sm text-muted-foreground">
          Loading API logs...
        </span>
      </div>
    )
  }

  if (logsQuery.isError || !logsQuery.data) {
    if (logsQuery.error?.data?.code === "NOT_FOUND") return notFound()
    return (
      <div className="flex min-h-full items-center justify-center py-10">
        <span className="text-sm text-destructive">
          Unable to load API logs.
        </span>
      </div>
    )
  }

  const { items, total, totalPages } = logsQuery.data

  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6 py-6">
      <header>
        <h1 className="text-2xl font-semibold">API logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Inspect requests received by this project.
        </p>
      </header>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Endpoint</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow className="border-border">
                <TableCell
                  colSpan={4}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No API requests recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((log) => (
                <TableRow
                  key={log.id}
                  className="cursor-pointer border-border"
                  onClick={() => setSelectedLogId(log.id)}
                >
                  <TableCell className="max-w-[28rem] truncate font-medium">
                    {log.endpoint}
                  </TableCell>
                  <TableCell
                    className={`font-medium ${statusClass(log.status)}`}
                  >
                    {log.status}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.method}
                  </TableCell>
                  <TableCell className="text-right text-sm whitespace-nowrap text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
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
            Page {page} of {totalPages} · {total} total
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

      <Sheet
        open={selectedLogId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedLogId(null)
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Request details</SheetTitle>
            <SheetDescription className="break-all">
              {selectedLog?.method} {selectedLog?.endpoint}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
            {selectedLog ? (
              <>
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium">{selectedLog.method}</span>
                  <span className="text-muted-foreground">Route</span>
                  <span className="font-medium break-all">
                    {selectedLog.endpoint}
                  </span>
                  <span className="text-muted-foreground">Status</span>
                  <span
                    className={`font-medium ${statusClass(selectedLog.status)}`}
                  >
                    {selectedLog.status}
                  </span>
                  <span className="text-muted-foreground">User agent</span>
                  <span className="font-medium break-all">
                    {selectedLog.userAgent ?? "—"}
                  </span>
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">
                    Request body
                  </span>
                  <pre className="max-h-64 w-full overflow-auto rounded-md bg-muted p-3 font-mono text-xs break-all whitespace-pre-wrap">
                    {formatJson(selectedLog.requestBody) ?? "—"}
                  </pre>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">
                    Response body
                  </span>
                  <pre className="max-h-64 w-full overflow-auto rounded-md bg-muted p-3 font-mono text-xs break-all whitespace-pre-wrap">
                    {formatJson(selectedLog.responseBody) ?? "—"}
                  </pre>
                </div>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">
                Loading request details...
              </span>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
