"use client"

import { authClient } from "@workspace/auth/client"
import { Avatar, AvatarImage } from "@workspace/ui/components/avatar"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  ChevronRight,
  UserRound,
  BriefcaseBusiness,
  AppWindow,
  CreditCard,
  Bell,
} from "lucide-react"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { useState } from "react"

export default function Page() {
  const { data: session, isPending } = authClient.useSession()
  const [open, setOpen] = useState(false)

  if (isPending) {
    return (
      <div className="flex min-h-svh flex-col gap-3 py-6">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="flex min-h-svh flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Account Settings</h1>
      </div>

      <section className="rounded-xl bg-card p-4 ring-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-12 rounded-lg">
              <AvatarImage
                className="rounded-md"
                src={session.user.image || ""}
                alt={session.user.name}
              />
            </Avatar>
            <div>
              <p className="text-base font-semibold text-foreground">
                {session.user.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {session.user.email}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-card ring-0">
        <Link
          href="/settings/profile"
          className="flex items-center justify-between rounded-t-xl border-b border-border/40 px-4 py-4 transition-colors hover:bg-accent/50"
        >
          <div className="flex items-center gap-3">
            <UserRound className="size-5 text-muted-foreground" />
            <span className="text-lg font-medium text-foreground">
              Your Profile
            </span>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
        <Link
          href="/settings/security"
          className="flex items-center justify-between border-b border-border/40 px-4 py-4 transition-colors hover:bg-accent/50"
        >
          <div className="flex items-center gap-3">
            <BriefcaseBusiness className="size-5 text-muted-foreground" />
            <span className="text-lg font-medium text-foreground">
              Account Security
            </span>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
        <Link
          href="/settings/billing"
          className="flex items-center justify-between border-b border-border/40 px-4 py-4 transition-colors hover:bg-accent/50"
        >
          <div className="flex items-center gap-3">
            <CreditCard className="size-5 text-muted-foreground" />
            <span className="text-lg font-medium text-foreground">Billing</span>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
        <Link
          href="/settings/email-notifications"
          className="flex items-center justify-between border-b border-border/40 px-4 py-4 transition-colors hover:bg-accent/50"
        >
          <div className="flex items-center gap-3">
            <Bell className="size-5 text-muted-foreground" />
            <span className="text-lg font-medium text-foreground">
              Email Notifications
            </span>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
        <Link
          href="/settings/pwa"
          className="flex items-center justify-between rounded-b-xl border-b border-border/40 px-4 py-4 transition-colors hover:bg-accent/50"
        >
          <div className="flex items-center gap-3">
            <AppWindow className="size-5 text-muted-foreground" />
            <span className="text-lg font-medium text-foreground">PWA App</span>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      </section>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between rounded-xl bg-card px-4 py-4">
          <AlertDialogTrigger
            render={<button className="text-sm font-medium text-destructive" />}
          >
            Sign out
          </AlertDialogTrigger>
        </div>

        <AlertDialogContent className="bg-card ring-0">
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You’ll be signed out of your account and redirected to login.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="border-0">Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={async () => {
                await authClient.signOut()
              }}
            >
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
