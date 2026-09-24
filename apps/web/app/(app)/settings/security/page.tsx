"use client"

// Libraries
import { authClient } from "@workspace/auth/client"
import Link from "next/link"
import { toast } from "sonner"
import { useEffect, useState } from "react"

// Components
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@workspace/ui/components/card"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Form } from "@workspace/ui/components/form"
import { Skeleton } from "@workspace/ui/components/skeleton"

type SecurityFormData = {
  currentPassword: string
  newPassword: string
  revokeSessions: boolean
}

type ActiveSession = {
  id: string
  createdAt: Date
  updatedAt: Date
  userId: string
  expiresAt: Date
  token: string
  ipAddress?: string | null
  userAgent?: string | null
}

function formatSessionDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

export default function Page() {
  const { data: session } = authClient.useSession()
  const [sessions, setSessions] = useState<ActiveSession[] | null>(null)
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)

  useEffect(() => {
    async function fetchSessions() {
      const { data, error } = await authClient.listSessions()

      if (error) {
        toast.error("Failed to load active sessions.")
        setIsLoadingSessions(false)
        return
      }

      setSessions(data as ActiveSession[])
      setIsLoadingSessions(false)
    }

    fetchSessions()
  }, [])

  async function revokeSession(token: string) {
    const { error } = await authClient.revokeSession({ token })

    if (error) {
      toast.error("Failed to revoke session.")
      return
    }

    setSessions((prev) => prev?.filter((s) => s.token !== token) ?? null)
    toast.success("Session revoked.")
  }

  if (!session) {
    return null
  }

  return (
    <div className="flex min-h-svh flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Breadcrumb>
          <BreadcrumbList className="text-sm">
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/settings" />}>
                Settings
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Security</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Card className="bg-card ring-0">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-white">
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Form<SecurityFormData>
            id="security"
            formOptions={{
              defaultValues: {
                currentPassword: "",
                newPassword: "",
                revokeSessions: false,
              },
            }}
            onSubmit={async (data) => {
              const { error } = await authClient.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
                revokeOtherSessions: data.revokeSessions,
              })

              if (error) {
                toast.error("Failed to update password.")
                return
              }

              toast.success("Password updated successfully.")
            }}
          >
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Form.Label name="currentPassword" className="font-semibold">
                  Current Password
                </Form.Label>
                <Form.Field name="currentPassword">
                  <Input type="password" placeholder="Enter current password" />
                </Form.Field>
              </div>

              <div className="space-y-1.5">
                <Form.Label name="newPassword" className="font-semibold">
                  New Password
                </Form.Label>
                <Form.Field name="newPassword">
                  <Input type="password" placeholder="Enter new password" />
                </Form.Field>
              </div>

              <div className="space-y-1.5">
                <Form.Label name="revokeSessions" className="font-semibold">
                  Revoke Other Sessions
                </Form.Label>
                <Form.Field
                  name="revokeSessions"
                  override={({ field }) => ({
                    checked: field.value,
                    onCheckedChange: field.onChange,
                  })}
                >
                  <Checkbox aria-label="Sign out of other sessions" />
                </Form.Field>
              </div>

              <Form.Submit>
                <Button size="sm">Save Changes</Button>
              </Form.Submit>
            </div>
          </Form>
        </CardContent>
      </Card>

      <Card className="bg-card ring-0">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-white">
            Active Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoadingSessions ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : sessions?.length ? (
            <div className="space-y-2">
              {sessions.map((s) => {
                const isCurrent = s.id === session.session.id

                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-4 rounded-lg border border-border/40 p-3"
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {s.userAgent || "Unknown device"}
                        </p>
                        {isCurrent && (
                          <span className="shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {s.ipAddress ? `${s.ipAddress} · ` : ""}
                        {formatSessionDate(s.createdAt)}
                      </p>
                    </div>
                    {!isCurrent && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => revokeSession(s.token)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No active sessions found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
