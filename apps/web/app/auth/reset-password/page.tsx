"use client"

import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"

import { authClient } from "@workspace/auth/client"
import { Form } from "@workspace/ui/components/form"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

function ResetPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  if (!token) {
    return <InvalidLink />
  }

  if (done) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-center text-xs text-muted-foreground">
          Your password has been reset. You can now sign in with your new
          password.
        </p>

        <Button
          type="button"
          variant="default"
          onClick={() => router.push("/auth/sign-in")}
        >
          Go to sign in
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Form
        formOptions={{
          defaultValues: {
            newPassword: "",
          },
        }}
        onSubmit={async (values) => {
          setError(null)

          const { error } = await authClient.resetPassword({
            newPassword: values.newPassword,
            token,
          })

          if (error) {
            setError(error.message ?? "Something went wrong")
            return
          }

          setDone(true)
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Form.Label name="newPassword">New password</Form.Label>

            <Form.Field
              name="newPassword"
              required
              rules={{
                minLength: {
                  value: 8,
                  message: "Use at least 8 characters",
                },
              }}
            >
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="Enter a new password"
              />
            </Form.Field>

            <Form.Error
              name="newPassword"
              className="text-xs text-destructive"
            />

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <Form.Submit>
            <Button variant="default">Reset password</Button>
          </Form.Submit>
        </div>
      </Form>
    </div>
  )
}

function InvalidLink() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-xs text-muted-foreground">
        This reset link is invalid or has expired. Request a new one below.
      </p>

      <Button
        type="button"
        variant="secondary"
        onClick={() => (window.location.href = "/auth/forgot-password")}
      >
        Request a new link
      </Button>
    </div>
  )
}

export default function Page() {
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
          Reset your password
        </h1>

        <Suspense
          fallback={
            <p className="text-center text-xs text-muted-foreground">
              Checking your reset link…
            </p>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
