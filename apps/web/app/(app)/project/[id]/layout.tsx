"use client"

import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import {
  Activity as ActivityIcon,
  BarChart3,
  FileText,
  Layers,
  Settings,
  Users,
} from "lucide-react"

import { useSidebarHeader } from "@/components/sidebar"
import { trpc } from "@/lib/trpc"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

export default function ProjectLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const params = useParams()
  const projectId = String(params.id)
  const { setHeader } = useSidebarHeader()

  useEffect(() => {
    setHeader(<ProjectHeader projectId={projectId} />)

    return () => setHeader(null)
  }, [projectId, setHeader])

  return children
}

function ProjectHeader({ projectId }: { projectId: string }) {
  const pathname = usePathname()
  const projectQuery = trpc.project.get.useQuery({ id: projectId })
  const owner = projectQuery.data?.members.find(
    (member) => member.role === "OWNER"
  )
  const tabsListRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  const value = pathname.endsWith("/analytics")
    ? "analytics"
    : pathname.endsWith("/logs")
      ? "api-logs"
      : pathname.endsWith("/activity")
        ? "activity"
        : pathname.endsWith("/members")
          ? "members"
          : pathname.includes("/settings")
            ? "settings"
            : "events"

  useEffect(() => {
    const activeTab = tabsListRef.current?.querySelector<HTMLElement>(
      '[data-slot="tabs-trigger"][data-active]'
    )
    const tabsList = tabsListRef.current
    if (!activeTab || !tabsList) return

    const activeRect = activeTab.getBoundingClientRect()
    const listRect = tabsList.getBoundingClientRect()
    setIndicator({
      left: activeRect.left - listRect.left,
      width: activeRect.width,
    })
  }, [value])

  return (
    <header className="flex min-h-10 shrink-0 items-center gap-2 border-b border-border bg-sidebar px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex min-w-0 shrink items-center gap-1 text-sm">
        <span className="max-w-20 min-w-0 truncate text-muted-foreground sm:max-w-24">
          {owner?.user.name ?? "Owner"}
        </span>
        <span className="text-muted-foreground">/</span>
        <span className="max-w-20 min-w-0 truncate font-medium sm:max-w-24">
          {projectQuery.data?.name ?? "Project"}
        </span>
      </div>
      <Tabs value={value} className="min-w-0 shrink-0">
        <TabsList ref={tabsListRef} variant="line" className="relative">
          <TabsTrigger
            value="events"
            nativeButton={false}
            className="after:hidden"
            render={<Link href={`/project/${projectId}`} />}
          >
            <Layers className="size-4" />
            Events
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            nativeButton={false}
            className="after:hidden"
            render={<Link href={`/project/${projectId}/analytics`} />}
          >
            <BarChart3 className="size-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger
            value="api-logs"
            nativeButton={false}
            className="after:hidden"
            render={<Link href={`/project/${projectId}/logs`} />}
          >
            <FileText className="size-4" />
            API logs
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            nativeButton={false}
            className="after:hidden"
            render={<Link href={`/project/${projectId}/activity`} />}
          >
            <ActivityIcon className="size-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger
            value="members"
            nativeButton={false}
            className="after:hidden"
            render={<Link href={`/project/${projectId}/members`} />}
          >
            <Users className="size-4" />
            Members
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            nativeButton={false}
            className="after:hidden"
            render={<Link href={`/project/${projectId}/settings`} />}
          >
            <Settings className="size-4" />
            Settings
          </TabsTrigger>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[-5px] h-0.5 bg-foreground transition-[left,width] duration-300 ease-out"
            style={{ left: indicator.left, width: indicator.width }}
          />
        </TabsList>
      </Tabs>
    </header>
  )
}
