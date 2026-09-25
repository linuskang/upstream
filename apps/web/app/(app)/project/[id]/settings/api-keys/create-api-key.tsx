"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import { Check, Copy } from "lucide-react"
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

type CreateApiKeyForm = {
  name: string
}

export function CreateApiKeyButton() {
  const params = useParams()
  const projectId = String(params.id)
  const utils = trpc.useUtils()
  const { data: session } = authClient.useSession()
  const projectQuery = trpc.project.get.useQuery({ id: projectId })

  const [open, setOpen] = useState(false)
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null)
  const [copiedApiKey, setCopiedApiKey] = useState(false)

  const createApiKey = trpc.apiKey.create.useMutation({
    onSuccess: async (result) => {
      await Promise.all([
        utils.apiKey.list.invalidate({ projectId }),
        utils.project.get.invalidate({ id: projectId }),
        utils.projectSettings.auditLogs.invalidate({ projectId }),
      ])
      setCreatedApiKey(result.secret)
      toast.success("API key created")
    },
    onError: (error) => toast.error(error.message),
  })

  function copyCreatedApiKey() {
    if (!createdApiKey) return
    void navigator.clipboard.writeText(createdApiKey)
    setCopiedApiKey(true)
    setTimeout(() => setCopiedApiKey(false), 2000)
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setCreatedApiKey(null)
      setCopiedApiKey(false)
    }
  }

  const role = projectQuery.data?.members.find(
    (member) => member.user.id === session?.user.id
  )?.role
  const canEdit = role === "OWNER" || role === "ADMIN"

  if (!canEdit) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>
        Create API key
      </DialogTrigger>
      <DialogContent className="w-full max-w-md gap-0">
        {createdApiKey ? (
          <>
            <h1 className="text-lg font-semibold">Your API key</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This is the only time we can show the secret for this API key.
            </p>
            <div className="mt-6 flex items-center gap-2 rounded-md bg-muted p-3 font-mono text-xs break-all">
              <span className="flex-1">{createdApiKey}</span>
              <Button
                variant="ghost"
                size="icon-xs"
                className="shrink-0"
                onClick={copyCreatedApiKey}
              >
                {copiedApiKey ? (
                  <Check className="size-3" />
                ) : (
                  <Copy className="size-3" />
                )}
              </Button>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => handleOpenChange(false)}>Got it</Button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold">Create API key</h1>
            <div className="mt-6">
              <Form<CreateApiKeyForm>
                className="space-y-4"
                onSubmit={(values: CreateApiKeyForm) => {
                  createApiKey.mutate({ projectId, name: values.name })
                }}
              >
                <Form.Label className="text-sm font-medium" name="name">
                  Name
                </Form.Label>
                <Form.Field name="name" required>
                  <Input
                    placeholder="Production key"
                    className="mt-1"
                    disabled={createApiKey.isPending}
                  />
                </Form.Field>
                <Form.Error className="text-sm text-destructive" name="name" />
                <Form.Submit>
                  <Button variant="primary" disabled={createApiKey.isPending}>
                    {createApiKey.isPending ? "Creating..." : "Create API key"}
                  </Button>
                </Form.Submit>
              </Form>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
