"use client"

// Libraries
import Link from "next/link"
import { toast } from "sonner"
import { authClient } from "@/client/auth"

// Components
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { CircleCheck, CircleX } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@workspace/ui/components/card"
import { Switch } from "@workspace/ui/components/switch"

export default function Page() {
  const { data: session, isPending } = authClient.useSession()
  if (isPending || !session) {
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
              <BreadcrumbPage>Email Notifications</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle className="text-lg font-semibold text-white">
            {session.user.emailNotificationsEnabled ? (
              <CircleCheck className="mr-2 inline-block h-5 w-5 text-success" />
            ) : (
              <CircleX className="mr-2 inline-block h-5 w-5 text-destructive" />
            )}
            Email Event Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="-mt-3 p-0">
          <div className="space-y-3">
            {session.user.emailNotificationsEnabled ? (
              <p className="text-sm font-medium text-muted-foreground">
                Email alerts are enabled for your account. We recommend keeping
                them on.
              </p>
            ) : (
              <p className="text-sm font-medium text-muted-foreground">
                Email alerts are disabled for your account. We recommend keeping
                them on.
              </p>
            )}
            <Switch
              checked={session.user.emailNotificationsEnabled}
              onCheckedChange={async (checked) => {
                try {
                  await authClient.updateUser({
                    emailNotificationsEnabled: checked,
                  })
                  toast.success(
                    `Email alerts ${checked ? "enabled" : "disabled"} for your account.`
                  )
                } catch (error) {
                  console.error(error)
                  toast.error("Failed to update email alert settings.")
                }
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
