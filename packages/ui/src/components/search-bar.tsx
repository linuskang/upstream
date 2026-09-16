"use client"

import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { Search, X } from "lucide-react"

export function SearchBar({
  value,
  onChange,
  className,
}: {
  value?: string
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 z-20 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="relative z-10 h-9 w-full border-0 !bg-card pr-8 pl-9 font-medium [&::-webkit-search-cancel-button]:appearance-none"
        placeholder="Search..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onChange("")
        }}
      />
    </div>
  )
}
