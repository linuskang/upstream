"use client"

import { authClient } from "@workspace/auth/client"
import { toast } from "sonner"
import Image from "next/image"

import { Form } from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"

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
    <div>
      <h1 className="text-2xl font-semibold">Profile</h1>
      <p className="text-sm text-muted-foreground">
        Manage your profile information
      </p>

      <div className="mt-4">
        <Form<FormData>
          onSubmit={async (d) => {
            await authClient.updateUser({
              name: d.name,
              image: d.image,
            })

            await refetch()
            toast.success("Success")
          }}

          formOptions={{
            defaultValues: {
              name: session.user.name,
              image: session.user.image || "",
            },
          }}
        >
          <div>
            <Form.Label name="name">
              <h1 className="mb-1 text-sm font-semibold">Display Name</h1>
            </Form.Label>
            <Form.Field name="name" required>
              <Input placeholder="Display Name" />
            </Form.Field>
            <p className="mt-1 text-xs text-muted-foreground">
              This name is shown to other users.
            </p>
            <Form.Error name="name" />
          </div>

          <div className="mt-4">
            <Form.Label name="image">
              <h1 className="mb-1 text-sm font-semibold">Profile Image</h1>
            </Form.Label>

            <Form.Field name="image">
              <Input placeholder="https://your-profile-image.com" />
            </Form.Field>

            <p className="mt-1 text-xs text-muted-foreground">
              Must start with https://
            </p>

            {session.user.image && (
              <>
                <div className="relative mt-2 size-12 overflow-hidden rounded-md">
                  <Image
                    key={session.user.image}
                    src={session.user.image}
                    alt="Avatar preview"
                    fill
                    unoptimized
                    className="rounded-md object-cover"
                  />
                </div>

                <p className="mt-1 text-xs text-muted-foreground">Preview</p>
              </>
            )}
          </div>

          <div className="mt-4">
            <Form.Submit>
              <Button variant="primary">Save Profile</Button>
            </Form.Submit>
          </div>
        </Form>
      </div>
    </div>
  )
}
