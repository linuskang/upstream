"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { authClient } from "@workspace/auth/client"
import { toast } from "sonner"

import { Form } from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import {
  cancelEmailChange,
  getEmailChangeRequest,
  requestEmailChange,
  resendEmailChangeEmail,
} from "./actions"

type EmailFormData = {
  newEmail: string
}

export default function Page() {
  const { data: session, refetch } = authClient.useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const { data: pendingChange, refetch: refetchPending } = useQuery({
    queryKey: ["email-change-request"],
    queryFn: getEmailChangeRequest,
  })

  useEffect(() => {
    const status = searchParams.get("emailChange")
    if (!status) return

    const id = "email-change-status"
    if (status === "done") {
      toast.success("Email address updated", { id })
      refetch()
    } else if (status === "old-verified") {
      toast.success(
        "Current email approved — verification link sent to your new address",
        { id }
      )
    } else if (status === "expired") {
      toast.error("That link has expired. Please request a new email change.", {
        id,
      })
    } else if (status === "invalid") {
      toast.error("That link is invalid.", { id })
    } else if (status === "pending-old") {
      toast.error(
        "Your current email address needs to approve this change first.",
        { id }
      )
    }

    void refetchPending()
    router.replace("/settings/account")
  }, [searchParams, refetch, refetchPending, router])

  if (!session) {
    return null
  }

  async function changeEmail(data: EmailFormData) {
    const result = await requestEmailChange(data.newEmail)
    if ("error" in result) {
      toast.error(result.error)
      return
    }
    toast.success(`Approval link sent to ${session?.user.email}`)
    await refetchPending()
  }

  async function resend() {
    const result = await resendEmailChangeEmail()
    if ("error" in result) {
      toast.error(result.error)
      return
    }
    toast.success("Email resent")
  }

  async function cancel() {
    const result = await cancelEmailChange()
    if ("error" in result) {
      toast.error(result.error)
      return
    }
    toast.success("Email change cancelled")
    await refetchPending()
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Account</h1>
      <p className="text-sm text-muted-foreground">
        Manage your sign-in methods and sessions
      </p>

      <div className="mt-4">
        <Form<EmailFormData> onSubmit={changeEmail}>
          <h2 className="mb-2 font-semibold">Email</h2>
          <Input
            className="!bg-card placeholder:!text-primary"
            placeholder={session.user.email}
            disabled
          />

          <Form.Label name="newEmail">
            <h1 className="mt-2 mb-1 text-sm font-semibold">
              New Email Address
            </h1>
          </Form.Label>

          <Form.Field name="newEmail" required>
            <Input type="email" placeholder="you@example.com" />
          </Form.Field>
          <Form.Error className="text-sm text-destructive" name="newEmail" />

          <div className="mt-4">
            <Form.Submit>
              <Button variant="primary">Change Email</Button>
            </Form.Submit>
          </div>
        </Form>
      </div>

      {pendingChange && (
        <div className="mt-4 max-w-md rounded-md border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">
            {pendingChange.oldVerified
              ? "Verify your new email"
              : "Approve from your current email"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendingChange.oldVerified ? (
              <>
                Your current email approved this change. We sent a verification
                link to{" "}
                <span className="font-medium text-foreground">
                  {pendingChange.newEmail}
                </span>
                . Your email will update once it&apos;s verified.
              </>
            ) : (
              <>
                We sent an approval link to{" "}
                <span className="font-medium text-foreground">
                  {session.user.email}
                </span>
                . Once approved, a verification link will be sent to{" "}
                <span className="font-medium text-foreground">
                  {pendingChange.newEmail}
                </span>
                .
              </>
            )}
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={resend}>
              Resend
            </Button>
            <Button variant="ghost" size="sm" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <Separator className="my-8" />
    </div>
  )
}
