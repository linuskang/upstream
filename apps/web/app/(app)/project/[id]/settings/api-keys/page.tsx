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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { trpc } from "@/lib/trpc"

type ApiKeyItem = {
  id: string
  name: string
}

export default function ApiKeysSettingsPage() {
  const params = useParams()
  const projectId = String(params.id)
  const utils = trpc.useUtils()
  const { data: session } = authClient.useSession()
  const projectQuery = trpc.project.get.useQuery({ id: projectId })
  const apiKeysQuery = trpc.apiKey.list.useQuery({ projectId })

  const [deleteTarget, setDeleteTarget] = useState<ApiKeyItem | null>(null)

  const deleteApiKey = trpc.apiKey.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.apiKey.list.invalidate({ projectId }),
        utils.project.get.invalidate({ id: projectId }),
        utils.projectSettings.auditLogs.invalidate({ projectId }),
      ])
      setDeleteTarget(null)
      toast.success("API key deleted")
    },
    onError: (error) => toast.error(error.message),
  })

  if (projectQuery.isLoading || apiKeysQuery.isLoading || !session) {
    return (
      <div className="flex items-center justify-center py-10">
        <span className="text-sm text-muted-foreground">
          Loading API keys...
        </span>
      </div>
    )
  }

  if (projectQuery.isError || apiKeysQuery.isError || !projectQuery.data) {
    return (
      <div className="flex items-center justify-center py-10">
        <span className="text-sm text-destructive">
          Unable to load API keys.
        </span>
      </div>
    )
  }

  const currentUserRole =
    projectQuery.data.members.find(
      (member) => member.user.id === session.user.id
    )?.role ?? "MEMBER"
  const canEdit = currentUserRole === "OWNER" || currentUserRole === "ADMIN"
  const apiKeys = apiKeysQuery.data ?? []

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="pl-6">Name</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last used</TableHead>
            {canEdit && (
              <TableHead className="pr-6 text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {apiKeys.length === 0 ? (
            <TableRow className="border-border">
              <TableCell
                colSpan={canEdit ? 4 : 3}
                className="py-12 text-center text-sm text-muted-foreground"
              >
                No API keys configured.
              </TableCell>
            </TableRow>
          ) : (
            apiKeys.map((key) => (
              <TableRow key={key.id} className="border-border">
                <TableCell className="pl-6 font-medium">{key.name}</TableCell>
                <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                  {new Date(key.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                  {key.lastUsed
                    ? new Date(key.lastUsed).toLocaleDateString()
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
                            aria-label={`Actions for ${key.name}`}
                          />
                        }
                      >
                        <MoreHorizontal className="size-5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-48">
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(key)}
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

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the &quot;{deleteTarget?.name}&quot;
              key. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteTarget &&
                deleteApiKey.mutate({ projectId, keyId: deleteTarget.id })
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
