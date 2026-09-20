"use client"

// Libraries
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { authClient } from "@/client/auth"

// Components
import { Form } from "@workspace/ui/components/form"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import styles from "../login/page.module.css"
import { Links } from "../navbar"

type ForgotPasswordForm = {
  email: string
}

export default function Page() {
  const [authError, setAuthError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  return (
    <div className="relative isolate flex min-h-svh items-center justify-center overflow-hidden px-4 py-8">
      <div className={styles.background} aria-hidden="true" />
      <Card className="relative z-10 w-full max-w-sm gap-5 bg-card-2 p-5 ring-0 backdrop-blur-xl">
        <CardHeader className="flex flex-col items-center gap-3 p-0 text-center">
          <Image
            src="/icon-nobg.svg"
            alt="Upstream logo"
            width={100}
            height={100}
            priority
            className="scale-120"
          />

          <CardTitle className="-mt-3 text-3xl font-medium text-white/80">
            Reset your password
          </CardTitle>
        </CardHeader>

        <CardContent className="p-3">
          <Form<ForgotPasswordForm>
            formOptions={{
              defaultValues: {
                email: "",
              },
            }}
            onSubmit={async (data: ForgotPasswordForm) => {
              setAuthError(null)
              setSuccess(false)

              const { error } = await authClient.requestPasswordReset({
                email: data.email,
                redirectTo: "/reset-password",
              })

              if (error) {
                setAuthError(error.message || "Something went wrong")
                return
              }

              setSuccess(true)
            }}
          >
            <div className="mb-2">
              <Form.Label<ForgotPasswordForm> name="email">
                Your email
              </Form.Label>
              <Form.Field<ForgotPasswordForm> name="email" required>
                <Input
                  type="email"
                  placeholder="email"
                  autoComplete="email"
                  className="h-8"
                />
              </Form.Field>
              <Form.Error
                name="email"
                className="mt-1 text-sm text-destructive"
              />
            </div>

            {authError && (
              <p className="mt-2 text-center text-sm text-destructive">
                {authError}
              </p>
            )}

            {success && (
              <p className="mt-2 text-center text-sm text-green-500">
                If that email is registered, a reset link has been sent.
              </p>
            )}

            <Form.Submit>
              {({ isSubmitting }) => (
                <Button variant="default" className="mt-4 h-8 w-full">
                  {isSubmitting ? "Sending..." : "Send reset link"}
                </Button>
              )}
            </Form.Submit>

            <Link
              href="/login"
              className="mt-3 flex items-center justify-center gap-1 text-xs font-semibold text-muted-foreground hover:underline"
            >
              Remember your password? Log in
            </Link>
          </Form>
        </CardContent>
      </Card>

      <Links />
    </div>
  )
}
