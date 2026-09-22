"use client"

// Libraries
import Link from "next/link"
import { usePathname } from "next/navigation"
import { authClient } from "@/client/auth"
import { trpc } from "@/lib/trpc"
import { Avatar, AvatarImage } from "@workspace/ui/components/avatar"
import { Form } from "@workspace/ui/components/form"
import { Dialog, DialogContent, DialogTrigger } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useState } from "react"

// Components
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import Image from "next/image"
import { NavUser } from "@/components/sidebar/footer"
import { Plus } from "lucide-react"
import { general, NavLink } from "@/components/sidebar/links"

export function SidebarInsetLayout({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  const { data: session } = authClient.useSession()
  if (!session) return null

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="offcanvas" className="p-1">
        <SidebarHeader className="flex h-16 w-full flex-row items-center">
          <Image
            src="/icon-nobg.svg"
            alt="Upstream"
            width={40}
            height={40}
            priority
          />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <NavMenu items={general} />
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <CreateProjectPopup />
            <SidebarGroupContent>
              <ProjectNavMenu />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-2">
          <NavUser user={{ name: session.user.name, email: session.user.email, avatar: session.user.image! }} />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset
        className={`min-h-0 overflow-hidden border border-border md:h-[calc(100svh-1rem)] md:peer-data-[variant=inset]:peer-data-[state=collapsed]:m-0 md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-0 md:peer-data-[variant=inset]:peer-data-[state=collapsed]:h-svh md:peer-data-[variant=inset]:peer-data-[state=collapsed]:rounded-none ${className ?? ""}`}
      >
        <header className="flex h-10 shrink-0 items-center gap-2 border-b border-border bg-sidebar">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function ProjectNavMenu() {
  const pathname = usePathname()

  const { data: projects } = trpc.project.list.useQuery()

  return (
    <SidebarMenu>
      {projects?.map((p) => {
        const isActive = pathname === `/project/${p.id}`

        return (
          <SidebarMenuItem key={p.id}>
            <SidebarMenuButton
              render={<Link href={`/project/${p.id}`} />}
              isActive={isActive}
              tooltip={`${p.owner?.name}/${p.name}`}
            >
              <span className="flex min-w-0 items-center gap-1">
                <Avatar className="h-5 w-5">
                  <AvatarImage className="rounded-sm" src={p.owner?.image ?? ""} alt={p.owner?.name ?? ""} />
                </Avatar>
                <span className="truncate text-muted-foreground ml-1">{p.owner?.name}</span>
                <span className="text-muted-foreground">/</span>
                <span className="truncate">{p.name}</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}

function NavMenu({ items }: { items: NavLink[] }) {
  const pathname = usePathname()

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            render={<Link href={item.href} />}
            isActive={pathname === item.href}
            tooltip={item.label}
          >
            {item.icon}
            <span>{item.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

type CreateProjectForm = {
  projectName: string
}

function CreateProjectPopup() {
  const router = useRouter()
  const utils = trpc.useUtils()
  const [open, setOpen] = useState(false)

  const createProject = trpc.project.create.useMutation({
    onSuccess: async (project) => {
      await utils.project.list.invalidate()

      setOpen(false)
      toast.success("Project created successfully")
      router.push(`/project/${project.id}`)
    },

    onError: (error) => {
      toast.error(error.message)
      console.error(error)
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <SidebarGroupAction
            className="text-muted-foreground"
            aria-label="Add project"
            title="Add project"
          />
        }
      >
        <Plus />
      </DialogTrigger>

      <DialogContent className="w-full max-w-md gap-1">
        <h1 className="text-lg font-semibold">
          Create a new project
        </h1>
        <p className="text-sm text-muted-foreground">
          Add a new project to start logging events
        </p>

        <div className="mt-4">
          <Form<CreateProjectForm>
            onSubmit={(values: CreateProjectForm) => {
              createProject.mutate({ name: values.projectName })
            }}
          >
            <Form.Field name="projectName" required>
              <Input placeholder="Project name" disabled={createProject.isPending} />
            </Form.Field>

            <Form.Error className="mt-2 text-sm text-destructive" name="projectName" />

            <Form.Submit>
              <Button className="mt-4" variant="primary" disabled={createProject.isPending}>
                Create Project
              </Button>
            </Form.Submit>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}