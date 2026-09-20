"use client"

import Image from "next/image"
import { useState } from "react"

import { authClient } from "@/client/auth"
import { Form } from "@workspace/ui/components/form"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

export default function Page() {
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <div className="flex w-full max-w-[22rem] flex-col items-stretch gap-4 text-sm">
        <Image
          className="mx-auto"
          src="/icon-nobg.svg"
          alt="Upstream Logo"
          width={56}
          height={56}
        />

        <h1 className="text-center text-lg font-semibold">
          Forgot your password?
        </h1>

        {sent ? (
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-center text-xs">
              If an account exists for that email, we&apos;ve sent you a link
              to reset your password.
            </p>

            <Button type="button" variant="secondary" onClick={() => setSent(false)}>
              Resend email
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              <a className="text-link hover:underline" href="/auth/sign-in">
                Back to sign in
              </a>
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Form
              formOptions={{
                defaultValues: {
                  email: "",
                },
              }}
              onSubmit={async (values) => {
                setError(null)

                await authClient.requestPasswordReset({
                  email: values.email,
                  redirectTo: "/auth/reset-password",
                })

                setSent(true)
              }}
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Form.Label name="email">Email</Form.Label>

                  <Form.Field name="email" required>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="Enter your email"
                    />
                  </Form.Field>

                  <Form.Error name="email" className="text-xs text-destructive" />

                  {error && (
                    <p className="text-xs text-destructive">{error}</p>
                  )}
                </div>

                <Form.Submit>
                  <Button variant="default">Send reset link</Button>
                </Form.Submit>
              </div>
            </Form>

            <p className="text-center text-xs text-muted-foreground">
              Remembered it?{" "}
              <a className="text-link hover:underline" href="/auth/sign-in">
                Sign in
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}