"use client"

// Libraries
import { Suspense, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { authClient } from "@/client/auth"

// Components
import { Github } from "@/components/icons"
import { Form } from "@workspace/ui/components/form"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import styles from "../login/page.module.css"
import { Links } from "../navbar"

type RegisterForm = {
  name: string
  email: string
  password: string
  agree: boolean
}

export default function Page() {
  return (
    <Suspense fallback={<RegisterSkeleton />}>
      <RegisterContent />
    </Suspense>
  )
}

function RegisterSkeleton() {
  return (
    <div className="relative isolate flex min-h-svh items-center justify-center overflow-hidden px-4 py-8">
      <div className={styles.background} aria-hidden="true" />
      <Card className="relative z-10 w-full max-w-sm gap-5 bg-card-2 p-5 ring-0 backdrop-blur-xl">
        <CardContent className="flex items-center justify-center py-10">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    </div>
  )
}

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") ?? "/"
  const [authError, setAuthError] = useState<string | null>(null)

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
            Create your account
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5 p-3">
          <Button
            variant="default"
            className="flex w-full items-center justify-center gap-2"
            onClick={async () => {
              await authClient.signIn.social({
                provider: "github",
                callbackURL: redirectTo,
              })
            }}
          >
            <Github />
            Continue with GitHub
          </Button>

          <Form<RegisterForm>
            formOptions={{
              defaultValues: {
                name: "",
                email: "",
                password: "",
                agree: false,
              },
            }}
            onSubmit={async (data: RegisterForm) => {
              setAuthError(null)

              const { error } = await authClient.signUp.email({
                name: data.name,
                email: data.email,
                password: data.password,
                callbackURL: redirectTo,
              })

              if (error) {
                setAuthError(error.message || "Something went wrong")
                return
              }

              toast.success(
                "Account created. Check your email to verify your account."
              )
              router.push(
                `/login${redirectTo !== "/" ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`
              )
            }}
          >
            <div className="mb-2">
              <Form.Label<RegisterForm> name="name">Your name</Form.Label>
              <Form.Field<RegisterForm> name="name" required>
                <Input placeholder="name" autoComplete="name" className="h-8" />
              </Form.Field>
              <Form.Error
                name="name"
                className="mt-1 text-sm text-destructive"
              />
            </div>

            <div className="mb-2">
              <Form.Label<RegisterForm> name="email">Your email</Form.Label>
              <Form.Field<RegisterForm> name="email" required>
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

            <div className="mb-3">
              <Form.Label<RegisterForm> name="password">
                Your password
              </Form.Label>
              <Form.Field<RegisterForm>
                name="password"
                required
                rules={{ minLength: 8 }}
              >
                <Input
                  type="password"
                  placeholder="password"
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

            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Form.Field<RegisterForm>
                name="agree"
                required="You must agree to the Terms of Service"
                override={({ field }) => ({
                  checked: field.value,
                  onCheckedChange: field.onChange,
                })}
              >
                <Checkbox aria-label="I agree to the Terms of Service" />
              </Form.Field>
              <span>
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="font-semibold text-foreground hover:underline"
                >
                  Terms of Service
                </Link>
              </span>
            </label>
            <Form.Error
              name="agree"
              className="mt-1 text-sm text-destructive"
            />

            {authError && (
              <p className="mt-2 text-center text-sm text-destructive">
                {authError}
              </p>
            )}

            <Form.Submit>
              <Button variant="default" className="mt-4 h-8 w-full">
                Create account
              </Button>
            </Form.Submit>

            <Link
              href={`/login${redirectTo !== "/" ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`}
              className="mt-2 flex items-center justify-center gap-1 text-xs font-semibold text-muted-foreground hover:underline"
            >
              Already have an account?
            </Link>
          </Form>
        </CardContent>
      </Card>

      <Links />
    </div>
  )
}
