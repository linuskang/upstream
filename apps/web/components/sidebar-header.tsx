"use client"

import * as React from "react"
import {
  Check,
  ChevronsUpDown,
  GalleryVerticalEnd,
  Plus,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"

export function TeamSwitcher({
  teams,
  defaultTeam,
  onCreateTeam,
}: {
  teams: string[]
  defaultTeam: string
  onCreateTeam?: () => void
}) {
  const [selectedTeam, setSelectedTeam] = React.useState(defaultTeam)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              />
            }
          >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <GalleryVerticalEnd className="size-4" />
              </div>
              <div className="flex flex-col ml-1 gap-1 leading-none">
                <span className="truncate font-medium">{selectedTeam}</span>
                <span className="text-muted-foreground">Hobby Plan</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width)"
            align="start"
          >
            {teams.map((team) => (
              <DropdownMenuItem
                key={team}
                onSelect={() => setSelectedTeam(team)}
              >
                {team}
                {team === selectedTeam && <Check className="ml-auto" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onCreateTeam?.()}
            >
              <Plus />
              Create new team
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
