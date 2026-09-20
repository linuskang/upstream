"use client"

import { Suspense, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center py-6">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  )
}

function InviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [decision, setDecision] = useState<"accept" | "decline" | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const inviteQuery = trpc.projectMember.getInvite.useQuery(
    { token: token ?? "" },
    { enabled: Boolean(token) }
  )

  const acceptMutation = trpc.projectMember.acceptInvite.useMutation({
    onSuccess: () => {
      setDecision("accept")
    },
    onError: (error) => {
      setDecision(null)
      setActionError(error.message)
    },
  })

  const declineMutation = trpc.projectMember.declineInvite.useMutation({
    onSuccess: () => {
      setDecision("decline")
    },
    onError: (error) => {
      setDecision(null)
      setActionError(error.message)
    },
  })

  if (!token) {
    return (
      <div className="flex min-h-svh items-center justify-center py-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Invitation failed</CardTitle>
            <CardDescription>No invitation token provided</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <XCircle className="size-12 text-destructive" />
            <Button className="w-full" onClick={() => router.push("/")}>
              Go to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (inviteQuery.isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center py-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Project Invitation</CardTitle>
            <CardDescription>Loading invitation...</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (inviteQuery.isError || actionError) {
    return (
      <div className="flex min-h-svh items-center justify-center py-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Invitation failed</CardTitle>
            <CardDescription>
              {actionError ?? inviteQuery.error?.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <XCircle className="size-12 text-destructive" />
            <Button className="w-full" onClick={() => router.push("/")}>
              Go to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const invite = inviteQuery.data

  if (decision === "accept" || acceptMutation.isSuccess) {
    return (
      <div className="flex min-h-svh items-center justify-center py-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>You&apos;re in!</CardTitle>
            <CardDescription>
              You have joined {invite?.projectName}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="size-12 text-green-500" />
            <Button
              className="w-full"
              onClick={() =>
                router.push(invite?.projectId ? `/project/${invite.projectId}` : "/")
              }
            >
              Go to project
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (decision === "decline" || declineMutation.isSuccess) {
    return (
      <div className="flex min-h-svh items-center justify-center py-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Invitation declined</CardTitle>
            <CardDescription>
              You have declined the invitation to {invite?.projectName}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <XCircle className="size-12 text-muted-foreground" />
            <Button className="w-full" onClick={() => router.push("/")}>
              Go to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center py-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Project Invitation</CardTitle>
          <CardDescription>
            You have been invited to join{" "}
            <span className="font-semibold text-foreground">
              {invite?.projectName}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 text-center">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">
              Invited email: {invite?.email}
            </p>
            <div>
              <Badge variant="secondary">{invite?.role}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Expires {invite?.expiresAt ? new Date(invite.expiresAt).toLocaleDateString() : "soon"}
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-2">
            <Button
              variant="secondary"
              disabled={acceptMutation.isPending || declineMutation.isPending}
              onClick={() => declineMutation.mutate({ token })}
            >
              {declineMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Decline"
              )}
            </Button>
            <Button
              disabled={acceptMutation.isPending || declineMutation.isPending}
              onClick={() => acceptMutation.mutate({ token })}
            >
              {acceptMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Accept"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
