"use client"

// Libraries
import { Suspense, useState } from "react"
import { authClient } from "@/client/auth"
import { usePathname } from "next/navigation"

// Components
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
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
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

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

      {!session ? null : !session.user.emailVerified ? (
        <EmailVerificationScreen
          email={session.user.email}
          resendLoading={resendLoading}
          resendSent={resendSent}
          resendError={resendError}
          onResend={async () => {
            setResendLoading(true)
            setResendSent(false)
            setResendError(null)

            const { error } = await authClient.sendVerificationEmail({
              email: session.user.email,
              callbackURL: "/",
            })

            if (error) {
              setResendError(error.message || "An error occurred")
              setResendLoading(false)
              return
            }

            setResendSent(true)
            setResendLoading(false)
          }}
        />
      ) : (
        <>
          {isProjectRoute ? <ProjectNavbar /> : <Navbar />}
          <div className="mx-auto w-full max-w-2xl px-4">{children}</div>
        </>
      )}
    </>
  )
}

function EmailVerificationScreen({
  email,
  resendLoading,
  resendSent,
  resendError,
  onResend,
}: {
  email: string
  resendLoading: boolean
  resendSent: boolean
  resendError: string | null
  onResend: () => void
}) {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md bg-background ring-1 ring-foreground/10">
        <CardHeader className="gap-2 pb-2 text-center">
          <CardTitle className="text-2xl font-bold">
            Verify your email
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 text-center">
            <p className="text-sm text-muted-foreground">
              You need to verify your email address before you can use
              Upstream.
            </p>
            <p className="text-sm text-muted-foreground">
              We sent a verification link to{" "}
              <strong className="text-foreground">{email}</strong>. Please
              check your inbox.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={onResend}
              disabled={resendLoading || resendSent}
              className="h-10 w-full cursor-pointer text-sm font-bold"
            >
              {resendSent
                ? "Email sent!"
                : resendLoading
                  ? "Sending..."
                  : "Resend verification email"}
            </Button>

            {resendSent && (
              <p className="text-center text-sm text-green-600">
                Check your inbox for the verification link.
              </p>
            )}
            {resendError && (
              <p className="text-center text-sm text-destructive">
                {resendError}
              </p>
            )}
          </div>

          <div className="flex justify-center gap-2">
            <Button
              onClick={() => {
                authClient.signOut()
              }}
              variant="outline"
              className="h-9 border-none text-sm"
            >
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
