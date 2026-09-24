"use client"

// Libraries
import { authClient } from "@workspace/auth/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { trpc } from "@/lib/trpc"

// Components
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@workspace/ui/components/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Form } from "@workspace/ui/components/form"

import { PageLayout } from "@/components/layout"

// Types
type FormProps = {
  projectName: string
}

export default function Page() {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()
  const utils = trpc.useUtils()
  const createProject = trpc.project.create.useMutation({
    onSuccess: async (project) => {
      await Promise.all([
        utils.project.list.invalidate(),
        utils.usage.stats.invalidate(),
        utils.account.activity.invalidate(),
      ])
      toast.success("Your new project has been created.")
      await router.push(`/project/${project.id}`)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create project")
      console.error(error)
    },
  })

  if (isPending || !session) return null

  function newProject(name: string) {
    createProject.mutate({ name })
  }

  return (
    <PageLayout>
      <div className="flex flex-col gap-1">
        <Breadcrumb>
          <BreadcrumbList className="text-sm">
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/" />}>
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Create a Project</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Form<FormProps>
        onSubmit={(values: FormProps) => {
          newProject(values.projectName)
        }}
      >
        <Card>
          <CardHeader>
            <Form.Title className="text-2xl font-semibold text-white">
              Create a Project
            </Form.Title>
            <Form.Description className="text-sm text-muted-foreground">
              Create a new project and start logging your events.
            </Form.Description>
          </CardHeader>

          <CardContent>
            <Form.Label name="projectName">
              <Label className="mb-2">Project Name</Label>
            </Form.Label>

            <Form.Field name="projectName" required>
              <Input placeholder="My new Project" maxLength={80} autoFocus />
            </Form.Field>

            <Form.Error
              className="mt-2 text-sm text-destructive"
              name="projectName"
            />
          </CardContent>

          <CardFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={createProject.isPending}
            >
              <Link href="/">Cancel</Link>
            </Button>

            <Form.Submit>
              <Button variant="default">
                {createProject.isPending ? "Waiting..." : "Create Project"}
              </Button>
            </Form.Submit>
          </CardFooter>
        </Card>
      </Form>
    </PageLayout>
  )
}
