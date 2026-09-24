"use client"

import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Copy, MoreHorizontal, Ban, Lock } from "lucide-react"

import { authClient } from "@workspace/auth/client"
import { Avatar, AvatarImage } from "@workspace/ui/components/avatar"
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
import { InviteMemberPopup } from "./invite"

export default function Page() {
  const params = useParams()
  const projectId = String(params.id)
  const { data: session } = authClient.useSession()
  const membersQuery = trpc.projectMember.list.useQuery({ projectId })
  const utils = trpc.useUtils()

  const refresh = async () => {
    await Promise.all([
      utils.projectMember.list.invalidate({ projectId }),
      utils.project.list.invalidate(),
      utils.projectSettings.auditLogs.invalidate({ projectId }),
    ])
  }

  const updateRole = trpc.projectMember.updateRole.useMutation({
    onSuccess: async () => {
      await refresh()
      toast.success("Role updated")
    },
    onError: (error) => toast.error(error.message),
  })

  const remove = trpc.projectMember.remove.useMutation({
    onSuccess: async () => {
      await refresh()
      toast.success("Member removed")
    },
    onError: (error) => toast.error(error.message),
  })

  const cancelInvite = trpc.projectMember.cancelInvite.useMutation({
    onSuccess: async () => {
      await refresh()
      toast.success("Invitation revoked")
    },
    onError: (error) => toast.error(error.message),
  })

  if (!session || membersQuery.isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <span className="text-sm text-muted-foreground">
          Loading members...
        </span>
      </div>
    )
  }

  if (membersQuery.isError || !membersQuery.data) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <span className="text-sm text-destructive">
          Unable to load project members.
        </span>
      </div>
    )
  }

  const { members, invitations } = membersQuery.data
  const currentMember = members.find(
    (member) => member.user.id === session.user.id
  )
  if (!currentMember) {
    return <p>You do not have access to this resource</p>
  }
  const currentRole = currentMember.role
  const canManage = currentRole === "OWNER" || currentRole === "ADMIN"

  function copyUserId(userId: string) {
    void navigator.clipboard.writeText(userId)
    toast.success("User ID copied")
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Project members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage who can access this project
          </p>
        </div>
        {canManage && <InviteMemberPopup />}
      </header>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => (
              <TableRow
                key={`invitation-${invitation.id}`}
                className="border-border"
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{invitation.email}</span>
                    <span className="text-xs text-muted-foreground">
                      Pending (Expires{" "}
                      {new Date(invitation.expiresAt).toLocaleDateString()})
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {invitation.role.toLowerCase()}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-foreground"
                          aria-label={`Actions for ${invitation.email}`}
                        />
                      }
                    >
                      <MoreHorizontal className="size-5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-48">
                      {canManage && (
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() =>
                            cancelInvite.mutate({
                              projectId,
                              invitationId: invitation.id,
                            })
                          }
                        >
                          <Ban /> Revoke
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {members.map((member) => {
              const isCurrentUser = member.user.id === session.user.id
              const isOwner = member.role === "OWNER"
              const canManageMember = canManage && !isOwner && !isCurrentUser

              return (
                <TableRow key={member.user.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarImage
                          src={member.user.image ?? undefined}
                          alt={member.user.name}
                        />
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {member.user.name}
                          {isCurrentUser && " (You)"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{member.role.toLowerCase()}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-foreground"
                            aria-label={`Actions for ${member.user.name}`}
                          />
                        }
                      >
                        <MoreHorizontal className="size-5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-48">
                        <DropdownMenuItem
                          onClick={() => copyUserId(member.user.id)}
                        >
                          <Copy className="size-4" />
                          Copy user ID
                        </DropdownMenuItem>
                        {canManageMember && (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                updateRole.mutate({
                                  projectId,
                                  userId: member.user.id,
                                  role:
                                    member.role === "ADMIN"
                                      ? "MEMBER"
                                      : "ADMIN",
                                })
                              }
                            >
                              <Lock /> Make{" "}
                              {member.role === "ADMIN" ? "member" : "admin"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() =>
                                remove.mutate({
                                  projectId,
                                  userId: member.user.id,
                                })
                              }
                            >
                              <Ban /> Remove
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </section>
    </div>
  )
}
