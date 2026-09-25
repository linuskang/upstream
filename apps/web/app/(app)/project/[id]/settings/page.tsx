"use client"

import { notFound, useParams, useRouter } from "next/navigation"
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

type RenameProjectForm = {
  name: string
}

export default function GeneralSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = String(params.id)
  const utils = trpc.useUtils()
  const { data: session } = authClient.useSession()
  const projectQuery = trpc.project.get.useQuery({ id: projectId })

  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const renameProject = trpc.project.rename.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.project.get.invalidate({ id: projectId }),
        utils.project.list.invalidate(),
        utils.projectSettings.auditLogs.invalidate({ projectId }),
      ])
      setRenameOpen(false)
      toast.success("Project renamed")
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteProject = trpc.project.delete.useMutation({
    onSuccess: async () => {
      await utils.project.list.invalidate()
      toast.success("Project deleted")
      router.replace("/")
    },
    onError: (error) => toast.error(error.message),
  })

  if (projectQuery.isLoading || !session) {
    return (
      <div className="flex items-center justify-center py-10">
        <span className="text-sm text-muted-foreground">
          Loading settings...
        </span>
      </div>
    )
  }

  if (projectQuery.isError || !projectQuery.data) {
    if (projectQuery.error?.data?.code === "NOT_FOUND") return notFound()
    return (
      <div className="flex items-center justify-center py-10">
        <span className="text-sm text-destructive">
          Unable to load project settings.
        </span>
      </div>
    )
  }

  const project = projectQuery.data
  const currentUserRole =
    project.members.find((member) => member.user.id === session.user.id)
      ?.role ?? "MEMBER"

  if (currentUserRole !== "OWNER") {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">
          Only the project owner can change these settings.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold">Project name</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Change the name of your project as it appears across the dashboard.
          </p>
        </div>
        <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
          <DialogTrigger render={<Button variant="outline" size="sm" />}>
            Rename
          </DialogTrigger>
          <DialogContent className="w-full max-w-md gap-0">
            <h1 className="text-lg font-semibold">Rename project</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Change the name of your project as it appears across the
              dashboard.
            </p>
            <div className="mt-6">
              <Form<RenameProjectForm>
                formOptions={{
                  defaultValues: { name: project.name },
                }}
                className="space-y-4"
                onSubmit={(values: RenameProjectForm) => {
                  renameProject.mutate({ id: projectId, name: values.name })
                }}
              >
                <Form.Label className="text-sm font-medium" name="name">
                  Name
                </Form.Label>
                <Form.Field name="name" required>
                  <Input
                    placeholder={project.name}
                    className="mt-1"
                    disabled={renameProject.isPending}
                  />
                </Form.Field>
                <Form.Error className="text-sm text-destructive" name="name" />
                <Form.Submit>
                  <Button variant="primary" disabled={renameProject.isPending}>
                    {renameProject.isPending ? "Renaming..." : "Rename project"}
                  </Button>
                </Form.Submit>
              </Form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold text-destructive">
            Delete project
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Deleting this project removes API keys and events permanently.
          </p>
        </div>
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger render={<Button variant="destructive" size="sm" />}>
            Delete
          </DialogTrigger>
          <DialogContent className="w-full max-w-md gap-0">
            <h1 className="text-lg font-semibold">Delete project</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This action cannot be undone. This will permanently delete the
              project and all associated data.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteProject.isPending}
                onClick={() => deleteProject.mutate({ id: projectId })}
              >
                {deleteProject.isPending ? "Deleting..." : "Delete project"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
