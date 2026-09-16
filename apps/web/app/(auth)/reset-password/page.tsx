"use client"

// Libraries
import { Suspense, useState } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/client/auth"

import { Links } from "../navbar"

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

type ResetPasswordForm = {
  password: string
  confirmPassword: string
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [authError, setAuthError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  return (
    <AuthShell>
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
          Choose a new password
        </CardTitle>
      </CardHeader>

      <CardContent className="p-3">
        <Form<ResetPasswordForm>
          formOptions={{
            defaultValues: {
              password: "",
              confirmPassword: "",
            },
          }}
          onSubmit={async (data: ResetPasswordForm) => {
            setAuthError(null)
            setSuccess(false)

            if (!token) {
              setAuthError("This reset link is invalid or missing its token.")
              return
            }

            const { error } = await authClient.resetPassword({
              newPassword: data.password,
              token,
            })

            if (error) {
              setAuthError(error.message || "Something went wrong")
              return
            }

            setSuccess(true)
            router.replace("/login")
          }}
        >
          <div className="mb-2">
            <Form.Label<ResetPasswordForm> name="password">
              New password
            </Form.Label>
            <Form.Field<ResetPasswordForm>
              name="password"
              required
              rules={{ minLength: 8 }}
            >
              <Input
                type="password"
                placeholder="new password"
                autoComplete="new-password"
                className="h-8"
              />
            </Form.Field>
            <Form.Error
              name="password"
              className="mt-1 text-sm text-destructive"
            >
              {(error) =>
                error.type === "minLength"
                  ? "Password must be at least 8 characters"
                  : error.message
              }
            </Form.Error>
          </div>

          <div className="mb-2">
            <Form.Label<ResetPasswordForm> name="confirmPassword">
              Confirm password
            </Form.Label>
            <Form.Field<ResetPasswordForm>
              name="confirmPassword"
              required
              rules={{
                validate: (value: string, values: ResetPasswordForm) =>
                  value === values.password || "Passwords do not match",
              }}
            >
              <Input
                type="password"
                placeholder="confirm password"
                autoComplete="new-password"
                className="h-8"
              />
            </Form.Field>
            <Form.Error
              name="confirmPassword"
              className="mt-1 text-sm text-destructive"
            />
          </div>

          {!token && (
            <p className="mt-2 text-center text-sm text-destructive">
              This reset link is invalid or missing its token.
            </p>
          )}

          {authError && (
            <p className="mt-2 text-center text-sm text-destructive">
              {authError}
            </p>
          )}

          {success && (
            <p className="mt-2 text-center text-sm text-green-500">
              Your password has been reset successfully.
            </p>
          )}

          <Form.Submit>
            <Button
              variant="primary"
              className="mt-4 h-8 w-full"
              disabled={!token || success}
            >
              Reset password
            </Button>
          </Form.Submit>
        </Form>
      </CardContent>
    </AuthShell>
  )
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-svh items-center justify-center overflow-hidden px-4 py-8">
      <div className={styles.background} aria-hidden="true" />
      <Card className="relative z-10 w-full max-w-sm gap-5 bg-card-2 p-5 ring-0 backdrop-blur-xl">
        {children}
      </Card>
    </div>
  )
}

export default function Page() {
  return (
    <>
      <Suspense
        fallback={
          <AuthShell>
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading reset link...
            </div>
          </AuthShell>
        }
      >
        <ResetPasswordContent />
      </Suspense>

      <Links />
    </>
  )
}
