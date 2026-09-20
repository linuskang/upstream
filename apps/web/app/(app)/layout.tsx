"use client"

// Libraries
import { Suspense } from "react"
import Link from "next/link"
import { authClient } from "@/client/auth"
import { usePathname } from "next/navigation"

// Components
import Navbar from "@/components/homepage-navbar"
import ProjectNavbar from "@/components/project-navbar"
import { AuthRedirect } from "./auth-redirect"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { data: session, isPending } = authClient.useSession()
  const pathname = usePathname()
  const isProjectRoute = pathname.startsWith("/project/")

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <>
      <Suspense fallback={null}>
        <AuthRedirect enabled={Boolean(session)} />
      </Suspense>

      {session && !session.user.emailVerified && <EmailVerificationBanner />}

      {isProjectRoute ? <ProjectNavbar /> : <Navbar />}
      <div className="mx-auto w-full max-w-2xl px-4">{children}</div>
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