"use client"

// Libraries
import { useState } from "react"
import Link from "next/link"
import { authClient } from "@/client/auth"

// Components
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { CircleQuestionMark } from "lucide-react"
import { Github } from "@/components/icons"
import styles from "./page.module.css"
import { Form } from "@workspace/ui/components/form"
import Image from "next/image"
import { Links } from "../navbar"

type LoginForm = {
  email: string
  password: string
}

export default function Page() {
  const [authError, setAuthError] = useState<string | null>(null)

  return (
    <div className="relative isolate flex min-h-svh items-center justify-center overflow-hidden px-4 py-20">
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

          <CardTitle className="-mt-3 bg-gradient-to-b from-white to-white/50 bg-clip-text text-5xl font-medium text-transparent">
            Upstream
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5 p-3">
          <Button
            variant="primary"
            className="flex w-full items-center justify-center gap-2"
            onClick={async () => {
              await authClient.signIn.social({
                provider: "github",
              })
            }}
          >
            <Github />
            Continue with GitHub
          </Button>
          <Form<LoginForm>
            onSubmit={async (data: LoginForm) => {
              const { error } = await authClient.signIn.email({
                email: data.email,
                password: data.password,
                callbackURL: "/",
              })

              if (error) {
                if (error.code === "EMAIL_NOT_VERIFIED") {
                  setAuthError(
                    "Your email is not verified. We have resent the verification link to your inbox."
                  )
                } else {
                  setAuthError(error.message || "Something went wrong")
                }
              }
            }}
          >
            <div className="mb-2">
              <div className="flex items-center justify-between">
                <Form.Label<LoginForm> name="email">Your email</Form.Label>

                <Link
                  href="/register"
                  className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:underline"
                >
                  <CircleQuestionMark className="size-3.5" />
                  Don&apos;t have an account?
                </Link>
              </div>
              <Form.Field<LoginForm> name="email" required>
                <Input placeholder="email" className="h-8" />
              </Form.Field>

              <Form.Error
                name="email"
                className="mt-1 text-sm text-destructive"
              />
            </div>

            <div className="mb-2">
              <Form.Label<LoginForm> name="password">Your password</Form.Label>
              <Form.Field<LoginForm> name="password" required>
                <Input placeholder="password" className="h-8" type="password" />
              </Form.Field>

              <Form.Error
                name="password"
                className="mt-1 text-sm text-destructive"
              />

              {authError && (
                <p className="mt-2 text-center text-sm text-destructive">
                  {authError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Form.Submit>
                <Button variant="primary" className="mt-2 h-8 w-full">
                  Log in
                </Button>
              </Form.Submit>

              <Link
                href="/forgot-password"
                className="self-end text-sm text-muted-foreground hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
          </Form>
        </CardContent>
      </Card>

      <Links />
    </div>
  )
}
