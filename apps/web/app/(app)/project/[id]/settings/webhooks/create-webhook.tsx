"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { authClient } from "@workspace/auth/client"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Form } from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"
import { trpc } from "@/lib/trpc"

type CreateWebhookForm = {
  name: string
  subscription: string
  url: string
}

export function CreateWebhookButton() {
  const params = useParams()
  const projectId = String(params.id)
  const utils = trpc.useUtils()
  const { data: session } = authClient.useSession()
  const projectQuery = trpc.project.get.useQuery({ id: projectId })

  const [open, setOpen] = useState(false)

  const createWebhook = trpc.webhook.create.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.webhook.list.invalidate({ projectId }),
        utils.projectSettings.auditLogs.invalidate({ projectId }),
      ])
      setOpen(false)
      toast.success("Webhook created")
    },
    onError: (error) => toast.error(error.message),
  })

  const role = projectQuery.data?.members.find(
    (member) => member.user.id === session?.user.id
  )?.role
  const canEdit = role === "OWNER" || role === "ADMIN"

  if (!canEdit) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        Create webhook
      </DialogTrigger>
      <DialogContent className="w-full max-w-md gap-0">
        <h1 className="text-lg font-semibold">Create webhook</h1>
        <div className="mt-6">
          <Form<CreateWebhookForm>
            className="space-y-4"
            onSubmit={(values: CreateWebhookForm) => {
              createWebhook.mutate({ projectId, ...values })
            }}
          >
            <Form.Label className="text-sm font-medium" name="name">
              Name
            </Form.Label>
            <Form.Field name="name" required>
              <Input
                placeholder="My webhook"
                className="mt-1"
                disabled={createWebhook.isPending}
              />
            </Form.Field>
            <Form.Error className="text-sm text-destructive" name="name" />

            <Form.Label className="text-sm font-medium" name="subscription">
              Subscription
            </Form.Label>
            <Form.Field name="subscription" required>
              <Input
                placeholder="event.created"
                className="mt-1"
                disabled={createWebhook.isPending}
              />
            </Form.Field>
            <Form.Error
              className="text-sm text-destructive"
              name="subscription"
            />

            <Form.Label className="text-sm font-medium" name="url">
              URL
            </Form.Label>
            <Form.Field name="url" required>
              <Input
                placeholder="https://example.com/webhook"
                type="url"
                className="mt-1"
                disabled={createWebhook.isPending}
              />
            </Form.Field>
            <Form.Error className="text-sm text-destructive" name="url" />

            <Form.Submit>
              <Button variant="primary" disabled={createWebhook.isPending}>
                {createWebhook.isPending ? "Creating..." : "Create webhook"}
              </Button>
            </Form.Submit>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
