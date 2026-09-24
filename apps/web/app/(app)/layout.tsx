"use client"

// Libraries
import { useEffect } from "react"
import Link from "next/link"
import { authClient } from "@workspace/auth/client"
import { useRouter } from "next/navigation"

// Components
import { SidebarInsetLayout } from "@/components/sidebar"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()

  useEffect(() => {
    if (isPending || session) return

    const currentUrl = `${window.location.pathname}${window.location.search}`
    router.replace(`/auth/sign-in?redirectTo=${encodeURIComponent(currentUrl)}`)
  }, [isPending, session, router])

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div>Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <>
      {!session.user.emailVerified && <EmailVerificationBanner />}

      <SidebarInsetLayout>
        <div className="mx-auto w-full max-w-4xl px-4">{children}</div>
      </SidebarInsetLayout>
    </>
  )
}

function EmailVerificationBanner() {
  return (
    <div className="sticky top-0 z-50 flex w-full flex-wrap items-center justify-center gap-x-1 bg-amber-200 px-4 py-1 text-center text-sm font-medium text-primary-foreground">
      <span>
        Please {" "}
        <Link href="/settings/profile" className="font-semibold underline underline-offset-2 hover:opacity-80">
          verify your email
        </Link> {" "}
        to get started.
      </span>
    </div>
  )
}
