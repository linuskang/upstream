"use client"

// Libraries
import Link from "next/link"
import { useState, useEffect, useSyncExternalStore } from "react"
import { toast } from "sonner"
import { authClient } from "@/client/auth"
import { subscribeUser, unsubscribeUser, sendNotificationToMe } from "./actions"

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
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@workspace/ui/components/card"
import { Switch } from "@workspace/ui/components/switch"
interface BeforeInstallPromptEvent extends Event {
  prompt: () => void
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

declare global {
  interface Window {
    deferredInstallPrompt?: BeforeInstallPromptEvent
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function useIsPushSupported() {
  return useSyncExternalStore(
    () => () => {},
    () =>
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window,
    () => false
  )
}

export default function Page() {
  const isSupported = useIsPushSupported()
  const { data: session } = authClient.useSession()
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  )

  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(() => {
      if (typeof window === "undefined") return null
      return window.deferredInstallPrompt ?? null
    })

  useEffect(() => {
    if (!isSupported) return

    let cancelled = false

    navigator.serviceWorker
      .register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      })
      .then((registration) => registration.pushManager.getSubscription())
      .then((sub) => {
        if (!cancelled) {
          setSubscription(sub)
        }
      })

    return () => {
      cancelled = true
    }
  }, [isSupported])

  useEffect(() => {
    if (typeof window === "undefined") return

    const handler = (event: BeforeInstallPromptEvent) => {
      event.preventDefault()
      setInstallPrompt(event)
    }

    window.addEventListener("beforeinstallprompt", handler as EventListener)

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handler as EventListener
      )
    }
  }, [])

  if (!session) {
    return null
  }

  async function installApp() {
    if (!installPrompt) return

    installPrompt.prompt()

    const result = await installPrompt.userChoice

    if (result.outcome === "accepted") {
      toast.success("Upstream installed successfully!")
    }

    setInstallPrompt(null)
    window.deferredInstallPrompt = undefined
  }

  async function subscribeToPush() {
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    })
    setSubscription(sub)
    const serializedSub = JSON.parse(JSON.stringify(sub))
    await subscribeUser(serializedSub)
  }

  async function unsubscribeFromPush() {
    if (subscription) {
      await subscription.unsubscribe()
      await unsubscribeUser(subscription.endpoint)
      setSubscription(null)
    }
  }

  async function sendTestNotification() {
    if (subscription) {
      await sendNotificationToMe("This is a test notification from Upstream!")
    }
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
              <BreadcrumbPage>PWA</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle className="text-lg font-semibold text-white">
            Install Upstream as a PWA
          </CardTitle>
          <CardContent className="p-0">
            <p className="text-sm font-medium text-muted-foreground">
              Install Upstream as a PWA on your mobile device.
            </p>

            <Button
              variant="primary"
              onClick={installApp}
              disabled={!installPrompt}
              className="mt-4"
            >
              Install Upstream PWA App
            </Button>

            {!installPrompt && (
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                This device doesn&apos; t support automatic installation. To
                install, open this page in your mobile browser and look for the
                &apos;Add to Home Screen&apos; option in the browser menu.
              </p>
            )}
          </CardContent>
        </CardHeader>
      </Card>

      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle className="text-lg font-semibold text-white">
            {isSupported ? (
              <CircleCheck className="mr-2 inline-block h-5 w-5 text-success" />
            ) : (
              <CircleX className="mr-2 inline-block h-5 w-5 text-destructive" />
            )}
            {isSupported
              ? "Push notifications are supported"
              : "Push notifications not supported"}
          </CardTitle>
          <CardContent className="p-0">
            <p className="text-sm font-medium text-muted-foreground">
              Push notifications are supported in this browser.{" "}
              {!subscription && (
                <span>
                  However, this device doesn&apos;t have permissions enabled.
                </span>
              )}
            </p>
          </CardContent>
        </CardHeader>
      </Card>

      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle className="text-lg font-semibold text-white">
            {subscription ? (
              <CircleCheck className="mr-2 inline-block h-5 w-5 text-success" />
            ) : (
              <CircleX className="mr-2 inline-block h-5 w-5 text-destructive" />
            )}
            Device Status
          </CardTitle>
          <CardContent className="p-0">
            {subscription ? (
              <p className="text-sm font-medium text-muted-foreground">
                Notifications are enabled for this device. No further actions is
                required.
              </p>
            ) : (
              <p className="text-sm font-medium text-muted-foreground">
                Notification permissions are denied on this device. You
                won&apos;t recieve push notifications until permission is
                granted.
              </p>
            )}

            <div className="mt-4 flex gap-2">
              {subscription ? (
                <>
                  <Button variant="secondary" onClick={sendTestNotification}>
                    Send Test Notification
                  </Button>
                  <Button variant="primary" onClick={unsubscribeFromPush}>
                    Disallow Push Notifications
                  </Button>
                </>
              ) : (
                <Button variant="primary" onClick={subscribeToPush}>
                  Allow Push Notifications
                </Button>
              )}
            </div>
          </CardContent>
        </CardHeader>
      </Card>
      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle className="text-lg font-semibold text-white">
            {session.user.pushNotificationsEnabled ? (
              <CircleCheck className="mr-2 inline-block h-5 w-5 text-success" />
            ) : (
              <CircleX className="mr-2 inline-block h-5 w-5 text-destructive" />
            )}
            Account-level Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="-mt-3 p-0">
          <div className="space-y-3">
            {session.user.pushNotificationsEnabled ? (
              <p className="text-sm font-medium text-muted-foreground">
                Push notifications are enabled for your account. We recommend
                keeping them on.
              </p>
            ) : (
              <p className="text-sm font-medium text-muted-foreground">
                Push notifications are disabled for your account. We recommend
                keeping them on.
              </p>
            )}
            <Switch
              checked={session.user.pushNotificationsEnabled}
              onCheckedChange={async (checked) => {
                try {
                  await authClient.updateUser({
                    pushNotificationsEnabled: checked,
                  })
                  toast.success(
                    `Push notifications ${checked ? "enabled" : "disabled"} for your account.`
                  )
                } catch (error) {
                  console.error(error)
                  toast.error("Failed to update push notification settings.")
                }
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
