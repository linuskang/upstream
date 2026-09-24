"use client"

import { useParams } from "next/navigation"

import { trpc } from "@/lib/trpc"
import { Avatar, AvatarImage } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import { authClient } from "@workspace/auth/client"
import { InviteMemberPopup } from "./invite"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Copy, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"

function formatRole(role: string) {
  return role.charAt(0) + role.slice(1).toLowerCase()
}

export default function MembersPage() {
  const params = useParams()
  const projectId = String(params.id)
  const { data: session } = authClient.useSession()
  const members = trpc.projectMember.list.useQuery({ projectId })
  const utils = trpc.useUtils()
  const revokeInvitation = trpc.projectMember.cancelInvite.useMutation({
    onSuccess: async () => {
      await utils.projectMember.list.invalidate({ projectId })
      toast.success("Invitation revoked")
    },
    onError: (error) => toast.error(error.message),
  })

  if (!session) {
    return null
  }

  if (members.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (members.isError || !members.data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-destructive">
          Unable to load project members. Please try again.
        </div>
      </div>
    )
  }

  const { members: memberList, invitations } = members.data

  return (
    <div className="flex flex-col gap-3 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Members</h1>
        <InviteMemberPopup />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Role</TableHead>
              <TableHead className="pr-4 text-right text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {memberList.length === 0 && invitations.length === 0 ? (
              <TableRow className="border-border">
                <TableCell
                  colSpan={3}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  no users
                </TableCell>
              </TableRow>
            ) : (
              <>
                {invitations.map((invitation) => (
                  <TableRow
                    key={`invitation-${invitation.id}`}
                    className="border-border text-muted-foreground"
                  >
                    <TableCell className="pl-4">
                      <span className="text-sm">{invitation.email}</span>
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex flex-col">
                        <span>Pending ({formatRole(invitation.role)})</span>
                        <span className="text-xs">
                          Expires{" "}
                          {new Date(invitation.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label={`Actions for ${invitation.email}`}
                            />
                          }
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() =>
                              revokeInvitation.mutate({
                                projectId,
                                invitationId: invitation.id,
                              })
                            }
                          >
                            Revoke invitation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {memberList.map((member) => (
                  <TableRow
                    key={member.user.id}
                    className="border-border transition-colors"
                  >
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarImage
                            className="rounded-sm"
                            src={member.user.image}
                            alt={member.user.name}
                          />
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {member.user.name}{" "}
                            {member.user.id === session.user.id && "(You)"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="pr-4">
                      {formatRole(member.role)}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label={`Actions for ${member.user.name}`}
                            />
                          }
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {member.role === "OWNER" ||
                          member.user.id === session.user.id ? (
                            <DropdownMenuItem
                              onClick={() => {
                                void navigator.clipboard.writeText(
                                  member.user.id
                                )
                                toast.success("User ID copied")
                              }}
                            >
                              <Copy className="size-4" />
                              Copy user ID
                            </DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem>Change role</DropdownMenuItem>
                              <DropdownMenuItem variant="destructive">
                                Remove member
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
