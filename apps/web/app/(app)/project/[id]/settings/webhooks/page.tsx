"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import { MoreHorizontal } from "lucide-react"
import { toast } from "sonner"

import { authClient } from "@workspace/auth/client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
} from "@workspace/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { trpc } from "@/lib/trpc"

type WebhookItem = {
  id: string
  name: string
  subscription: string
  url: string
  enabled: boolean
}

export default function WebhooksSettingsPage() {
  const params = useParams()
  const projectId = String(params.id)
  const utils = trpc.useUtils()
  const { data: session } = authClient.useSession()
  const projectQuery = trpc.project.get.useQuery({ id: projectId })
  const webhooksQuery = trpc.webhook.list.useQuery({ projectId })

  const [deleteTarget, setDeleteTarget] = useState<WebhookItem | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<WebhookItem | null>(null)
  const [editName, setEditName] = useState("")
  const [editSubscription, setEditSubscription] = useState("")
  const [editUrl, setEditUrl] = useState("")
  const [editEnabled, setEditEnabled] = useState(true)

  const updateWebhook = trpc.webhook.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.webhook.list.invalidate({ projectId }),
        utils.projectSettings.auditLogs.invalidate({ projectId }),
      ])
      setEditOpen(false)
      setEditingWebhook(null)
      toast.success("Webhook updated")
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteWebhook = trpc.webhook.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.webhook.list.invalidate({ projectId }),
        utils.projectSettings.auditLogs.invalidate({ projectId }),
      ])
      setDeleteTarget(null)
      toast.success("Webhook deleted")
    },
    onError: (error) => toast.error(error.message),
  })

  function openEditWebhook(webhook: WebhookItem) {
    setEditingWebhook(webhook)
    setEditName(webhook.name)
    setEditSubscription(webhook.subscription)
    setEditUrl(webhook.url)
    setEditEnabled(webhook.enabled)
    setEditOpen(true)
  }

  if (projectQuery.isLoading || webhooksQuery.isLoading || !session) {
    return (
      <div className="flex items-center justify-center py-10">
        <span className="text-sm text-muted-foreground">
          Loading webhooks...
        </span>
      </div>
    )
  }

  if (projectQuery.isError || webhooksQuery.isError || !projectQuery.data) {
    return (
      <div className="flex items-center justify-center py-10">
        <span className="text-sm text-destructive">
          Unable to load webhooks.
        </span>
      </div>
    )
  }

  const currentUserRole =
    projectQuery.data.members.find(
      (member) => member.user.id === session.user.id
    )?.role ?? "MEMBER"
  const canEdit = currentUserRole === "OWNER" || currentUserRole === "ADMIN"
  const webhooks = webhooksQuery.data ?? []

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="pl-6">Name</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Subscription</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last triggered</TableHead>
            {canEdit && (
              <TableHead className="pr-6 text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {webhooks.length === 0 ? (
            <TableRow className="border-border">
              <TableCell
                colSpan={canEdit ? 6 : 5}
                className="py-12 text-center text-sm text-muted-foreground"
              >
                No webhooks configured.
              </TableCell>
            </TableRow>
          ) : (
            webhooks.map((webhook) => (
              <TableRow key={webhook.id} className="border-border">
                <TableCell className="pl-6 font-medium">
                  {webhook.name}
                </TableCell>
                <TableCell className="max-w-56 truncate text-sm text-muted-foreground">
                  {webhook.url}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                  {webhook.subscription}
                </TableCell>
                <TableCell>
                  <span
                    className={`text-sm font-medium ${
                      webhook.enabled
                        ? "text-emerald-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {webhook.enabled ? "Enabled" : "Disabled"}
                  </span>
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                  {webhook.lastTriggered
                    ? new Date(webhook.lastTriggered).toLocaleString()
                    : "Never"}
                </TableCell>
                {canEdit && (
                  <TableCell className="pr-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-foreground"
                            aria-label={`Actions for ${webhook.name}`}
                          />
                        }
                      >
                        <MoreHorizontal className="size-5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-48">
                        <DropdownMenuItem
                          onClick={() => openEditWebhook(webhook)}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(webhook)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) setEditingWebhook(null)
        }}
      >
        <DialogContent className="w-full max-w-md gap-0">
          <h1 className="text-lg font-semibold">Edit webhook</h1>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!editingWebhook) return
              updateWebhook.mutate({
                projectId,
                webhookId: editingWebhook.id,
                name: editName,
                subscription: editSubscription,
                url: editUrl,
                enabled: editEnabled,
              })
            }}
          >
            <div>
              <Label
                htmlFor="edit-webhook-name"
                className="text-sm font-medium"
              >
                Name
              </Label>
              <Input
                id="edit-webhook-name"
                className="mt-1"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="My webhook"
                required
                disabled={updateWebhook.isPending}
              />
            </div>
            <div>
              <Label
                htmlFor="edit-webhook-subscription"
                className="text-sm font-medium"
              >
                Subscription
              </Label>
              <Input
                id="edit-webhook-subscription"
                className="mt-1"
                value={editSubscription}
                onChange={(e) => setEditSubscription(e.target.value)}
                placeholder="event.created"
                required
                disabled={updateWebhook.isPending}
              />
            </div>
            <div>
              <Label htmlFor="edit-webhook-url" className="text-sm font-medium">
                URL
              </Label>
              <Input
                id="edit-webhook-url"
                className="mt-1"
                type="url"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="https://example.com/webhook"
                required
                disabled={updateWebhook.isPending}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="edit-webhook-enabled"
                checked={editEnabled}
                onCheckedChange={setEditEnabled}
              />
              <Label
                htmlFor="edit-webhook-enabled"
                className="text-sm text-muted-foreground"
              >
                {editEnabled ? "Enabled" : "Disabled"}
              </Label>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                disabled={updateWebhook.isPending}
              >
                {updateWebhook.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the &quot;{deleteTarget?.name}&quot;
              webhook. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteTarget &&
                deleteWebhook.mutate({
                  projectId,
                  webhookId: deleteTarget.id,
                })
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
