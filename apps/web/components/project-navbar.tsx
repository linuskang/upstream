//                                  __
//                                 |  \
//  __    __   ______    _______  _| $$_     ______    ______    ______   ______ ____
// |  \  |  \ /      \  /       \|   $$ \   /      \  /      \  |      \ |      \    \
// | $$  | $$|  $$$$$$\|  $$$$$$$ \$$$$$$  |  $$$$$$\|  $$$$$$\  \$$$$$$\| $$$$$$\$$$$\
// | $$  | $$| $$  | $$ \$$    \   | $$ __ | $$   \$$| $$    $$ /      $$| $$ | $$ | $$
// | $$__/ $$| $$__/ $$ _\$$$$$$\  | $$|  \| $$      | $$$$$$$$|  $$$$$$$| $$ | $$ | $$
//  \$$    $$| $$    $$|       $$   \$$  $$| $$       \$$     \ \$$    $$| $$ | $$ | $$
//   \$$$$$$ | $$$$$$$  \$$$$$$$     \$$$$  \$$        \$$$$$$$  \$$$$$$$ \$$  \$$  \$$
//           | $$
//           | $$
//            \$$

"use client"

// Libraries
import { usePathname, useParams } from "next/navigation"
import type { ElementType } from "react"
import Image from "next/image"
import Link from "next/link"

// Components
import { Button } from "@workspace/ui/components/button"
import { Layers, BarChart3, Settings } from "lucide-react"
import { User } from "@/components/user"

// Types
interface NavItem {
  label: string
  path: string
  icon?: ElementType
}

export default function ProjectNavbar() {
  const pathname = usePathname()
  const params = useParams()
  const projectId = params.id as string

  const navItems: NavItem[] = [
    { label: "Events", path: `/project/${projectId}`, icon: Layers },
    {
      label: "Analytics",
      path: `/project/${projectId}/analytics`,
      icon: BarChart3,
    },
    {
      label: "Project Settings",
      path: `/project/${projectId}/settings`,
      icon: Settings,
    },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full bg-background px-3 py-1">
      <div className="mx-auto grid max-w-5xl grid-cols-[auto_1fr_auto] items-center gap-2">
        <div className="flex items-center gap-1">
          <Link href="/">
            <Image src="/logo.png" width={45} height={45} alt="Logo" />
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path
            const Icon = item.icon
            return (
              <Link href={item.path} key={item.path}>
                <Button
                  variant="ghost"
                  className={`rounded-base flex items-center gap-1.5 px-2.5 py-2.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {Icon && <Icon className="size-5" />}
                  <span
                    className={`${isActive ? "inline" : "hidden"} sm:inline`}
                  >
                    {item.label}
                  </span>
                </Button>
              </Link>
            )
          })}
        </div>

        <div className="justify-self-end">
          <User />
        </div>
      </div>
    </nav>
  )
}
