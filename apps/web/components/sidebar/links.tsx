"use client"

import { House } from "lucide-react"

export interface NavLink {
  label: string
  href: string
  icon: React.ReactNode
}

export const general: NavLink[] = [
  { label: "Dashboard", href: "/dashboard", icon: <House /> },
]
