"use client"

import { authClient } from "@/client/auth"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Form } from "@workspace/ui/components/form"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { UserRoundKey } from "lucide-react"
import { GithubIcon, GoogleIcon } from "@workspace/ui/components/icons"

function LastUsedBadge({ show }: { show: boolean }) {
  if (!show) return null

  return (
    <Badge variant="secondary" className="absolute -right-2 -top-2">
      Last used
    </Badge>
  )
}

export default function Page() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastMethod, setLastMethod] = useState<string | null>(null)
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()

  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      setLastMethod(authClient.getLastUsedLoginMethod()),
    )

    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (!isPending && session) {
      router.push("/dashboard")
    }
  }, [isPending, session, router])

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
          Sign in to Upstream
        </h1>

        <div className="flex flex-col gap-2">
          <Form
            formOptions={{
              defaultValues: {
                email: "",
                password: "",
                rememberMe: false
              },
            }}
            onSubmit={async (values) => {
              await authClient.signIn.email({
                email: values.email,
                password: values.password,
                rememberMe: values.rememberMe,
              }, {
                onSuccess: () => {
                  router.push("/dashboard")
                },

                onError: (ctx) => {
                  setError(ctx.error.message)
                },

                onRequest: () => {
                  setPending(true)
                }
              })
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
              </div>

              <div className="flex flex-col gap-1.5">
                <Form.Label name="password">Password</Form.Label>

                <Form.Field name="password" required>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                  />
                </Form.Field>

                <Form.Error name="password" className="text-xs text-destructive" />

                {error && (
                  <p className="text-xs text-destructive">{error}</p>
                )}

                <a
                  className="self-end text-xs text-link hover:underline"
                  href="/auth/forgot-password"
                >
                  Forgot your password?
                </a>
              </div>

              <div className="flex items-center gap-2">
                <Form.Field
                  name="rememberMe"
                  override={({ field }) => ({
                    checked: Boolean(field.value),
                    onCheckedChange: (checked: boolean) =>
                      field.onChange(checked),
                  })}
                >
                  <Checkbox />
                </Form.Field>

                <span className="select-none">Remember me</span>
              </div>

              <Form.Submit>
                <Button variant="default" disabled={pending} className="relative">
                  Sign in
                  <LastUsedBadge show={lastMethod === "email"} />
                </Button>
              </Form.Submit>
            </div>
          </Form>

          <Button type="button" variant="secondary" disabled={pending}>
            <UserRoundKey className="h-4 w-4" />
            Passkey
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By signing in you accept the{" "}
          <a className="text-link hover:underline" href="#">
            Terms of Use
          </a>{" "}
          and acknowledge the{" "}
          <a className="text-link hover:underline" href="#">
            Privacy Statement
          </a>{" "}
          and{" "}
          <a className="text-link hover:underline" href="#">
            Cookie Policy
          </a>
          .
        </p>

        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account yet?{" "}
          <a className="text-link hover:underline" href="/auth/sign-up">
            Register now
          </a>
        </p>

        <div className="my-2 flex items-center gap-3 text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs">or sign in with</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant={lastMethod === "github" ? "default" : "secondary"}
            className="relative"
            disabled={pending}
            onClick={() =>
              authClient.signIn.social({
                provider: "github",
              })
            }
          >
            <GithubIcon /> GitHub
            <LastUsedBadge show={lastMethod === "github"} />
          </Button>

          <Button
            type="button"
            variant={lastMethod === "google" ? "default" : "secondary"}
            className="relative"
            disabled={pending}
            onClick={() =>
              authClient.signIn.social({
                provider: "google",
              })
            }
          >
            <GoogleIcon /> Google
            <LastUsedBadge show={lastMethod === "google"} />
          </Button>
        </div>
      </div>
    </div>
  )
}
