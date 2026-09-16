"use client"

import { Button } from "@workspace/ui/components/button"
import { notFound, useParams } from "next/navigation"
import { useState } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { trpc } from "@/lib/trpc"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Badge } from "@workspace/ui/components/badge"
import { Switch } from "@workspace/ui/components/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Form } from "@workspace/ui/components/form"
import { SearchBar } from "@workspace/ui/components/search-bar"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Copy, Check } from "lucide-react"
import { Avatar, AvatarImage } from "@workspace/ui/components/avatar"

type CreateApiKey = {
  name: string
}

type RenameProject = {
  name: string
}

type DeleteProject = Record<string, never>

type CreateWebhook = {
  name: string
  subscription: string
  url: string
}

type RequestLogItem = {
  id: string
  endpoint: string
  method: string
  status: number
  userAgent: string | null
  requestBody: string | null
  responseBody: string | null
  createdAt: string
}

type WebhookItem = {
  id: string
  projectId: string
  name: string
  subscription: string
  url: string
  enabled: boolean
  lastTriggered: string | null
  createdAt: string
  updatedAt: string
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
  const params = useParams()
  const router = useRouter()
  const projectId = String(params.id)
  const utils = trpc.useUtils()
  const projectQuery = trpc.project.get.useQuery({ id: projectId })
  const apiKeysQuery = trpc.apiKey.list.useQuery({ projectId })
  const auditLogsQuery = trpc.projectSettings.auditLogs.useQuery({ projectId })
  const requestLogsQuery = trpc.projectSettings.requestLogs.useQuery({ projectId })
  const webhooksQuery = trpc.webhook.list.useQuery({ projectId })

  const project = projectQuery.data
  const apiKeys = apiKeysQuery.data ?? []
  const auditLogs = auditLogsQuery.data ?? []
  const requestLogs = requestLogsQuery.data ?? []
  const webhooks = webhooksQuery.data ?? []

  const [createApiKey, setCreateApiKey] = useState(false)
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null)
  const [copiedApiKey, setCopiedApiKey] = useState(false)
  const [apiKeySearch, setApiKeySearch] = useState("")

  const [createWebhook, setCreateWebhook] = useState(false)

  const [renameProject, setRenameProject] = useState(false)
  const [deleteProject, setDeleteProject] = useState(false)

  const [deleteApiKey, setDeleteApiKey] = useState<string | null>(null)
  const [activitySearch, setActivitySearch] = useState("")
  const [activityPage, setActivityPage] = useState(1)
  const ACTIVITY_PER_PAGE = 8

  const [requestLogPage, setRequestLogPage] = useState(1)
  const REQUEST_LOGS_PER_PAGE = 5
  const [requestLogSearch, setRequestLogSearch] = useState("")
  const [selectedRequestLog, setSelectedRequestLog] =
    useState<RequestLogItem | null>(null)
  const [requestLogDetailOpen, setRequestLogDetailOpen] = useState(false)

  const [webhookSearch, setWebhookSearch] = useState("")
  const [editWebhookOpen, setEditWebhookOpen] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<WebhookItem | null>(null)
  const [editWebhookName, setEditWebhookName] = useState("")
  const [editWebhookSubscription, setEditWebhookSubscription] = useState("")
  const [editWebhookUrl, setEditWebhookUrl] = useState("")
  const [editWebhookEnabled, setEditWebhookEnabled] = useState(true)

  type CreateWebhookForm = {
    name: string
    subscription: string
    url: string
  }

  type EditWebhookForm = {
    name: string
    subscription: string
    url: string
    enabled: boolean
  }

  const createApiKeyMutation = trpc.apiKey.create.useMutation({
    onSuccess: async (result) => {
      await Promise.all([
        utils.apiKey.list.invalidate({ projectId }),
        utils.project.get.invalidate({ id: projectId }),
        utils.projectSettings.auditLogs.invalidate({ projectId }),
      ])
      setCreatedApiKey(result.secret)
      toast.success("Created api key")
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteApiKeyMutation = trpc.apiKey.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.apiKey.list.invalidate({ projectId }),
        utils.project.get.invalidate({ id: projectId }),
        utils.projectSettings.auditLogs.invalidate({ projectId }),
      ])
      setDeleteApiKey(null)
      toast.success("API Key deleted")
    },
    onError: (error) => toast.error(error.message),
  })

  const createWebhookMutation = trpc.webhook.create.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.webhook.list.invalidate({ projectId }),
        utils.projectSettings.auditLogs.invalidate({ projectId }),
      ])
      setCreateWebhook(false)
      toast.success("Webhook created")
    },
    onError: (error) => toast.error(error.message),
  })

  const updateWebhookMutation = trpc.webhook.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.webhook.list.invalidate({ projectId }),
        utils.projectSettings.auditLogs.invalidate({ projectId }),
      ])
      setEditWebhookOpen(false)
      setEditingWebhook(null)
      toast.success("Webhook updated")
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteWebhookMutation = trpc.webhook.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.webhook.list.invalidate({ projectId }),
        utils.projectSettings.auditLogs.invalidate({ projectId }),
      ])
      toast.success("Webhook deleted")
    },
    onError: (error) => toast.error(error.message),
  })

  const renameProjectMutation = trpc.project.rename.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.project.get.invalidate({ id: projectId }),
        utils.project.list.invalidate(),
        utils.projectSettings.auditLogs.invalidate({ projectId }),
      ])
      setRenameProject(false)
      toast.success("Project renamed")
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteProjectMutation = trpc.project.delete.useMutation({
    onSuccess: async () => {
      await utils.project.list.invalidate()
      toast.success("Project deleted")
      await router.replace("/")
    },
    onError: (error) => toast.error(error.message),
  })

  function handleCreateWebhook(data: CreateWebhookForm) {
    createWebhookMutation.mutate({ projectId, ...data })
  }

  function updateWebhook(data: EditWebhookForm) {
    if (!editingWebhook) return
    updateWebhookMutation.mutate({
      projectId,
      webhookId: editingWebhook.id,
      ...data,
    })
  }

  function deleteWebhook(webhookId: string) {
    deleteWebhookMutation.mutate({ projectId, webhookId })
  }

  function openEditWebhook(webhook: WebhookItem) {
    setEditingWebhook(webhook)
    setEditWebhookName(webhook.name)
    setEditWebhookSubscription(webhook.subscription)
    setEditWebhookUrl(webhook.url)
    setEditWebhookEnabled(webhook.enabled)
    setEditWebhookOpen(true)
  }

  function formatJson(body: string | null) {
    if (!body) return null
    try {
      return JSON.stringify(JSON.parse(body), null, 2)
    } catch {
      return body
    }
  }

  function copyCreatedApiKey() {
    if (createdApiKey) {
      navigator.clipboard.writeText(createdApiKey)
      setCopiedApiKey(true)
      setTimeout(() => setCopiedApiKey(false), 2000)
    }
  }

  function closeCreateApiKeyDialog() {
    setCreateApiKey(false)
    setCreatedApiKey(null)
    setCopiedApiKey(false)
  }

  if (
    projectQuery.isLoading ||
    apiKeysQuery.isLoading ||
    auditLogsQuery.isLoading ||
    requestLogsQuery.isLoading ||
    webhooksQuery.isLoading
  ) {
    return (
      <div className="flex min-h-svh items-center justify-center py-6">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (projectQuery.error?.data?.code === "NOT_FOUND") {
    return notFound()
  }

  if (
    projectQuery.isError ||
    apiKeysQuery.isError ||
    auditLogsQuery.isError ||
    requestLogsQuery.isError ||
    webhooksQuery.isError
  ) {
    return (
      <div className="flex min-h-svh items-center justify-center py-6">
        <div className="text-sm text-destructive">
          Unable to load project settings. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col gap-3 py-6">
      <div className="flex flex-col gap-1">
        <Breadcrumb>
          <BreadcrumbList className="text-sm">
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/" />}>
                Projects
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href={`/project/${projectId}`} />}>
                {project?.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold">{project?.name}</h1>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">API Keys</h2>
          <Dialog
            open={createApiKey}
            onOpenChange={(open) => {
              setCreateApiKey(open)
              if (!open) {
                setCreatedApiKey(null)
                setCopiedApiKey(false)
              }
            }}
          >
            <DialogTrigger
              render={<Button className="cursor-pointer" size="sm" />}
            >
              Create API Key
            </DialogTrigger>
            <DialogContent>
              {createdApiKey ? (
                <>
                  <DialogHeader>
                    <DialogTitle>Your API Key</DialogTitle>
                    <DialogDescription>
                      This is the only time we can show the secret for this API
                      key.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex items-center gap-2 rounded-md bg-black/30 p-3 font-mono text-xs break-all">
                    <span className="flex-1">{createdApiKey}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0"
                      onClick={copyCreatedApiKey}
                    >
                      {copiedApiKey ? (
                        <Check className="size-3" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                  </div>
                  <DialogFooter>
                    <Button onClick={closeCreateApiKeyDialog}>Got it</Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Create API Key</DialogTitle>
                    <DialogDescription>
                      Create a key to send events to this project.
                    </DialogDescription>
                  </DialogHeader>
                  <Form<CreateApiKey>
                    onSubmit={(data) => {
                      createApiKeyMutation.mutate({ projectId, ...data })
                    }}
                  >
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Form.Field<CreateApiKey> name="name">
                          <Input placeholder="Hello World" required />
                        </Form.Field>
                      </div>
                      <DialogFooter>
                        <Form.Submit>
                          <Button disabled={createApiKeyMutation.isPending}>
                            {createApiKeyMutation.isPending
                              ? "Creating..."
                              : "Create API Key"}
                          </Button>
                        </Form.Submit>
                      </DialogFooter>
                    </div>
                  </Form>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <SearchBar
          value={apiKeySearch}
          onChange={(value) => setApiKeySearch(value)}
          className="mb-2"
        />

        <div className="overflow-hidden rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="w-fit pl-4 whitespace-nowrap text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="w-fit pl-4 whitespace-nowrap text-muted-foreground">
                  Created
                </TableHead>
                <TableHead className="w-fit pr-4 pl-4 text-right whitespace-nowrap text-muted-foreground">
                  Last Used
                </TableHead>
                <TableHead className="w-fit pr-4 pl-4 text-right whitespace-nowrap text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                const filteredApiKeys =
                  apiKeys.filter((key) =>
                    key.name.toLowerCase().includes(apiKeySearch.toLowerCase())
                  ) ?? []

                if (filteredApiKeys.length === 0) {
                  return (
                    <TableRow className="border-0 hover:bg-transparent">
                      <TableCell
                        colSpan={4}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <p>
                            {apiKeySearch
                              ? "No API keys match your search"
                              : "No API keys configured"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                }

                return filteredApiKeys.map((key) => (
                  <TableRow
                    key={key.id}
                    className="border-border/40 transition-colors hover:bg-accent/50"
                  >
                    <TableCell className="w-fit pl-4 font-medium whitespace-nowrap text-foreground">
                      {key.name}
                    </TableCell>
                    <TableCell className="w-fit pl-4 whitespace-nowrap text-muted-foreground">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="w-fit pr-4 pl-4 text-right whitespace-nowrap text-muted-foreground">
                      {key.lastUsed
                        ? new Date(key.lastUsed).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="w-fit pr-4 pl-4 text-right whitespace-nowrap">
                      <Dialog
                        open={deleteApiKey === key.id}
                        onOpenChange={(open) =>
                          setDeleteApiKey(open ? key.id : null)
                        }
                      >
                        <DialogTrigger
                          render={<Button variant="destructive" size="sm" />}
                        >
                          Delete
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Are you sure?</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete this API key? This
                              action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="primary"
                              onClick={() => {
                                deleteApiKeyMutation.mutate({
                                  projectId,
                                  keyId: key.id,
                                })
                              }}
                            >
                              Confirm Action
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              })()}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>

        {(() => {
          const filteredAuditLogs = auditLogs.filter((log) =>
            log.message.toLowerCase().includes(activitySearch.toLowerCase())
          )
          const activityTotalPages = Math.ceil(
            filteredAuditLogs.length / ACTIVITY_PER_PAGE
          )
          const paginatedAuditLogs = filteredAuditLogs.slice(
            (activityPage - 1) * ACTIVITY_PER_PAGE,
            activityPage * ACTIVITY_PER_PAGE
          )

          return (
            <>
              <SearchBar
                value={activitySearch}
                onChange={(value) => {
                  setActivitySearch(value)
                  setActivityPage(1)
                }}
                className="mb-2"
              />

              <div className="overflow-hidden rounded-lg bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 hover:bg-transparent">
                      <TableHead className="w-fit pl-4 whitespace-nowrap text-muted-foreground">
                        User
                      </TableHead>
                      <TableHead className="w-fit pl-4 whitespace-nowrap text-muted-foreground">
                        Message
                      </TableHead>
                      <TableHead className="w-fit pr-4 pl-4 text-right whitespace-nowrap text-muted-foreground">
                        Timestamp
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAuditLogs.length === 0 ? (
                      <TableRow className="border-0 hover:bg-transparent">
                        <TableCell
                          colSpan={3}
                          className="py-8 text-center text-sm text-muted-foreground"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <p>
                              {activitySearch
                                ? "No activity matches your search"
                                : "No recent activity"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedAuditLogs.map((log, index) => (
                        <TableRow
                          key={index}
                          className="border-border/40 transition-colors hover:bg-accent/50"
                        >
                          <TableCell className="w-fit pl-4 whitespace-nowrap">
                            {log.user ? (
                              <div className="flex items-center gap-2">
                                <Avatar size="sm">
                                  <AvatarImage
                                    src={log.user.image ?? undefined}
                                    alt={log.user.name}
                                  />
                                </Avatar>
                                <span className="text-sm text-foreground">
                                  {log.user.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                System
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="w-fit pl-4 font-medium whitespace-nowrap text-foreground">
                            {log.message}
                          </TableCell>
                          <TableCell className="w-fit pr-4 pl-4 text-right whitespace-nowrap text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {activityTotalPages > 1 && (
                <Pagination className="mt-2">
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
            </>
          )
        })()}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Webhooks</h2>

          <Dialog open={createWebhook} onOpenChange={setCreateWebhook}>
            <DialogTrigger
              render={<Button className="cursor-pointer" size="sm" />}
            >
              Create Webhook
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Webhook</DialogTitle>
                <DialogDescription>
                  Create a webhook to receive events from this project.
                </DialogDescription>
              </DialogHeader>
              <Form<CreateWebhook>
                onSubmit={(data) => {
                  handleCreateWebhook(data)
                }}
              >
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Webhook Name</Label>
                    <Form.Field<CreateWebhook> name="name" required>
                      <Input placeholder="My Webhook" />
                    </Form.Field>
                  </div>
                  <div className="space-y-2">
                    <Label>Subscription</Label>
                    <Form.Field<CreateWebhook> name="subscription" required>
                      <Input placeholder="event.created" />
                    </Form.Field>
                  </div>
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <Form.Field<CreateWebhook> name="url" required>
                      <Input placeholder="https://example.com/webhook" />
                    </Form.Field>
                  </div>
                  <DialogFooter>
                    <Form.Submit>
                      <Button disabled={createWebhookMutation.isPending}>
                        {createWebhookMutation.isPending
                          ? "Creating..."
                          : "Create Webhook"}
                      </Button>
                    </Form.Submit>
                  </DialogFooter>
                </div>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <SearchBar
          value={webhookSearch}
          onChange={(value) => setWebhookSearch(value)}
          className="mb-2"
        />

        <div className="overflow-hidden rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="w-fit pl-4 whitespace-nowrap text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="w-fit pl-4 whitespace-nowrap text-muted-foreground">
                  URL
                </TableHead>
                <TableHead className="w-fit pl-4 whitespace-nowrap text-muted-foreground">
                  Subscription
                </TableHead>
                <TableHead className="w-fit pl-4 whitespace-nowrap text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="w-fit pl-4 whitespace-nowrap text-muted-foreground">
                  Last Triggered
                </TableHead>
                <TableHead className="w-fit pl-4 whitespace-nowrap text-muted-foreground">
                  Created
                </TableHead>
                <TableHead className="w-fit pr-4 pl-4 text-right whitespace-nowrap text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                const filteredWebhooks = webhooks.filter((webhook) =>
                  webhook.name
                    .toLowerCase()
                    .includes(webhookSearch.toLowerCase())
                )

                if (filteredWebhooks.length === 0) {
                  return (
                    <TableRow className="border-0 hover:bg-transparent">
                      <TableCell
                        colSpan={7}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <p>
                            {webhookSearch
                              ? "No webhooks match your search"
                              : "No webhooks configured"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                }

                return filteredWebhooks.map((webhook) => (
                  <TableRow
                    key={webhook.id}
                    className="border-border/40 transition-colors hover:bg-accent/50"
                  >
                    <TableCell className="w-fit pl-4 font-medium whitespace-nowrap text-foreground">
                      {webhook.name}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate pl-4 whitespace-nowrap text-muted-foreground">
                      {webhook.url}
                    </TableCell>
                    <TableCell className="w-fit pl-4 whitespace-nowrap text-muted-foreground">
                      {webhook.subscription}
                    </TableCell>
                    <TableCell className="w-fit pl-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-medium ${webhook.enabled ? "text-green-500" : "text-muted-foreground"}`}
                      >
                        {webhook.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </TableCell>
                    <TableCell className="w-fit pl-4 whitespace-nowrap text-muted-foreground">
                      {webhook.lastTriggered
                        ? new Date(webhook.lastTriggered).toLocaleString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="w-fit pl-4 whitespace-nowrap text-muted-foreground">
                      {new Date(webhook.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="w-fit pr-4 pl-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => openEditWebhook(webhook)}
                        >
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 text-xs"
                              />
                            }
                          >
                            Delete
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Webhook?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the &quot;
                                {webhook.name}&quot; webhook.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                                onClick={() => deleteWebhook(webhook.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              })()}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog
        open={editWebhookOpen}
        onOpenChange={(open) => {
          setEditWebhookOpen(open)
          if (!open) {
            setEditingWebhook(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Webhook</DialogTitle>
            <DialogDescription>Update webhook settings.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              await updateWebhook({
                name: editWebhookName,
                subscription: editWebhookSubscription,
                url: editWebhookUrl,
                enabled: editWebhookEnabled,
              })
            }}
            className="space-y-3"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-webhook-name">Name</Label>
              <Input
                id="edit-webhook-name"
                value={editWebhookName}
                onChange={(e) => setEditWebhookName(e.target.value)}
                placeholder="My Webhook"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-webhook-subscription">Subscription</Label>
              <Input
                id="edit-webhook-subscription"
                value={editWebhookSubscription}
                onChange={(e) => setEditWebhookSubscription(e.target.value)}
                placeholder="event.created"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-webhook-url">URL</Label>
              <Input
                id="edit-webhook-url"
                value={editWebhookUrl}
                onChange={(e) => setEditWebhookUrl(e.target.value)}
                placeholder="https://example.com/webhook"
                type="url"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="edit-webhook-enabled"
                checked={editWebhookEnabled}
                onCheckedChange={setEditWebhookEnabled}
              />
              <Label
                htmlFor="edit-webhook-enabled"
                className="text-sm text-muted-foreground"
              >
                {editWebhookEnabled ? "Enabled" : "Disabled"}
              </Label>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateWebhookMutation.isPending}>
                {updateWebhookMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">API Request Logs</h2>
        </div>

        {(() => {
          const filteredRequestLogs = requestLogs.filter((log) =>
            log.endpoint.toLowerCase().includes(requestLogSearch.toLowerCase())
          )
          const sortedRequestLogs = [...filteredRequestLogs].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          const requestLogTotalPages = Math.ceil(
            sortedRequestLogs.length / REQUEST_LOGS_PER_PAGE
          )
          const paginatedRequestLogs = sortedRequestLogs.slice(
            (requestLogPage - 1) * REQUEST_LOGS_PER_PAGE,
            requestLogPage * REQUEST_LOGS_PER_PAGE
          )

          return (
            <>
              <SearchBar
                value={requestLogSearch}
                onChange={(value) => {
                  setRequestLogSearch(value)
                  setRequestLogPage(1)
                }}
                className="mb-2"
              />

              <div className="overflow-hidden rounded-lg bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 hover:bg-transparent">
                      <TableHead className="w-fit pl-4 whitespace-nowrap text-muted-foreground">
                        Method
                      </TableHead>
                      <TableHead className="w-fit pl-4 whitespace-nowrap text-muted-foreground">
                        Endpoint
                      </TableHead>
                      <TableHead className="w-fit pl-4 whitespace-nowrap text-muted-foreground">
                        Status
                      </TableHead>
                      <TableHead className="w-fit pl-4 whitespace-nowrap text-muted-foreground">
                        Time
                      </TableHead>
                      <TableHead className="w-fit pr-4 pl-4 text-right whitespace-nowrap text-muted-foreground">
                        Details
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRequestLogs.length === 0 ? (
                      <TableRow className="border-0 hover:bg-transparent">
                        <TableCell
                          colSpan={5}
                          className="py-8 text-center text-sm text-muted-foreground"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <p>
                              {requestLogSearch
                                ? "No requests match your search"
                                : "No requests yet"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRequestLogs.map((log) => (
                        <TableRow
                          key={log.id}
                          className="border-border/40 transition-colors hover:bg-accent/50"
                        >
                          <TableCell className="w-fit pl-4 whitespace-nowrap">
                            <Badge
                              variant={
                                log.method === "GET"
                                  ? "default"
                                  : log.method === "POST"
                                    ? "secondary"
                                    : log.method === "DELETE"
                                      ? "destructive"
                                      : "outline"
                              }
                            >
                              {log.method}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate pl-4 font-medium whitespace-nowrap text-foreground">
                            {log.endpoint}
                          </TableCell>
                          <TableCell className="w-fit pl-4 whitespace-nowrap">
                            <span
                              className={`text-sm font-medium ${log.status >= 200 && log.status < 300 ? "text-green-500" : log.status >= 400 ? "text-red-500" : "text-yellow-500"}`}
                            >
                              {log.status}
                            </span>
                          </TableCell>
                          <TableCell className="w-fit pl-4 whitespace-nowrap text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="w-fit pr-4 pl-4 text-right whitespace-nowrap">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setSelectedRequestLog(log)
                                setRequestLogDetailOpen(true)
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {requestLogTotalPages > 1 && (
                <Pagination className="mt-2">
                  <PaginationContent className="justify-center">
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setRequestLogPage((page) => Math.max(1, page - 1))
                        }
                        className={
                          requestLogPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {getPaginationItems(
                      requestLogTotalPages,
                      requestLogPage
                    ).map((page) =>
                      page === "ellipsis-start" || page === "ellipsis-end" ? (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={page === requestLogPage}
                            onClick={() => setRequestLogPage(page)}
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
                          setRequestLogPage((page) =>
                            Math.min(requestLogTotalPages, page + 1)
                          )
                        }
                        className={
                          requestLogPage === requestLogTotalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )
        })()}
      </div>

      <Dialog
        open={requestLogDetailOpen}
        onOpenChange={setRequestLogDetailOpen}
      >
        <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription className="break-all">
              {selectedRequestLog?.method} {selectedRequestLog?.endpoint}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span
                className={`font-medium ${selectedRequestLog && selectedRequestLog.status >= 200 && selectedRequestLog.status < 300 ? "text-green-500" : selectedRequestLog && selectedRequestLog.status >= 400 ? "text-red-500" : "text-yellow-500"}`}
              >
                {selectedRequestLog?.status}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">User Agent:</span>
              <span className="font-medium text-foreground">
                {selectedRequestLog?.userAgent}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Time:</span>
              <span className="font-medium text-foreground">
                {selectedRequestLog
                  ? new Date(selectedRequestLog.createdAt).toLocaleString()
                  : ""}
              </span>
            </div>
            {selectedRequestLog?.requestBody && (
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">
                  Request Body
                </Label>
                <pre className="max-h-[200px] w-full overflow-auto rounded-md bg-black/30 p-3 font-mono text-xs break-all whitespace-pre-wrap">
                  {formatJson(selectedRequestLog.requestBody)}
                </pre>
              </div>
            )}
            {selectedRequestLog?.responseBody && (
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">
                  Response Body
                </Label>
                <pre className="max-h-[200px] w-full overflow-auto rounded-md bg-black/30 p-3 font-mono text-xs break-all whitespace-pre-wrap">
                  {formatJson(selectedRequestLog.responseBody)}
                </pre>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              className="w-fit"
              onClick={() => setRequestLogDetailOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">General Settings</h2>
        </div>

        <Card>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Project Name</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Change the name of your project as it appears across the
                  dashboard.
                </p>
              </div>

              <Dialog open={renameProject} onOpenChange={setRenameProject}>
                <DialogTrigger
                  render={<Button variant="secondary" size="sm" />}
                >
                  Rename
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rename Project</DialogTitle>
                    <DialogDescription>
                      Change the name of your project as it appears across the
                      dashboard.
                    </DialogDescription>
                  </DialogHeader>
                  <Form<RenameProject>
                    onSubmit={(data) => {
                      renameProjectMutation.mutate({ id: projectId, ...data })
                    }}
                  >
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="key-name">Name</Label>
                        <Form.Field<RenameProject> name="name" required>
                          <Input placeholder={project?.name} />
                        </Form.Field>
                      </div>
                      <DialogFooter>
                        <Form.Submit>
                          <Button disabled={renameProjectMutation.isPending}>
                            {renameProjectMutation.isPending
                              ? "Renaming..."
                              : "Rename Project"}
                          </Button>
                        </Form.Submit>
                      </DialogFooter>
                    </div>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Delete Project</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Deleting this project removes API keys and events permanently.
                </p>
              </div>

              <Dialog open={deleteProject} onOpenChange={setDeleteProject}>
                <DialogTrigger
                  render={<Button variant="destructive" size="sm" />}
                >
                  Delete
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you sure?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete
                      the project and all associated data.
                    </DialogDescription>
                  </DialogHeader>
                  <Form<DeleteProject>
                    onSubmit={() => {
                      deleteProjectMutation.mutate({ id: projectId })
                    }}
                  >
                    <div className="space-y-3">
                      <DialogFooter>
                        <Form.Submit>
                          <Button disabled={deleteProjectMutation.isPending}>
                            {deleteProjectMutation.isPending
                              ? "Deleting..."
                              : "Confirm Action"}
                          </Button>
                        </Form.Submit>
                      </DialogFooter>
                    </div>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
