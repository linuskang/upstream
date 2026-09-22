import { House } from "lucide-react"

export interface Project {
  owner: string
  project: string
  href: string
}

export interface NavLink {
  label: string
  href: string
  icon: React.ReactNode
}

export const general: NavLink[] = [
  { label: "Dashboard", href: "/dashboard", icon: <House /> },
]

export const projects: Project[] = [
  { owner: "linus", project: "my-project", href: "/1" },
  { owner: "linus", project: "my-project", href: "/2" },
  { owner: "linus", project: "my-project", href: "/3" },
  { owner: "linus", project: "my-project", href: "/4" },
  { owner: "linus", project: "my-project", href: "/5" },
]