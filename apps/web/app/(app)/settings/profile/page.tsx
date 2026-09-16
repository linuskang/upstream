"use client"

// Libraries
import { authClient } from "@/client/auth"
import Link from "next/link"
import { toast } from "sonner"
import Image from "next/image"

// Components
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@workspace/ui/components/card"
import { Form } from "@workspace/ui/components/form"

type FormData = {
  name: string
  image: string
}

export default function Page() {
  const { data: session, refetch } = authClient.useSession()

  if (!session) {
    return null
  }

  return (
    <div className="flex min-h-svh flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Breadcrumb>
          <BreadcrumbList className="text-sm">
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/settings" />}>
                Settings
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Profile</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Card className="bg-card ring-0">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-white">
            Your Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Form<FormData>
            key={session.user.id}
            id="profile"
            formOptions={{
              defaultValues: {
                name: session.user.name,
                image: session.user.image || "",
              },
            }}
            onSubmit={async (data) => {
              await authClient.updateUser({
                name: data.name,
                image: data.image,
              })
              await refetch()
              toast.success("Profile updated successfully!")
            }}
          >
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Form.Label name="name" className="font-semibold">
                  Display Name
                </Form.Label>
                <Form.Field name="name">
                  <Input placeholder="Your display name" />
                </Form.Field>
              </div>

              <div className="space-y-1.5">
                <Form.Label name="image" className="font-semibold">
                  Profile Image URL
                </Form.Label>
                <Form.Field name="image">
                  <Input placeholder="https://example.com/avatar.png" />
                </Form.Field>
              </div>

              {session.user.image && (
                <div className="flex items-center gap-2">
                  <div className="relative size-12 overflow-hidden rounded-md border border-border/60 bg-secondary">
                    <Image
                      key={session.user.image}
                      src={session.user.image}
                      alt="Avatar preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Form.Label name="email" className="font-semibold">
                  Email
                </Form.Label>
                <Input value={session.user.email} disabled />
              </div>

              <Form.Submit>
                <Button size="sm">Save Changes</Button>
              </Form.Submit>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
