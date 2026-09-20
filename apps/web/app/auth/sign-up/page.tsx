"use client"

import { authClient } from "@/client/auth"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Form } from "@workspace/ui/components/form"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { GithubIcon, GoogleIcon } from "@workspace/ui/components/icons"

export default function Page() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()

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
          Sign up to Upstream
        </h1>

        <Form
          formOptions={{
            defaultValues: {
              name: "",
              email: "",
              password: "",
            },
          }}
          onSubmit={async (values) => {
            await authClient.signUp.email({
              name: values.name,
              email: values.email,
              password: values.password,
            }, {
              onSuccess: () => {
                router.push("/dashboard")
              },

              onError: (ctx) => {
                setPending(false)
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
              <Form.Label name="name">Name</Form.Label>

              <Form.Field name="name" required>
                <Input
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your name"
                />
              </Form.Field>

              <Form.Error name="name" className="text-xs text-destructive" />
            </div>

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

              <Form.Field
                name="password"
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
                  placeholder="Enter your password"
                />
              </Form.Field>

              <Form.Error name="password" className="text-xs text-destructive" />

              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
            </div>

            <Form.Submit>
              <Button variant="default" disabled={pending}>
                {pending ? "Signing up..." : "Sign up"}
              </Button>
            </Form.Submit>
          </div>
        </Form>

        <p className="text-center text-xs text-muted-foreground">
          By signing up you accept the{" "}
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
          Already have an account?{" "}
          <a className="text-link hover:underline" href="/auth/sign-in">
            Sign in
          </a>
        </p>

        <div className="my-2 flex items-center gap-3 text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs">or sign up with</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              authClient.signIn.social({
                provider: "github",
              })
            }
          >
            <GithubIcon /> GitHub
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              authClient.signIn.social({
                provider: "google",
              })
            }
          >
            <GoogleIcon /> Google
          </Button>
        </div>
      </div>
    </div>
  )
}