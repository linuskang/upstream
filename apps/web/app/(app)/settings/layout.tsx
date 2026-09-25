"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { useTopBar } from "@/components/sidebar"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

const tabs = [
  { value: "profile", label: "Profile", href: "/settings/profile" },
  { value: "account", label: "Account", href: "/settings/account" },
  { value: "billing", label: "Billing", href: "/settings/billing" },
  { value: "appearance", label: "Appearance", href: "/settings/appearance" },
  { value: "tokens", label: "Tokens", href: "/settings/tokens" },
  {
    value: "authorised-apps",
    label: "Authorised Apps",
    href: "/settings/authorised-apps",
  },
  {
    value: "integrations",
    label: "Integrations",
    href: "/settings/integrations",
  },
] as const

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { setTopBar } = useTopBar()

  useEffect(() => {
    setTopBar(<SettingsTopBar />)

    return () => setTopBar(null)
  }, [setTopBar])

  return children
}

function SettingsTopBar() {
  const pathname = usePathname()
  const tabsListRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  const value =
    tabs.find((tab) => pathname.startsWith(tab.href))?.value ?? ""

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
      <Tabs value={value} className="min-w-0 shrink-0">
        <TabsList ref={tabsListRef} variant="line" className="relative">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              nativeButton={false}
              className="after:hidden"
              render={<Link href={tab.href} />}
            >
              {tab.label}
            </TabsTrigger>
          ))}
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
