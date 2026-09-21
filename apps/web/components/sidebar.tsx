"use client"

// Libraries
import Link from "next/link"
import { usePathname } from "next/navigation"

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
import { NavUser } from "@/components/sidebar-user"
import { TeamSwitcher } from "@/components/sidebar-header"
import { Plus, Logs, Settings, House } from "lucide-react"

// Types
interface Project {
  owner: string
  project: string
  href: string
}

interface NavLink {
  label: string
  href: string
  icon: React.ReactNode
}

const general: NavLink[] = [
  { label: "Dashboard", href: "/", icon: <House /> },
]

const projects: Project[] = [
  { owner: "linus", project: "my-project", href: "/1" },
  { owner: "linus", project: "my-project", href: "/2" },
  { owner: "linus", project: "my-project", href: "/3" },
  { owner: "linus", project: "my-project", href: "/4" },
  { owner: "linus", project: "my-project", href: "/5" },
]

const teamLinks: NavLink[] = [
  { label: "Audit Logs", href: "/team/manage-projects", icon: <Logs /> },
  { label: "Settings", href: "/team/settings", icon: <Settings /> },
]

export function SidebarInsetLayout({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="offcanvas" className="p-1">
        <SidebarHeader className="flex h-16 w-full flex-row items-center">
          <TeamSwitcher
            teams={["Linus's Team", "Acme Team"]}
            defaultTeam="Linus's Team"
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
            <SidebarGroupAction className="text-muted-foreground"
              type="button"
              aria-label="Add project"
              title="Add project"
            >
              <Plus />
            </SidebarGroupAction>
            <SidebarGroupContent>
               <ProjectNavMenu items={projects} />
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Team</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavMenu items={teamLinks} />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-2">
          <NavUser user={{ name: "John Doe", email: "john.doe@example.com", avatar: "/avatar.jpg" }} />
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

function ProjectNavMenu({ items }: { items: Project[] }) {
  const pathname = usePathname()

  return (
    <SidebarMenu>
      {items.map((item) => {
        const isActive = pathname === item.href

        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              render={<Link href={item.href} />}
              isActive={isActive}
              tooltip={`${item.owner}/${item.project}`}
            >
              <span className="flex min-w-0 items-center gap-1">
                <span className="truncate text-muted-foreground">{item.owner}</span>
                <span className="text-muted-foreground">/</span>
                <span className="truncate">{item.project}</span>
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
