"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Badge } from "@workspace/ui/components/badge"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Avatar, AvatarImage } from "@workspace/ui/components/avatar"
import { Loader2, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

type Role = "OWNER" | "ADMIN" | "MEMBER"

interface ProjectMembersProps {
  projectId: string
  currentUserId: string
  currentUserRole: Role
  memberLimit: number
}

export function ProjectMembers({
  projectId,
  currentUserId,
  currentUserRole,
  memberLimit,
}: ProjectMembersProps) {
  const utils = trpc.useUtils()
  const router = useRouter()
  const membersQuery = trpc.projectMember.list.useQuery({ projectId })

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER")
  const [inviteOpen, setInviteOpen] = useState(false)

  const inviteMutation = trpc.projectMember.invite.useMutation({
    onSuccess: async () => {
      await utils.projectMember.list.invalidate({ projectId })
      await utils.projectSettings.auditLogs.invalidate({ projectId })
      setInviteEmail("")
      setInviteRole("MEMBER")
      setInviteOpen(false)
      toast.success("Invitation sent")
    },
    onError: (error) => toast.error(error.message),
  })

  const updateRoleMutation = trpc.projectMember.updateRole.useMutation({
    onSuccess: async () => {
      await utils.projectMember.list.invalidate({ projectId })
      await utils.projectSettings.auditLogs.invalidate({ projectId })
      await utils.project.get.invalidate({ id: projectId })
      toast.success("Role updated")
    },
    onError: (error) => toast.error(error.message),
  })

  const removeMutation = trpc.projectMember.remove.useMutation({
    onSuccess: async () => {
      await utils.projectMember.list.invalidate({ projectId })
      await utils.projectSettings.auditLogs.invalidate({ projectId })
      await utils.project.get.invalidate({ id: projectId })
      toast.success("Member removed")
    },
    onError: (error) => toast.error(error.message),
  })

  const cancelInviteMutation = trpc.projectMember.cancelInvite.useMutation({
    onSuccess: async () => {
      await utils.projectMember.list.invalidate({ projectId })
      await utils.projectSettings.auditLogs.invalidate({ projectId })
      toast.success("Invitation cancelled")
    },
    onError: (error) => toast.error(error.message),
  })

  const leaveMutation = trpc.projectMember.leave.useMutation({
    onSuccess: async () => {
      await utils.projectMember.list.invalidate({ projectId })
      await utils.project.list.invalidate()
      await utils.usage.stats.invalidate()
      await utils.account.activity.invalidate()
      toast.success("You left the project")
      router.push("/")
    },
    onError: (error) => toast.error(error.message),
  })

  const isOwner = currentUserRole === "OWNER"

  if (membersQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (membersQuery.isError) {
    return (
      <div className="py-8 text-center text-sm text-destructive">
        Unable to load members.
      </div>
    )
  }

  const members = membersQuery.data?.members ?? []
  const invitations = membersQuery.data?.invitations ?? []
  const currentSeats = members.length + invitations.length
  const remainingSeats = Math.max(0, memberLimit - currentSeats)

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail) return
    inviteMutation.mutate({
      projectId,
      email: inviteEmail,
      role: inviteRole,
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Members</h2>
          <p className="text-xs text-muted-foreground">
            {currentSeats} of {memberLimit} seats used
          </p>
        </div>

        {isOwner && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger
              render={<Button size="sm" disabled={remainingSeats === 0} />}
            >
              Invite Member
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join this project.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">Role</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={(value) =>
                      setInviteRole(value as "ADMIN" | "MEMBER")
                    }
                  >
                    <SelectTrigger id="invite-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending
                      ? "Sending..."
                      : "Send Invitation"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="overflow-hidden rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="pl-4 text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Role</TableHead>
              <TableHead className="pr-4 text-right text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow className="border-0 hover:bg-transparent">
                <TableCell
                  colSpan={3}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No members yet.
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow
                  key={member.user.id}
                  className="border-border/40 transition-colors hover:bg-accent/50"
                >
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarImage
                          src={member.user.image ?? undefined}
                          alt={member.user.name}
                        />
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {member.user.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {member.user.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        member.role === "OWNER" ? "default" : "secondary"
                      }
                    >
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    {member.user.id === currentUserId &&
                      member.role !== "OWNER" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8"
                          onClick={() => leaveMutation.mutate({ projectId })}
                          disabled={leaveMutation.isPending}
                        >
                          <LogOut className="mr-1 size-3" />
                          Leave
                        </Button>
                      )}
                    {isOwner &&
                      member.user.id !== currentUserId &&
                      member.role !== "OWNER" && (
                        <div className="flex items-center justify-end gap-2">
                          <Select
                            value={member.role}
                            onValueChange={(value) =>
                              updateRoleMutation.mutate({
                                projectId,
                                userId: member.user.id,
                                role: value as "ADMIN" | "MEMBER",
                              })
                            }
                          >
                            <SelectTrigger className="h-8 w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="MEMBER">Member</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8"
                            onClick={() =>
                              removeMutation.mutate({
                                projectId,
                                userId: member.user.id,
                              })
                            }
                            disabled={removeMutation.isPending}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {invitations.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            Pending Invitations
          </h3>
          <div className="overflow-hidden rounded-lg bg-card">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="pl-4 text-muted-foreground">
                    Email
                  </TableHead>
                  <TableHead className="text-muted-foreground">Role</TableHead>
                  <TableHead className="text-muted-foreground">
                    Expires
                  </TableHead>
                  <TableHead className="pr-4 text-right text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow
                    key={invitation.id}
                    className="border-border/40 transition-colors hover:bg-accent/50"
                  >
                    <TableCell className="pl-4 text-sm text-foreground">
                      {invitation.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{invitation.role}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      {isOwner && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8"
                          onClick={() =>
                            cancelInviteMutation.mutate({
                              projectId,
                              invitationId: invitation.id,
                            })
                          }
                          disabled={cancelInviteMutation.isPending}
                        >
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
