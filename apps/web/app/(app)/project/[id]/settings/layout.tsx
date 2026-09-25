"use client"

import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { KeyRound, Settings, Webhook } from "lucide-react"

import { CreateApiKeyButton } from "./api-keys/create-api-key"
import { CreateWebhookButton } from "./webhooks/create-webhook"

const tabs = [
  { slug: "", label: "General", icon: Settings, action: null },
  {
    slug: "api-keys",
    label: "API keys",
    icon: KeyRound,
    action: <CreateApiKeyButton />,
  },
  {
    slug: "webhooks",
    label: "Webhooks",
    icon: Webhook,
    action: <CreateWebhookButton />,
  },
] as const

export default function ProjectSettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const params = useParams()
  const pathname = usePathname()
  const projectId = String(params.id)
  const basePath = `/project/${projectId}/settings`

  const activeTab =
    tabs.find((tab) =>
      tab.slug === "" ? pathname === basePath : pathname === `${basePath}/${tab.slug}`
    ) ?? tabs[0]

  return (
    <div className="flex min-h-full flex-1">
      <aside className="w-56 shrink-0 border-r border-border">
        <div className="flex h-12 items-center border-b border-border px-6">
          <span className="text-base font-medium">Settings</span>
        </div>
        <nav className="flex flex-col gap-0.5 p-3">
          {tabs.map((tab) => {
            const href = tab.slug === "" ? basePath : `${basePath}/${tab.slug}`
            const isActive = tab === activeTab

            return (
              <Link
                key={tab.slug}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <tab.icon className="size-4" />
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border px-6">
          <span className="text-base font-medium">{activeTab.label}</span>
          {activeTab.action}
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
