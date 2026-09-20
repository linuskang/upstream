"use client"

import { redirect, usePathname, useSearchParams } from "next/navigation"

interface AuthRedirectProps {
  enabled: boolean
}

export function AuthRedirect({ enabled }: AuthRedirectProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (!enabled) {
    const currentUrl =
      searchParams.size > 0
        ? `${pathname}?${searchParams.toString()}`
        : pathname
    redirect(`/login?redirectTo=${encodeURIComponent(currentUrl)}`)
  }

  return null
}
